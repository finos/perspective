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

const {withTemplate} = require("./simple-template");
withTemplate("sunburst", "d3_sunburst");

utils.with_server({}, () => {
    describe.page(
        "sunburst.html",
        () => {
            simple_tests.default("skip");

            test.skip("sunburst label shows formatted date", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("row-pivots", '["Ship Date"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
                await page.evaluate(element => element.setAttribute("filters", '[["Product ID", "==", "FUR-BO-10001798"]]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(() => document.activeElement.blur());
                const result = await page.waitFor(
                    element => {
                        let elem = element.shadowRoot.querySelector("perspective-d3fc-chart").shadowRoot.querySelector(".segment");
                        if (elem) {
                            // TODO Full label is clipped
                            return elem.textContent.includes("11/");
                        }
                    },
                    {},
                    viewer
                );
                return !!result;
            });

            test.skip("sunburst parent button shows formatted date", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("row-pivots", '["Ship Date", "City"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
                await page.evaluate(element => element.setAttribute("filters", '[["Product ID", "==", "FUR-BO-10001798"]]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(() => document.activeElement.blur());
                await page.mouse.click(500, 400);
                const result = await page.waitFor(
                    element => {
                        let elem = element.shadowRoot.querySelector("perspective-d3fc-chart").shadowRoot.querySelector(".parent");
                        if (elem) {
                            return elem.textContent.includes("11/12/2013, 12:00:00 AM");
                        }
                    },
                    {},
                    viewer
                );
                return !!result;
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..", "..")}
    );
});
