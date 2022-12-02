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

utils.with_server({}, () => {
    describe.page(
        "plugin-priority-order.html",
        () => {
            test.capture(
                "Elements are loaded in priority Order",
                async (page) => {
                    let viewer = await page.$("perspective-viewer");
                    let saved = await page.evaluate(async (viewer) => {
                        window.__TABLE__ = await viewer.getTable();
                        await viewer.reset();

                        return await viewer.save();
                    }, viewer);

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
                    };

                    expect(saved).toEqual(expected);
                },
                { timeout: 120000 }
            );
        },
        {
            root: path.join(__dirname, "..", ".."),
        }
    );
});
