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

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document.querySelector(
            "perspective-viewer perspective-viewer-openlayers-scatter"
        );
        return viewer.innerHTML || "MISSING";
    });
}

test.describe("OpenLayers with superstore data set", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(
            "/@finos/perspective-viewer-openlayers/test/html/superstore.html",
            { waitUntil: "networkidle" }
        );

        await page.waitForFunction(() => !!window.__TABLE_LOADED__);

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Map Scatter",
            });
        });
    });

    run_standard_tests("perspective-viewer-openlayers-scatter", get_contents);
});
