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
                        "Ship Mode": "Standard Class",
                        Country: "United States",
                        "Customer ID": "BH-11710",
                        Discount: 0.2,
                        "Order Date": 1307577600000,
                        "Order ID": "CA-2011-115812",
                        "Postal Code": 90032,
                        "Product ID": "TEC-PH-10002033",
                        Profit: 68.3568,
                        Quantity: 4,
                        Region: "West",
                        "Row ID": 12,
                        Sales: 911.424,
                        Segment: "Consumer",
                        "Ship Date": 1308009600000,
                        Category: "Technology",
                        City: "Los Angeles",
                        State: "California",
                        "Sub-Category": "Phones"
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
                        __ROW_PATH__: ["California", "Technology"],
                        Category: 6,
                        City: 6,
                        Country: 6,
                        "Customer ID": 6,
                        Discount: 0.8,
                        "Order Date": 6,
                        "Order ID": 6,
                        "Postal Code": 544262,
                        "Product ID": 6,
                        Profit: 201.2865,
                        Quantity: 20,
                        Region: 6,
                        "Row ID": 221,
                        Sales: 2210.19,
                        Segment: 6,
                        "Ship Date": 6,
                        "Ship Mode": 6,
                        State: 6,
                        "Sub-Category": 6
                    },
                    config: {
                        filters: [
                            ["State", "==", "California"],
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
