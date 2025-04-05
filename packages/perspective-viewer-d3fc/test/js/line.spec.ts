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

import { compareContentsToSnapshot, test } from "@finos/perspective-test";
import {
    getSvgContentString,
    run_standard_tests,
} from "@finos/perspective-test";

test.describe("Line Tests", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "Y Line",
                columns: ["Sales", "Quantity"],
            });
        });
    });

    run_standard_tests(
        "yline",
        getSvgContentString("perspective-viewer perspective-viewer-d3fc-yline")
    );
});

test.describe("Line regressions", () => {
    test("Line charts denser than 1s are not bucketed", async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        const out = await page.evaluate(async () => {
            const timestamp = [
                1743828060000, 1743828060100, 1743828060200, 1743828060300,
                1743828060400, 1743828060500, 1743828060600, 1743828060700,
                1743828060800, 1743828060900,
            ];
            const px = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            // @ts-ignore
            const table = await window.__TEST_WORKER__.table({
                timestamp: "datetime",
                px: "float",
            });

            await table.update({ timestamp, px });

            await document.querySelector("perspective-viewer")!.load(table);
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "Y Line",
                settings: true,
                columns: ["px"],
                group_by: ["timestamp"],
            });

            return document.querySelector("perspective-viewer-d3fc-yline")
                ?.shadowRoot?.innerHTML;
        });

        compareContentsToSnapshot(out!, [
            "line-charts-denser-than-one-second-regression.txt",
        ]);
    });
});
