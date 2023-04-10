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
    addPerspectiveToWindow,
    SUPERSTORE_CSV_PATH,
} from "@finos/perspective-test";

async function addTestChartPlugins(page) {
    await page.evaluate(async () => {
        class TestChartPluginHighPriority extends customElements.get(
            "perspective-viewer-plugin"
        ) {
            get name() {
                return "HighPriority";
            }

            get priority() {
                return 10;
            }
        }

        class TestChartPluginLowPriority extends customElements.get(
            "perspective-viewer-plugin"
        ) {
            get name() {
                return "LowPriority";
            }

            get priority() {
                return -10;
            }
        }

        const Viewer = customElements.get("perspective-viewer");
        customElements.define("low-priority", TestChartPluginLowPriority);
        customElements.define("high-priority", TestChartPluginHighPriority);
        Viewer.registerPlugin("low-priority");
        Viewer.registerPlugin("high-priority");

        const viewer = document.createElement("perspective-viewer");
        document.body.appendChild(viewer);
    });
}

test.beforeEach(async ({ page }) => {
    await setupPage(page, {
        htmlPage:
            "/rust/perspective-viewer/dist/cdn/plugin-priority-order.html",
        selector: "#temp-content", // perspective-viewer is added in addTestChartPlugins()
    });

    // Clear temp body content that is used to help load the page.
    await page.evaluate(() => {
        document.body.removeChild(document.querySelector("#temp-content"));
    });

    await addPerspectiveToWindow(page);

    await addTestChartPlugins(page);

    await page.evaluate(async (csvPath) => {
        const resp = await fetch(csvPath);
        window.__CSV__ = await resp.text();
        window.__WORKER__ = window.perspective.worker();
        const table = await window.__WORKER__.table(window.__CSV__);

        const viewer = document.querySelector("perspective-viewer");
        await viewer.load(table);
    }, SUPERSTORE_CSV_PATH);
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
            theme: null,
            title: null,
        };

        expect(saved).toEqual(expected);
    });
});
