/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require('@jpmorganchase/perspective-viewer/test/js/utils.js');

const simple_tests = require('@jpmorganchase/perspective-viewer/test/js/simple_tests.js');


utils.with_server({}, () => {

    describe.page("line.html", () => {

        simple_tests.default();

        describe('tooltip tests', () => {
            const series_selector = "path.highcharts-graph:first-of-type";
            test.capture("tooltip shows on hover.", async page => {
                await page.hover(series_selector);
                await page.waitForSelector('.highcharts-label.highcharts-tooltip');
            });


            test("tooltip shows proper column labels.", async page => {
                await page.hover(series_selector);
                const tooltip = await page.$(".highcharts-label.highcharts-tooltip > text");
                const has_column_labels = await page.evaluate(
                    element => {
                        const text = element.textContent;
                        return text.includes("Order Date") && text.includes("Profits");
                        },
                    tooltip);

                expect(has_column_labels === true);
            });

            test("tooltip shows pivot labels.", async page => {
                await page.click('#config_button');
                const viewer = await page.$("perspective-viewer");

                // set a row pivot and a column pivot
                await page.evaluate(element => element.setAttribute('row-pivots', '["State"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');
                await page.evaluate(element => element.setAttribute('column-pivots', '["Category"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');

                // hover and validate tooltip text
                await page.hover(series_selector);
                const text = await page.$(".highcharts-label.highcharts-tooltip > text");
                const has_pivot_labels = await page.evaluate(element => {
                    return element.textContent.includes("State") &&
                        element.textContent.includes("Category");
                }, text);

                expect(has_pivot_labels === true);
            });
        });


    });

});
