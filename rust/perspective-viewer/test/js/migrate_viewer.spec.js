/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {convert} = require("../../dist/cjs/migrate.js");
const utils = require("@finos/perspective-test");
const path = require("path");

async function get_contents(page) {
    return await page.evaluate(async () => {
        const plugin = document.querySelector("perspective-viewer").children[0];
        if (plugin.tagName === "PERSPECTIVE-VIEWER-DATAGRID") {
            return plugin?.innerHTML || "MISSING";
        } else {
            return (
                plugin?.shadowRoot?.querySelector("#container")?.innerHTML ||
                "MISSING"
            );
        }
    });
}

const TESTS = [
    [
        "Bucket by year",
        {
            columns: ["Sales"],
            plugin: "d3_y_area",
            "computed-columns": ['month_bucket("Order Date")'],
            "row-pivots": ["month_bucket(Order Date)"],
            "column-pivots": ["Ship Mode"],
            filters: [["Category", "==", "Office Supplies"]],
            selectable: null,
            editable: null,
            aggregates: null,
            sort: null,
            plugin_config: {},
        },
        {
            plugin: "Y Area",
            plugin_config: {},
            group_by: ["bucket(\"Order Date\", 'M')"],
            split_by: ["Ship Mode"],
            columns: ["Sales"],
            filter: [["Category", "==", "Office Supplies"]],
            sort: [],
            expressions: ["bucket(\"Order Date\", 'M')"],
            aggregates: {},
        },
    ],
    [
        "Plugin config color mode",
        {
            columns: ["Sales"],
            plugin: "datagrid",
            "computed-columns": [],
            "row-pivots": [],
            "column-pivots": [],
            filters: [],
            selectable: null,
            editable: null,
            aggregates: null,
            sort: null,
            plugin_config: {Sales: {color_mode: "gradient", gradient: 10}},
        },
        {
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    Sales: {number_color_mode: "gradient", gradient: 10},
                },
                editable: false,
                scroll_lock: true,
            },
            group_by: [],
            split_by: [],
            columns: ["Sales"],
            filter: [],
            sort: [],
            expressions: [],
            aggregates: {},
        },
    ],
];

utils.with_server({}, () => {
    describe.page(
        "superstore-all.html",
        () => {
            for (const [name, old, current] of TESTS) {
                test.capture(`restore '${name}'`, async (page) => {
                    const converted = convert(JSON.parse(JSON.stringify(old)));
                    const config = await page.evaluate(async (old) => {
                        const viewer =
                            document.querySelector("perspective-viewer");
                        await viewer.getTable();
                        old.settings = true;
                        await viewer.restore(old);
                        const current = await viewer.save();
                        current.settings = false;
                        return current;
                    }, converted);

                    expect(config.theme).toEqual("Material Light");
                    delete config["theme"];

                    expect(config.settings).toEqual(false);
                    delete config.settings;

                    expect(config).toEqual(current);
                    expect(convert(old, {replace_defaults: true})).toEqual(
                        current
                    );
                    return await get_contents(page);
                });
            }
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
