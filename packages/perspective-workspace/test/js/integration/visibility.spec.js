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

const TEST_ROOT = path.join(__dirname, "..", "..", "..");
const PATHS = [
    path.join(TEST_ROOT, "dist", "umd"),
    path.join(TEST_ROOT, "dist", "theme"),
    path.join(TEST_ROOT, "test", "html"),
    path.join(TEST_ROOT, "test", "css"),
    path.join(TEST_ROOT, "test", "csv"),
];

utils.with_server({paths: PATHS}, () => {
    describe.page(
        "index.html",
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

const BAD_LAYOUT = {
    sizes: [1],
    detail: {
        main: {
            type: "tab-area",
            widgets: [
                "PERSPECTIVE_GENERATED_ID_0",
                "PERSPECTIVE_GENERATED_ID_1",
            ],
            currentIndex: 1,
        },
    },
    mode: "globalFilters",
    viewers: {
        PERSPECTIVE_GENERATED_ID_0: {
            plugin: "Sunburst",
            plugin_config: {},
            settings: true,
            theme: null,
            group_by: ["State"],
            split_by: [],
            columns: ["Quantity", null, null],
            filter: [],
            sort: [],
            expressions: [],
            aggregates: {},
            master: false,
            name: "My Data",
            table: "myData",
            linked: false,
        },
        PERSPECTIVE_GENERATED_ID_1: {
            plugin: "Sunburst",
            plugin_config: {},
            settings: true,
            theme: null,
            group_by: ["State"],
            split_by: [],
            columns: ["Sales", null, null],
            filter: [],
            sort: [],
            expressions: [],
            aggregates: {},
            master: false,
            name: "My Data",
            table: "myData",
            linked: false,
        },
    },
};

function tests(extract) {
    describe("visibility", () => {
        test.capture(
            "Sunburst charts do not loop forever when disconnected from DOM",
            async (page) => {
                await page.waitForFunction(() => !!window.__TABLE__);
                await page.evaluate(async (layout) => {
                    // const viewer = document.createElement("perspective-viewer");
                    // viewer.setAttribute("table", "superstore");
                    // viewer.setAttribute("name", "one");
                    // viewer.setAttribute("slot", "one");
                    // const viewer2 =
                    //     document.createElement("perspective-viewer");
                    // viewer2.setAttribute("table", "superstore");
                    // viewer2.setAttribute("name", "two");
                    // viewer2.setAttribute("slot", "two");
                    // const workspace = document.getElementById("workspace");
                    // workspace.appendChild(viewer);
                    // workspace.appendChild(viewer2);
                    // await workspace.flush();

                    // const datasource = async () => {
                    //     const worker = window.perspective.worker();
                    //     const data = [
                    //         {country: "United States", age: 1},
                    //         {country: "China", age: 1},
                    //         {country: "Russia", age: 2},
                    //         {country: "Germany", age: 3},
                    //         {country: "Canada", age: 2},
                    //         {country: "Australia", age: 3},
                    //         {country: "Great Britain", age: 4},
                    //         {country: "South Korea", age: 1},
                    //     ];
                    //     return worker.table(data);
                    // };

                    // window.addEventListener("load", async () => {
                    window.workspace.tables.set("myData", window.__TABLE__);
                    await window.workspace.restore(layout);
                }, BAD_LAYOUT);

                // await page.evaluate(async () => {
                //     const viewer = document.body.querySelector(
                //         'perspective-viewer[name="one"]'
                //     );
                //     const workspace = document.getElementById("workspace");
                //     workspace.removeChild(viewer);
                //     await workspace.flush();
                // });

                return extract(page);
            }
        );
    });
}
