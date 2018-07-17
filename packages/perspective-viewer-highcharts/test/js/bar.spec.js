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

    describe.page("bar.html", () => {

        simple_tests.default();

        describe('tooltip tests', () => {
            const bar_selector = "rect.highcharts-point.highcharts-color-0:first-of-type";
            test.capture("tooltip shows on hover.", async page => {
                await page.waitForSelector(bar_selector);
                await page.hover(bar_selector);
                const tooltip = await page.waitForSelector('g.highcharts-label.highcharts-tooltip');
                await page.evaluate(element => element.getAttribute('opacity') === '1', tooltip);
            });

            test("tooltip shows column label.", async page => {
                await page.waitForSelector(bar_selector);
                await page.hover(bar_selector);
                const text = await page.$(".highcharts-label.highcharts-tooltip > text");
                const has_sales_label = await page.evaluate(
                    element => element.textContent.includes("Sales"),
                    text);
                expect(has_sales_label).toEqual(true);
            });

            test("tooltip shows proper column labels based on hover target.", async page => {
                await page.click('#config_button');
                const viewer = await page.$("perspective-viewer");

                // set a new column
                await page.evaluate(element => element.setAttribute('columns', '["Sales", "Profit"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');

                // hover and check for correct labels
                await page.waitForSelector(bar_selector);
                await page.hover(bar_selector);
                const sales_tooltip = await page.$(".highcharts-label.highcharts-tooltip > text");
                const has_sales_label = await page.evaluate(
                    element => element.textContent.includes("Sales"),
                    sales_tooltip);

                await page.hover("rect.highcharts-point.highcharts-color-1:first-of-type");
                const profit_tooltip = await page.$(".highcharts-label.highcharts-tooltip > text");
                const has_profit_label = await page.evaluate(
                    element => element.textContent.includes("Profit"),
                    profit_tooltip);

                expect(has_sales_label && has_profit_label).toEqual(true);
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
                await page.waitForSelector(bar_selector);
                await page.hover(bar_selector);
                const text = await page.$(".highcharts-label.highcharts-tooltip > text");
                const has_pivot_labels = await page.evaluate(element => {
                    return element.textContent.includes("State") &&
                        element.textContent.includes("Category");
                }, text);

                expect(has_pivot_labels).toEqual(true);
            });
        });

    });

});
