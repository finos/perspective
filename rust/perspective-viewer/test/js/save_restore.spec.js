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
const {expectation} = require("sinon");

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document
            .querySelector("perspective-viewer")
            .shadowRoot.querySelector("#app_panel");
        return viewer ? viewer.innerHTML : "MISSING";
    });
}

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            test.capture("save() returns the current config", async (page) => {
                const config = await page.evaluate(async () => {
                    const viewer = document.querySelector("perspective-viewer");
                    await viewer.getTable();
                    await viewer.restore({
                        settings: true,
                        row_pivots: ["State"],
                        columns: ["Profit", "Sales"],
                    });
                    return await viewer.save();
                });

                expect(config).toEqual({
                    aggregates: {},
                    column_pivots: [],
                    columns: ["Profit", "Sales"],
                    expressions: [],
                    filter: [],
                    plugin: "Debug",
                    plugin_config: {},
                    row_pivots: ["State"],
                    settings: true,
                    sort: [],
                });

                return await get_contents(page);
            });

            test.capture(
                "restore() restores a config from save()",
                async (page) => {
                    const config = await page.evaluate(async () => {
                        const viewer =
                            document.querySelector("perspective-viewer");
                        await viewer.getTable();
                        await viewer.restore({
                            settings: true,
                            row_pivots: ["State"],
                            columns: ["Profit", "Sales"],
                        });
                        return await viewer.save();
                    });

                    expect(config).toEqual({
                        aggregates: {},
                        column_pivots: [],
                        columns: ["Profit", "Sales"],
                        expressions: [],
                        filter: [],
                        plugin: "Debug",
                        plugin_config: {},
                        row_pivots: ["State"],
                        settings: true,
                        sort: [],
                    });

                    const config2 = await page.evaluate(async () => {
                        const viewer =
                            document.querySelector("perspective-viewer");
                        await viewer.reset();
                        return await viewer.save();
                    });

                    expect(config2).toEqual({
                        aggregates: {},
                        column_pivots: [],
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
                        plugin: "Debug",
                        plugin_config: {},
                        row_pivots: [],
                        settings: true,
                        sort: [],
                    });

                    const config3 = await page.evaluate(async (config) => {
                        const viewer =
                            document.querySelector("perspective-viewer");
                        await viewer.restore(config);
                        return await viewer.save();
                    }, config);

                    expect(config3).toEqual({
                        aggregates: {},
                        column_pivots: [],
                        columns: ["Profit", "Sales"],
                        expressions: [],
                        filter: [],
                        plugin: "Debug",
                        plugin_config: {},
                        row_pivots: ["State"],
                        settings: true,
                        sort: [],
                    });

                    return await get_contents(page);
                }
            );
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
