/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test } from "@playwright/test";
import {
    setupPage,
    loadTableAsset,
    addPerspectiveToWindow,
    SUPERSTORE_CSV_PATH,
    runAllStandardTests,
} from "@finos/perspective-test";

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document.querySelector(
            "perspective-viewer perspective-viewer-plugin"
        );
        return viewer.innerHTML;
    });
}

test.describe("Superstore", () => {
    test("Run simple Superstore tests", async ({ page }) => {
        await setupPage(page, {
            htmlPage: "/rust/perspective-viewer/dist/cdn/superstore.html",
            selector: "perspective-viewer",
        });

        await addPerspectiveToWindow(page);

        await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
            plugin: "Debug",
        });

        await runAllStandardTests(page, "superstore", get_contents);
    });
});
