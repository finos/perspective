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

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/blank.html");
    await page.waitForFunction(() => "WORKER" in window);
});

test.describe("viewer.load() method", async () => {
    test("does load a resolved Table promise", async ({ page }) => {
        const viewer = page.locator("perspective-viewer");
        await viewer.evaluate(async (viewer) => {
            const goodTable = (await window.WORKER).table("a,b,c\n1,2,3");
            return viewer.load(goodTable);
        });
        await expect(viewer).toHaveText(/"a","b","c"/); // column titles
    });

    test("is rejected by a rejected Table promise", async ({ page }) => {
        const viewer = page.locator("perspective-viewer");
        await expect(
            viewer.evaluate((viewer) => {
                const errorTable = Promise.reject(new Error("blimpy"));
                return viewer.load(errorTable);
            }),
        ).rejects.toThrow("blimpy");
    });

    test("after a load error, same viewer can load a resolved Table promise", async ({
        page,
    }) => {
        const viewer = page.locator("perspective-viewer");
        const didError = await viewer.evaluate(async (viewer) => {
            const errorTable = Promise.reject(new Error("blimpy"));
            const worker = await window.WORKER;
            let didError = false;
            try {
                await viewer.load(errorTable);
            } catch (e) {
                if (e.message.includes("blimpy")) {
                    didError = true;
                }
            }

            const goodTable = worker.table("a,b,c\n1,2,3");
            await viewer.load(goodTable);
            return didError;
        });
        expect(didError).toBe(true);
    });
});
