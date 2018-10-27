/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@jpmorganchase/perspective-viewer/test/js/utils.js");

const simple_tests = require("@jpmorganchase/perspective-viewer/test/js/simple_tests.js");

utils.with_server({}, () => {
    describe.page("bar.html", () => {
        simple_tests.default();

        describe("tooltip tests", () => {
            const bar = "rect.highcharts-point";

            test.capture("tooltip shows on hover.", async page => {
                await utils.invoke_tooltip(bar, page);
            });

            test.capture("tooltip shows column label.", async page => {
                await utils.invoke_tooltip(bar, page);
            });

            test.capture("tooltip shows proper column labels based on hover target.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.shadowRoot.querySelector("#config_button").click(), viewer);
                // set a new column
                await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await utils.invoke_tooltip(bar, page);
            });

            test.capture("tooltip shows proper column labels based on hover target, pt2.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.shadowRoot.querySelector("#config_button").click(), viewer);
                // set a new column
                await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await utils.invoke_tooltip("rect.highcharts-color-1", page);
            });

            test.capture("tooltip shows pivot labels.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.shadowRoot.querySelector("#config_button").click(), viewer);
                // set a row pivot and a column pivot
                await page.evaluate(element => element.setAttribute("row-pivots", '["State"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await utils.invoke_tooltip(bar, page);
            });
        });
    });

    /*describe.page("render_warning.html", () => {
        test.capture(
            "render warning should show when size limit is reached.",
            async page => {
                console.log(page);
            },
            100000,
            null,
            100000
        );
    });*/
});
