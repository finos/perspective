// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { test, expect } from "@finos/perspective-test";
import { compareContentsToSnapshot } from "@finos/perspective-test";

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
    await page.evaluate(async () => {
        await document.querySelector("perspective-viewer").restore({
            plugin: "Debug",
        });
    });
});

test.describe("leaks", () => {
    // This originally has a timeout of 120000
    test("doesn't leak elements", async ({ page, browserName }) => {
        let viewer = await page.$("perspective-viewer");
        await page.evaluate(async (viewer) => {
            window.__TABLE__ = await viewer.getTable();
            await viewer.reset();
        }, viewer);

        // From a helpful blog
        // https://media-codings.com/articles/automatically-detect-memory-leaks-with-puppeteer
        if (browserName !== "firefox") {
            await page.evaluate(() => window.gc());
        }

        const heap1 = await page.evaluate(() =>
            window.chrome ? performance.memory.usedJSHeapSize : 1
        );

        for (var i = 0; i < 500; i++) {
            await page.evaluate(async () => {
                const element = document.querySelector("perspective-viewer");
                await element.delete();
                await element.free();
                document.body.innerHTML =
                    "<perspective-viewer></perspective-viewer>";

                const new_element =
                    document.querySelector("perspective-viewer");

                await new_element.load(Promise.resolve(window.__TABLE__));
            });
        }

        // TODO this is very generous memory allowance suggests we
        // leak ~0.1% per instance.
        // TODO: Not yet sure how to access window.gc() in Playwright
        if (browserName !== "firefox") {
            await page.evaluate(() => window.gc());
        }

        const heap2 = await page.evaluate(() =>
            window.chrome ? performance.memory.usedJSHeapSize : 1
        );

        expect((heap2 - heap1) / heap1).toBeLessThan(1);

        const contents = await page.evaluate(async () => {
            const element = document.querySelector("perspective-viewer");
            await element.toggleConfig();
            return element.innerHTML;
        });

        await compareContentsToSnapshot(contents, ["does-not-leak.txt"]);
    });

    test("doesn't leak views when setting group by", async ({
        page,
        browserName,
    }) => {
        let viewer = await page.$("perspective-viewer");
        await page.evaluate(async (viewer) => {
            window.__TABLE__ = await viewer.getTable();
            await viewer.reset();
        }, viewer);

        if (browserName !== "firefox") {
            await page.evaluate(() => window.gc());
        }

        const heap1 = await page.evaluate(() =>
            window.chrome ? performance.memory.usedJSHeapSize : 1
        );

        for (var i = 0; i < 500; i++) {
            await page.evaluate(async (element) => {
                await element.reset();
                let pivots = [
                    "State",
                    "City",
                    "Segment",
                    "Ship Mode",
                    "Region",
                    "Category",
                ];
                let start = Math.floor(Math.random() * pivots.length);
                let length = Math.ceil(Math.random() * (pivots.length - start));
                await element.restore({
                    group_by: pivots.slice(start, length),
                });
            }, viewer);
        }

        if (browserName !== "firefox") {
            await page.evaluate(() => window.gc());
        }

        const heap2 = await page.evaluate(() =>
            window.chrome ? performance.memory.usedJSHeapSize : 1
        );
        expect((heap2 - heap1) / heap1).toBeLessThan(0.5);

        const contents = await page.evaluate(async (viewer) => {
            await viewer.restore({ group_by: ["State"] });
            await viewer.toggleConfig();
            return viewer.innerHTML;
        }, viewer);

        await compareContentsToSnapshot(contents, [
            "does-not-leak-when-setting-groupby.txt",
        ]);
    });

    test("doesn't leak views when setting filters", async ({
        page,
        browserName,
    }) => {
        let viewer = await page.$("perspective-viewer");
        await page.evaluate(async (viewer) => {
            window.__TABLE__ = await viewer.getTable();
            await viewer.reset();
        }, viewer);

        if (browserName !== "firefox") {
            await page.evaluate(() => window.gc());
        }

        const heap1 = await page.evaluate(() =>
            window.chrome ? performance.memory.usedJSHeapSize : 1
        );

        for (var i = 0; i < 500; i++) {
            await page.evaluate(async (element) => {
                await element.reset();
                await element.restore({
                    filter: [["Sales", ">", Math.random() * 100 + 100]],
                });
            }, viewer);
        }

        if (browserName !== "firefox") {
            await page.evaluate(() => window.gc());
        }

        const heap2 = await page.evaluate(() =>
            window.chrome ? performance.memory.usedJSHeapSize : 1
        );

        expect((heap2 - heap1) / heap1).toBeLessThan(0.5);
        const contents = await page.evaluate(async (viewer) => {
            await viewer.restore({
                filter: [["Sales", "<", 10]],
            });
            await viewer.toggleConfig();
            return viewer.innerHTML;
        }, viewer);

        await compareContentsToSnapshot(contents, [
            "does-not-leak-when-setting-filters.txt",
        ]);
    });
});
