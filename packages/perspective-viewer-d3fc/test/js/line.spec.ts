/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";
import { compareSVGContentsToSnapshot } from "@finos/perspective-test";

test.describe("Line Tests", () => {
    test("Contents match generationally", async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html", {
            waitUntil: "networkidle",
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "Y Line",
            });
        });

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer perspective-viewer-d3fc-yline",
            ["yline.txt"]
        );
    });
});
