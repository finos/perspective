/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {convert} = require("@finos/perspective-viewer/dist/cjs/migrate.js");
const utils = require("@finos/perspective-test");
const path = require("path");

const TEST_ROOT = path.join(__dirname, "..", "..", "..");

const PATHS = [
    path.join(TEST_ROOT, "dist", "umd"),
    path.join(TEST_ROOT, "dist", "theme"),
    path.join(TEST_ROOT, "test", "html"),
    path.join(TEST_ROOT, "test", "css"),
    path.join(TEST_ROOT, "test", "csv"),
];

const TESTS = [
    [
        "Bucket by year",
        {
            viewers: {
                One: {
                    table: "superstore",
                    name: "One",
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
            },
            mode: "globalFilters",
            sizes: [1],
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"],
                },
            },
        },
        {
            viewers: {
                One: {
                    table: "superstore",
                    name: "One",
                    plugin: "Y Area",
                    plugin_config: {},
                    row_pivots: ["bucket(\"Order Date\", 'M')"],
                    column_pivots: ["Ship Mode"],
                    columns: ["Sales"],
                    filter: [["Category", "==", "Office Supplies"]],
                    sort: [],
                    expressions: ["bucket(\"Order Date\", 'M')"],
                    aggregates: {},
                    master: false,
                    linked: false,
                },
            },
            mode: "globalFilters",
            sizes: [1],
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"],
                },
            },
        },
    ],
];

function tests(extract) {
    for (const [name, old, current] of TESTS) {
        test.capture(`Restore workspace "${name}`, async (page) => {
            await page.waitForFunction(() => !!window.__TABLE__);
            const converted = convert(JSON.parse(JSON.stringify(old)));
            const config = await page.evaluate(async (config) => {
                const workspace = document.getElementById("workspace");
                await workspace.restore(config);
                return await workspace.save();
            }, converted);

            expect(config.viewers.One.theme).toEqual("Material Light");
            delete config.viewers.One["theme"];

            expect(config.viewers.One.settings).toEqual(false);
            delete config.viewers.One["settings"];

            expect(config).toEqual(current);
            expect(converted).toEqual(current);
            return extract(page);
        });
    }
}

utils.with_server({paths: PATHS}, () => {
    describe.page(
        "workspace-all.html",
        () => {
            describe("Light DOM", () => {
                tests((page) =>
                    page.evaluate(
                        async () =>
                            document.getElementById("workspace").outerHTML
                    )
                );
            });

            describe("Shadow DOM", () => {
                tests((page) =>
                    page.evaluate(
                        async () =>
                            document
                                .getElementById("workspace")
                                .shadowRoot.querySelector("#container")
                                .innerHTML
                    )
                );
            });
        },
        {root: TEST_ROOT}
    );
});
