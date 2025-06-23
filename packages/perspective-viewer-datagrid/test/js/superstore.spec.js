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
    runPerspectiveEventClickTest,
} from "@finos/perspective-test";
import * as prettier from "prettier";

async function getDatagridContents(page) {
    const raw = await page.evaluate(async () => {
        const datagrid = document.querySelector(
            "perspective-viewer perspective-viewer-datagrid"
        );
        if (!datagrid) {
            return "MISSING DATAGRID";
        }
        const regularTable = datagrid.shadowRoot.querySelector("regular-table");
        return regularTable?.innerHTML || "";
    });

    return await prettier.format(raw, {
        parser: "html",
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
            "row-headers-are-printed-correctly.txt"
        );
    });

    test("Column headers are printed correctly, split_by a date column", async ({
        page,
    }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Datagrid",
                columns: ["Sales", "Profit"],
                group_by: ["State"],
                split_by: ["New Col"],
                expressions: { "New Col": "bucket(\"Order Date\",'Y')" },
            });
        });

        compareContentsToSnapshot(
            await getDatagridContents(page),
            "column-headers-are-printed-correctly-split-by-a-date-column.txt"
        );
    });

    test("A filtered-to-empty dataset with group_by and split_by does not error internally", async ({
        page,
    }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Datagrid",
                columns: ["Sales", "Profit"],
                group_by: ["State"],
                split_by: ["Ship Mode"],
                filter: [["State", "==", "Schmexas"]],
            });
        });

        compareContentsToSnapshot(
            await getDatagridContents(page),
            "a-filtered-to-empty-dataset-with-group-by-and-split-by-does-not-error-internally.txt"
        );
    });
});

test.describe("Datagrid with superstore arrow data set", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(
            "/tools/perspective-test/src/html/all-types-small-multi-arrow-test.html"
        );
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

    test(
        `Filter based on date results in correct perspective-click event`,
        runPerspectiveEventClickTest()
    );
});
