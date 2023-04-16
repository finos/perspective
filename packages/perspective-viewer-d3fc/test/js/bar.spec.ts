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
    run_standard_tests,
    getSvgContentString,
} from "@finos/perspective-test";
import type { HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";

test.describe("Bar Tests", () => {
    test.describe("Y Bar", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(
                "/@finos/perspective-test/src/html/basic-test.html",
                { waitUntil: "networkidle" }
            );

            await page.evaluate(async () => {
                await document.querySelector("perspective-viewer")!.restore({
                    plugin: "Y Bar",
                    columns: ["Sales"],
                });
            });
        });

        run_standard_tests(
            "y-bar",
            getSvgContentString(
                "perspective-viewer perspective-viewer-d3fc-ybar"
            )
        );
    });

    test.describe("X Bar", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(
                "/@finos/perspective-test/src/html/basic-test.html",
                { waitUntil: "networkidle" }
            );

            await page.evaluate(async () => {
                await document.querySelector("perspective-viewer")!.restore({
                    plugin: "X Bar",
                    columns: ["Sales"],
                });
            });
        });
        run_standard_tests(
            "x-bar",
            getSvgContentString(
                "perspective-viewer perspective-viewer-d3fc-xbar"
            )
        );
    });

    test.describe("Y Bar (Themed)", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(
                "/@finos/perspective-test/src/html/themed-test.html",
                { waitUntil: "networkidle" }
            );

            await page.evaluate(async () => {
                await document.querySelector("perspective-viewer")!.restore({
                    plugin: "Y Bar",
                    columns: ["Sales"],
                });
            });
        });

        run_standard_tests(
            "y-bar-themed",
            getSvgContentString(
                "perspective-viewer perspective-viewer-d3fc-ybar"
            )
        );
    });
});
