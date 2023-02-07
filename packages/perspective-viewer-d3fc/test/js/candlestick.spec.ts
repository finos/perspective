/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// NOTE: Currently, the tests in this file are skipped. Saving for future reference

// const path = require("path");

// const utils = require("@finos/perspective-test");

// const { withTemplate } = require("./simple-template");
// withTemplate("candlestick", "Candlestick", { template: "shares-template" });

// utils.with_server({}, () => {
//     describe.page(
//         "candlestick.html",
//         () => {
//             test.skip("filter by a single instrument.", async (page) => {
//                 const viewer = await page.$("perspective-viewer");
//                 await page.evaluate(
//                     (element) =>
//                         element.setAttribute(
//                             "filters",
//                             '[["Name", "==", "BARC"]]'
//                         ),
//                     viewer
//                 );
//                 await page.evaluate(
//                     async (element) => await element.flush(),
//                     viewer
//                 );
//                 await page.shadow_blur();
//             });

//             test.skip("filter to date range.", async (page) => {
//                 const viewer = await page.$("perspective-viewer");
//                 await page.evaluate(
//                     async () =>
//                         await document
//                             .querySelector("perspective-viewer")
//                             .toggleConfig()
//                 );
//                 await page.evaluate(
//                     (element) =>
//                         element.setAttribute("column-pivots", '["Name"]'),
//                     viewer
//                 );
//                 await page.waitForSelector(
//                     "perspective-viewer:not([updating])"
//                 );
//                 await page.evaluate(
//                     (element) =>
//                         element.setAttribute(
//                             "filters",
//                             '[["Date", ">", "2019-01-01"]]'
//                         ),
//                     viewer
//                 );
//                 await page.evaluate(
//                     async (element) => await element.flush(),
//                     viewer
//                 );
//                 await page.shadow_blur();
//             });
//         },
//         { reload_page: false, root: path.join(__dirname, "..", "..", "..") }
//     );
// });
