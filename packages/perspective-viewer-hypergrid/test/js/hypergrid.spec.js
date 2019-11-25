/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");
const {click_details, capture_update} = require("./utils.js");

utils.with_server({}, () => {
    describe.page(
        "empty.html",
        () => {
            test.capture("perspective-click is fired when an empty dataset is loaded first", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.waitFor("perspective-viewer:not([updating])");
                await capture_update(page, viewer, () => page.evaluate(element => element.update([{x: 3000}, {x: 3000}, {x: 3000}, {x: 3000}, {x: 3000}, {x: 3000}]), viewer));
                await page.waitFor("perspective-viewer:not([updating])");
                await page.waitFor(100);
                const detail = await click_details(page, 30, 60);
                expect(detail.row).toEqual({x: 3000});
            });
        },
        {root: path.join(__dirname, "..", "..")}
    );

    describe.page(
        "hypergrid.html",
        () => {
            describe("clicking on a cell in the grid", () => {
                describe("when no filters are present", () => {
                    test.capture("perspective dispatches perspective-click event with correct properties.", async page => {
                        await page.waitFor(100);
                        const detail = await click_details(page);
                        expect(detail.row).toEqual({
                            Category: "Technology",
                            City: "Los Angeles",
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
                            "Ship Mode": "Standard Class",
                            State: "California",
                            "Sub-Category": "Phones"
                        });
                        expect(detail.column_names).toEqual(["Ship Date"]);
                        expect(detail.config).toEqual({filters: []});
                    });
                });

                describe("when a filter is present", () => {
                    test.capture("perspective dispatches perspective-click event with one filter.", async page => {
                        await page.waitFor(100);
                        const viewer = await page.$("perspective-viewer");
                        page.evaluate(element => element.setAttribute("filters", '[["Segment", "==", "Consumer"]]'), viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");

                        const detail = await click_details(page);
                        expect(detail.config).toEqual({filters: [["Segment", "==", "Consumer"]]});
                    });

                    test.capture("perspective dispatches perspective-click event with filters.", async page => {
                        await page.waitFor(100);
                        const viewer = await page.$("perspective-viewer");
                        page.evaluate(element => {
                            element.setAttribute("filters", '[["Segment", "==", "Consumer"]]');
                            element.setAttribute("column-pivots", '["Region"]');
                            element.setAttribute("row-pivots", '["Country", "City"]');
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");

                        const detail = await click_details(page);
                        expect(detail.config).toEqual({
                            filters: [["Segment", "==", "Consumer"], ["Country", "==", "United States"], ["City", "==", "Madison"], ["Region", "==", "Central"]]
                        });
                    });

                    test.capture("perspective-click event with column-pivots clicking on the row header.", async page => {
                        await page.waitFor(100);
                        const viewer = await page.$("perspective-viewer");
                        page.evaluate(element => {
                            element.setAttribute("filters", '[["Segment", "==", "Consumer"]]');
                            element.setAttribute("column-pivots", '["Region"]');
                            element.setAttribute("row-pivots", '["Country", "City"]');
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");

                        const detail = await click_details(page, 100);
                        expect(detail.config).toEqual({
                            filters: [["Segment", "==", "Consumer"], ["Country", "==", "United States"], ["City", "==", "Madison"]]
                        });
                    });
                });
            });
        },
        {reload_page: true, root: path.join(__dirname, "..", "..")}
    );
});
