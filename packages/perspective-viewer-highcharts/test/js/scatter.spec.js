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

const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

const axis_tests = require("./axis_tests.js");

utils.with_server({}, () => {
    describe.page(
        "scatter.html",
        () => {
            simple_tests.default();

            axis_tests.default();

            describe("tooltip tests", () => {
                const point = "path.highcharts-point";

                test.capture("tooltip shows on hover.", async page => {
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await utils.invoke_tooltip(point, page);
                });

                test.capture("tooltip shows pivot labels.", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");

                    // set a row pivot and a column pivot
                    await page.evaluate(element => element.setAttribute("row-pivots", '["State"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");

                    await utils.invoke_tooltip(point, page);
                });
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});
