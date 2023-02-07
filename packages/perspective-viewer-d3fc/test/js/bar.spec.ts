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
    getSvgContentString,
    SUPERSTORE_CSV_PATH,
} from "@finos/perspective-test";

const pageOptions = {
    htmlPage: "/tools/perspective-test/src/html/basic-test.html", // Should this be a relative or absolute path?
    selector: "perspective-viewer",
};

test.describe("Bar Tests", () => {
    test.describe("Y Bar", () => {
        test("Contents match generationally", async ({ page }) => {
            await setupPage(page, pageOptions);
            await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
                plugin: "Y Bar",
                columns: ["Sales"],
            });

            await runAllStandardTests(
                page,
                "y-bar",
                getSvgContentString(
                    "perspective-viewer perspective-viewer-d3fc-ybar"
                )
            );
        });
    });

    test.describe("X Bar", () => {
        test("Contents match generationally", async ({ page }) => {
            await setupPage(page, pageOptions);
            await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
                plugin: "X Bar",
                columns: ["Sales"],
            });

            await runAllStandardTests(
                page,
                "x-bar",
                await getSvgContentString(
                    "perspective-viewer perspective-viewer-d3fc-xbar"
                )
            );
        });
    });

    test.describe("Y Bar (Themed)", () => {
        test("Contents match generationally", async ({ page }) => {
            const themedPageOptions = {
                ...pageOptions,
                htmlPage: "/tools/perspective-test/src/html/themed-test.html",
            };

            await setupPage(page, themedPageOptions);
            await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
                plugin: "Y Bar",
                columns: ["Sales"],
            });

            await runAllStandardTests(
                page,
                "y-bar-themed",
                getSvgContentString(
                    "perspective-viewer perspective-viewer-d3fc-ybar"
                )
            );
        });
    });
});
