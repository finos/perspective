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

import { test, expect } from "@playwright/test";
import { compareContentsToSnapshot } from "@finos/perspective-test";

async function get_contents(page) {
    return await page.evaluate(async () => {
        // @ts-ignore
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
        await document.querySelector("perspective-viewer")!.restore({
            plugin: "Debug",
        });
    });
});

test.describe("Events", () => {
    test("restore fires the 'perspective-config-update' event", async ({
        page,
    }) => {
        const config = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");

            if (!viewer) {
                throw new Error("Viewer not found");
            }
            // @ts-ignore
            await viewer.getTable();
            let config;
            viewer.addEventListener("perspective-config-update", (event) => {
                // @ts-ignore
                config = event.detail;
            });

            // @ts-ignore
            await viewer.restore({
                settings: true,
                group_by: ["State"],
                columns: ["Profit", "Sales"],
            });

            return config;
        });

        expect(config).toEqual({
            aggregates: {},
            split_by: [],
            columns: ["Profit", "Sales"],
            expressions: [],
            filter: [],
            plugin: "Debug",
            plugin_config: {},
            group_by: ["State"],
            settings: true,
            sort: [],
            theme: "Pro Light",
            title: null,
        });

        const contents = await get_contents(page);

        await compareContentsToSnapshot(contents, [
            "restore-fires-the-perspective-config-update-event.txt",
        ]);
    });

    // NOTE: Previously skipped, kept for future reference
    // test.skip("restore with a 'plugin' field fires the 'perspective-plugin-update' event", async ({
    //     page,
    // }) => {
    //     const config = await page.evaluate(async () => {
    //         const viewer = document.querySelector("perspective-viewer");
    //         await viewer.getTable();
    //         let config;
    //         viewer.addEventListener("perspective-plugin-update", (event) => {
    //             config = "DID NOT FAIL";
    //         });

    //         await viewer.restore({
    //             settings: true,
    //             plugin: "Debug",
    //             group_by: ["State"],
    //         });
    //         return config;
    //     });

    //     expect(config).toEqual("Debug");

    //     return await get_contents(page);
    // });
});
