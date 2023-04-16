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
            "perspective-viewer perspective-viewer-plugin"
        );
        return viewer.innerHTML;
    });
}

test.describe("Superstore", () => {
    test.beforeEach(async function init({ page }) {
        await page.goto(
            "/@finos/perspective-viewer/test/html/superstore.html",
            {
                waitUntil: "networkidle",
            }
        );

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Debug",
            });
        });
    });

    run_standard_tests("superstore", get_contents);
});
