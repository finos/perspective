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

import { test } from "@finos/perspective-test";
import {
    compareContentsToSnapshot,
    run_standard_tests,
} from "@finos/perspective-test";

async function getDatagridContents(page) {
    return await page.evaluate(async () => {
        const datagrid = document.querySelector(
            "perspective-viewer perspective-viewer-datagrid"
        );
        if (!datagrid) {
            return "MISSING DATAGRID";
        }
        const regularTable = datagrid.shadowRoot.querySelector("regular-table");
        return regularTable?.innerHTML || "MISSING";
    });
}

test.describe("Datagrid with superstore data set", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Datagrid",
            });
        });
    });

    run_standard_tests("perspective-viewer-datagrid", getDatagridContents);

    test("Row headers are printed correctly", async ({ page }) => {
        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Datagrid",
                group_by: ["Ship Date"],
                split_by: ["Ship Mode"],
                columns: ["Sales", "Quantity", "Discount", "Profit"],
            });
        });

        compareContentsToSnapshot(
            await getDatagridContents(page),
            "row-headers-are-printed-correctly"
        );
    });
});
