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
    compareSVGContentsToSnapshot,
    runAllStandardTests,
    getSvgContentString,
    SUPERSTORE_CSV_PATH,
} from "@finos/perspective-test";

test.beforeEach(async ({ page }) => {
    await setupPage(page, {
        htmlPage: "/tools/perspective-test/src/html/basic-test.html", // Should this be a relative or absolute path?
        selector: "perspective-viewer",
    });
});

test.describe("Scatter Tests", () => {
    test("Contents match generationally", async ({ page }) => {
        await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
            plugin: "X/Y Scatter",
            columns: ["Sales", "Quantity"],
        });

        await runAllStandardTests(
            page,
            "xyscatter",
            getSvgContentString(
                "perspective-viewer perspective-viewer-d3fc-xyscatter"
            )
        );
    });

    test("Scatter charts with a 'label' field render the label", async ({
        page,
    }) => {
        await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
            plugin: "X/Y Scatter",
            columns: ["Sales", "Quantity", null, null, "State"],
        });

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer perspective-viewer-d3fc-xyscatter",
            ["xyscatter-label"]
        );
    });

    test("Scatter charts with a 'label' field render the label when a group by operation is applied", async ({
        page,
    }) => {
        await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
            plugin: "X/Y Scatter",
            group_by: ["State"],
            columns: ["Sales", "Quantity", null, null, "City"],
            aggregates: { City: "dominant" },
        });

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer perspective-viewer-d3fc-xyscatter",
            ["xyscatter-label-grouped"]
        );
    });
});
