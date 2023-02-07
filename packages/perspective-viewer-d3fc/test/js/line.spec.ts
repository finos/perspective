/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";
import {
    setupPage,
    loadTableAsset,
    compareSVGContentsToSnapshot,
    SUPERSTORE_CSV_PATH,
} from "@finos/perspective-test";

test.describe("Line Tests", () => {
    test("Contents match generationally", async ({ page }) => {
        await setupPage(page, {
            htmlPage: "/tools/perspective-test/src/html/basic-test.html", // Should this be a relative or absolute path?
            selector: "perspective-viewer",
        });

        await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
            plugin: "Y Line",
        });

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer perspective-viewer-d3fc-yline",
            ["yline.txt"]
        );
    });
});
