/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");

const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            simple_tests.default();

            test.capture("resets viewable area when the logical size expands.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("row-pivots", '["City"]'), viewer);
            });

            test.capture("resets viewable area when the physical size expands.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("row-pivots", '["Category"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("row-pivots", "[]"), viewer);
                await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            });

            test.capture("perspective dispatches perspective-click event with correct details", async page => {
                const detail = await click_details(page);
                expect(detail).toEqual({
                    row: {
                        "Row ID": 15,
                        "Order ID": "US-2012-118983",
                        "Order Date": 1353542400000,
                        "Ship Date": 1353888000000,
                        "Ship Mode": "Standard Class",
                        "Customer ID": "HP-14815",
                        Segment: "Home Office",
                        Country: "United States",
                        City: "Fort Worth",
                        State: "Texas",
                        "Postal Code": 76106,
                        Region: "Central",
                        "Product ID": "OFF-AP-10002311",
                        Category: "Office Supplies",
                        "Sub-Category": "Appliances",
                        Sales: 68.81,
                        Quantity: 5,
                        Discount: 0.8,
                        Profit: -123.858
                    },
                    column_names: ["Order Date"],
                    config: {filters: []}
                });
            });

            test.capture("perspective dispatches perspective-click event with correct details when filter is set", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("row-pivots", '["State", "Category"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                const detail = await click_details(page, 310, 320);
                expect(detail).toEqual({
                    row: {
                        __ROW_PATH__: ["Delaware", "Technology"],
                        "Row ID": 97,
                        "Order ID": 2,
                        "Order Date": 2,
                        "Ship Date": 2,
                        "Ship Mode": 2,
                        "Customer ID": 2,
                        Segment: 2,
                        Country: 2,
                        City: 2,
                        State: 2,
                        "Postal Code": 39802,
                        Region: 2,
                        "Product ID": 2,
                        Category: 2,
                        "Sub-Category": 2,
                        Sales: 66.8,
                        Quantity: 5,
                        Discount: 0,
                        Profit: 11.054
                    },
                    config: {
                        filters: [
                            ["State", "==", "Delaware"],
                            ["Category", "==", "Technology"]
                        ]
                    }
                });
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});

const click_details = async (page, x = 310, y = 300) => {
    const viewer = await page.$("perspective-viewer");

    const click_event = page.evaluate(
        element =>
            new Promise(resolve => {
                element.addEventListener("perspective-click", e => {
                    resolve(e.detail);
                });
            }),
        viewer
    );
    await page.mouse.click(x, y);
    return await click_event;
};
