/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-viewer/test/js/utils.js");
const path = require("path");

const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");
const {set_lazy} = require("./utils.js");

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            simple_tests.default();

            describe("expand/collapse", () => {
                test.capture("should not be able to expand past number of row pivots", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.setAttribute("row-pivots", '["Region"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(element => element.setAttribute("column-pivots", '["Sub-Category"]'), viewer);

                    await page.evaluate(element => {
                        // 2 is greater than no. of row pivots
                        element.view.expand(2);
                        element.notifyResize();
                    }, viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });

                test.capture("collapses to depth smaller than viewport", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.evaluate(element => element.setAttribute("row-pivots", '["Category","State"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");

                    await page.evaluate(element => {
                        element.view.set_depth(0);
                        element.notifyResize();
                    }, viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });

                test.capture("handles flush", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => {
                        element.setAttribute("column-pivots", '["Category"]');
                        element.setAttribute("row-pivots", '["City"]');
                        element.flush().then(() => {
                            element.view.set_depth(0);
                            element.notifyResize();
                        });
                    }, viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });
            });

            describe("sort indicators", () => {
                test.capture("shows a sort indicator", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.setAttribute("sort", '[["Row ID", "asc"]]'), viewer);
                });

                test.capture("shows multiple sort indicators", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.setAttribute("sort", '[["Row ID","asc"],["Order ID","desc"]]'), viewer);
                });

                test.capture("shows a sort indicator on column split", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
                    await page.evaluate(element => element.setAttribute("sort", '[["Sales", "desc"]]'), viewer);
                    await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
                });
            });

            describe("memoized column meta", () => {
                test.capture("should reinterpret metadata when only row pivots are changed", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.setAttribute("row-pivots", '["Region","Order Date"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(element => element.setAttribute("row-pivots", '["Order Date"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });
            });

            describe("lazy render mode", () => {
                test.capture("resets viewable area when the logical size expands.", async page => {
                    await set_lazy(page);
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(element => element.setAttribute("row-pivots", '["City"]'), viewer);
                });

                test.capture("resets viewable area when the physical size expands.", async page => {
                    await set_lazy(page);
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.setAttribute("row-pivots", '["Category"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(element => element.setAttribute("row-pivots", "[]"), viewer);
                    await page.shadow_click("perspective-viewer", "#config_button");
                });
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});
