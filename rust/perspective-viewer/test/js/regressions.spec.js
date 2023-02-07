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
    compareContentsToSnapshot,
    SUPERSTORE_CSV_PATH,
} from "@finos/perspective-test";

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document
            .querySelector("perspective-viewer")
            .shadowRoot.querySelector("#app_panel");
        return viewer ? viewer.innerHTML : "MISSING";
    });
}

test.beforeEach(async ({ page }) => {
    await setupPage(page, {
        htmlPage: "/rust/perspective-viewer/dist/cdn/superstore.html",
        selector: "perspective-viewer",
    });

    await addPerspectiveToWindow(page);

    await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
        plugin: "Debug",
    });
});

test.describe("Regression tests", () => {
    test("not_in filter works correctly", async ({ page }) => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.restore({
                group_by: ["State"],
                columns: ["Sales"],
                settings: true,
                filter: [
                    ["State", "not in", ["California", "Texas", "New York"]],
                ],
            });
        });

        const contents = await get_contents(page);

        await compareContentsToSnapshot(contents, [
            "regressions-not_in-filter-works-correctly.txt",
        ]);
    });
});
