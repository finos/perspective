/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test } from "@playwright/test";
import { run_standard_tests } from "@finos/perspective-test";

async function getDatagridContents(page) {
    return await page.evaluate(async () => {
        const viewer = document.querySelector(
            "perspective-viewer perspective-viewer-datagrid regular-table"
        );
        return viewer.innerHTML || "MISSING";
    });
}

test.describe("Datagrid with superstore data set", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html", {
            waitUntil: "networkidle",
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Datagrid",
            });
        });
    });

    run_standard_tests("perspective-viewer-datagrid", getDatagridContents);
});
