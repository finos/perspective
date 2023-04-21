/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto(
        "/@finos/perspective-viewer/test/html/plugin-priority-order.html",
        { waitUntil: "networkidle" }
    );

    await page.waitForFunction(() => !!window.__TABLE_LOADED__);
});

test.describe("Plugin Priority Order", () => {
    test("Elements are loaded in priority Order", async ({ page }) => {
        let saved = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            window.__TABLE__ = await viewer.getTable();
            await viewer.reset();

            return await viewer.save();
        });

        const expected = {
            aggregates: {},
            columns: [
                "Row ID",
                "Order ID",
                "Order Date",
                "Ship Date",
                "Ship Mode",
                "Customer ID",
                "Segment",
                "Country",
                "City",
                "State",
                "Postal Code",
                "Region",
                "Product ID",
                "Category",
                "Sub-Category",
                "Sales",
                "Quantity",
                "Discount",
                "Profit",
            ],
            expressions: [],
            filter: [],
            group_by: [],
            plugin: "HighPriority",
            plugin_config: {},
            settings: false,
            sort: [],
            split_by: [],
            theme: "Pro Light",
            title: null,
        };

        expect(saved).toEqual(expected);
    });
});
