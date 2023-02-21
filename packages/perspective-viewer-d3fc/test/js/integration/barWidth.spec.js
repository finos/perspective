/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

const utils = require("@finos/perspective-test");
const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");
// const render_warning_tests = require("@finos/perspective-viewer/test/js/render_warning_tests.js");

const { withTemplate } = require("./simple-template");

withTemplate("bar", "Y Bar");
withTemplate("bar-x", "X Bar");
withTemplate("bar-themed", "Y Bar", { template: "themed-template" });

utils.with_server({}, () => {
    describe.page(
        "bar.html",
        () => {
            describe("rendering bugs", () => {
                test.capture(
                    "correctly render when a bar chart has non equidistant times on a datetime axis",
                    async (page) => {
                        const config = await page.evaluate(async () => {
                            const viewer =
                                document.querySelector("perspective-viewer");
                            await viewer.getTable();
                            await viewer.restore({
                                plugin: "Y Bar",
                                columns: ["Profit"],
                                group_by: ["Order Date"],
                                split_by: ["Profit"],
                            });
                            return await viewer.save();
                        });

                        expect(config).toEqual({
                            plugin: "Y Bar",
                            columns: ["Profit"],
                            group_by: ["Order Date"],
                            split_by: ["Profit"],
                            aggregates: {},
                            filter: [],
                            sort: [],
                            plugin_config: {},
                            settings: false,
                            expressions: [],
                            theme: "Pro Light",
                        });

                        return await utils.get_contents(
                            "perspective-viewer perspective-viewer-d3fc-ybar",
                            page
                        );
                    }
                );
            });
        },
        { root: path.join(__dirname, "..", "..", "..") }
    );
});

// async function get_contents(page) {
//     return await page.evaluate(async () => {
//         const viewer = document
//             .querySelector("perspective-viewer")
//             .shadowRoot.querySelector("#app_panel");
//         return viewer ? viewer.innerHTML : "MISSING";
//     });
// }

// utils.with_server({}, () => {
//     describe.page(
//         "superstore.html",
//         () => {
//             test.capture("save returns the current config", async (page) => {
//                 const config = await page.evaluate(async () => {
//                     const viewer = document.querySelector("perspective-viewer");
//                     await viewer.getTable();
//                     await viewer.restore({
//                         settings: true,
//                         group_by: ["State"],
//                         columns: ["Profit", "Sales"],
//                     });
//                     return await viewer.save();
//                 });

//                 expect(config).toEqual({
//                     aggregates: {},
//                     split_by: [],
//                     columns: ["Profit", "Sales"],
//                     expressions: [],
//                     filter: [],
//                     plugin: "Debug",
//                     plugin_config: {},
//                     group_by: ["State"],
//                     settings: true,
//                     sort: [],
//                 });

//                 return await get_contents(page);
//             });

//             test.capture(
//                 "restore restores a config from save",
//                 async (page) => {
//                     const config = await page.evaluate(async () => {
//                         const viewer =
//                             document.querySelector("perspective-viewer");
//                         await viewer.getTable();
//                         await viewer.restore({
//                             settings: true,
//                             group_by: ["State"],
//                             columns: ["Profit", "Sales"],
//                         });
//                         return await viewer.save();
//                     });

//                     expect(config).toEqual({
//                         aggregates: {},
//                         split_by: [],
//                         columns: ["Profit", "Sales"],
//                         expressions: [],
//                         filter: [],
//                         plugin: "Debug",
//                         plugin_config: {},
//                         group_by: ["State"],
//                         settings: true,
//                         sort: [],
//                     });

//                     const config2 = await page.evaluate(async () => {
//                         const viewer =
//                             document.querySelector("perspective-viewer");
//                         await viewer.reset();
//                         return await viewer.save();
//                     });

//                     expect(config2).toEqual({
//                         aggregates: {},
//                         split_by: [],
//                         columns: [
//                             "Row ID",
//                             "Order ID",
//                             "Order Date",
//                             "Ship Date",
//                             "Ship Mode",
//                             "Customer ID",
//                             "Segment",
//                             "Country",
//                             "City",
//                             "State",
//                             "Postal Code",
//                             "Region",
//                             "Product ID",
//                             "Category",
//                             "Sub-Category",
//                             "Sales",
//                             "Quantity",
//                             "Discount",
//                             "Profit",
//                         ],
//                         expressions: [],
//                         filter: [],
//                         plugin: "Debug",
//                         plugin_config: {},
//                         group_by: [],
//                         settings: true,
//                         sort: [],
//                     });

//                     const config3 = await page.evaluate(async (config) => {
//                         const viewer =
//                             document.querySelector("perspective-viewer");
//                         await viewer.restore(config);
//                         return await viewer.save();
//                     }, config);

//                     expect(config3).toEqual({
//                         aggregates: {},
//                         split_by: [],
//                         columns: ["Profit", "Sales"],
//                         expressions: [],
//                         filter: [],
//                         plugin: "Debug",
//                         plugin_config: {},
//                         group_by: ["State"],
//                         settings: true,
//                         sort: [],
//                     });

//                     return await get_contents(page);
//                 }
//             );
//         },
//         {root: path.join(__dirname, "..", "..")}
//     );
// });
