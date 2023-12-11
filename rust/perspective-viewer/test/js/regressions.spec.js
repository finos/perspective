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

import {
    test,
    expect,
    compareContentsToSnapshot,
    shadow_type,
    DEFAULT_CONFIG,
} from "@finos/perspective-test";

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document
            .querySelector("perspective-viewer")
            .shadowRoot.querySelector("#app_panel");
        return viewer ? viewer.innerHTML : "MISSING";
    });
}

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

test.describe("Regression tests", () => {
    test("copy and export custom elements are registered", async ({ page }) => {
        const export_exists = await page.evaluate(async () => {
            return !!window.customElements.get("perspective-export-menu");
        });

        const copy_exists = await page.evaluate(async () => {
            return !!window.customElements.get("perspective-copy-menu");
        });

        expect(export_exists).toBeTruthy();
        expect(copy_exists).toBeTruthy();
    });

    test("not_in filter works correctly", async ({ page }) => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.restore({
                group_by: ["State"],
                columns: ["Sales"],
                settings: true,
                filter: [
                    ["State", "not in", ["California", "Texas", "New York"]],
                ],
            });
        });

        const contents = await get_contents(page);

        await compareContentsToSnapshot(contents, [
            "regressions-not_in-filter-works-correctly.txt",
        ]);
    });

    test("in filter generates correct array-encoded config", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.restore({
                group_by: ["State"],
                columns: ["Sales"],
                settings: true,
                filter: [["State", "in", []]],
            });

            const filter = viewer.shadowRoot.querySelector(
                ".pivot-column input[type=text]"
            );
            filter.value = "C";
            const event = new Event("input", {
                bubbles: true,
                cancelable: true,
            });

            filter.dispatchEvent(event);
        });

        const elem = await page.waitForSelector("perspective-dropdown");
        await page.evaluate((elem) => {
            let node = elem.shadowRoot.querySelector("span:first-of-type");
            var clickEvent = document.createEvent("MouseEvents");
            clickEvent.initEvent("mousedown", true, true);
            node.dispatchEvent(clickEvent);
        }, elem);

        const config = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.flush();
            return await viewer.save();
        });

        expect(config).toEqual({
            ...DEFAULT_CONFIG,
            columns: ["Sales"],
            filter: [["State", "in", ["California"]]],
            group_by: ["State"],
            plugin: "Debug",
            settings: true,
            theme: "Pro Light",
        });

        const contents = await get_contents(page);
        await compareContentsToSnapshot(contents, [
            "regressions-in-filter-generates-correct-config.txt",
        ]);
    });

    test("Numeric filter input does not trigger render on trailing zeroes", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.restore({
                filter: [["Sales", ">", 1.1]],
                settings: true,
            });
        });

        // await new Promise((x) => setTimeout(x, 10000));

        await shadow_type(
            page,
            "0001",
            true,
            "perspective-viewer",
            "input.num-filter"
        );

        const value = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            return viewer.shadowRoot.querySelector("input.num-filter").value;
        });

        expect(value).toEqual("1.10001");
        const contents = await get_contents(page);
        await compareContentsToSnapshot(contents, [
            "numeric-filter-input-does-not-trigger-render-on-trailing-zeroes.txt",
        ]);
    });
});
