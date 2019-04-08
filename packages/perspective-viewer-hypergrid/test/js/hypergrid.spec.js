/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@jpmorganchase/perspective-viewer/test/js/utils.js");
const path = require("path");

const click_details = async page => {
    const viewer = await page.$("perspective-viewer");

    const click_event = page.evaluate(element => {
        return new Promise(resolve => {
            element.addEventListener("perspective-click", e => {
                resolve(e.detail);
            });
        });
    }, viewer);

    await page.mouse.click(310, 300);
    return await click_event;
};

utils.with_server({}, () => {
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
                });
            });
        },
        {reload_page: true, root: path.join(__dirname, "..", "..")}
    );
});
