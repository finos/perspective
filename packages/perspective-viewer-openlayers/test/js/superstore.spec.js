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
    runAllStandardTests,
    SUPERSTORE_CSV_PATH,
} from "@finos/perspective-test";

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document.querySelector(
            "perspective-viewer perspective-viewer-openlayers-scatter"
        );
        return viewer.innerHTML || "MISSING";
    });
}

test.describe("OpenLayers with superstore data set", () => {
    test.skip("Contents match generationally", async ({ page }) => {
        await setupPage(page, {
            htmlPage:
                "/packages/perspective-viewer-openlayers/dist/umd/superstore.html",
            selector: "perspective-viewer",
        });

        await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
            plugin: "OpenLayers",
        });

        await runAllStandardTests(
            page,
            "perspective-viewer-openlayers-scatter",
            get_contents
        );
    });
});
