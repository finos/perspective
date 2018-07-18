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

    describe.page("scatter.html", () => {

        //simple_tests.default();

        describe('tooltip tests', () => {
            const tooltip_selector = 'g.highcharts-label.highcharts-tooltip';
            const text = tooltip_selector + ' > text';

            test.run("tooltip shows on hover.", async page => {
                page.mouse.move(109, 158);
                await page.waitForSelector(tooltip_selector);
                return await page.$eval(tooltip_selector,
                        element => element.getAttribute('opacity') === '1');
            });


            test.run("tooltip shows proper column labels.", async page => {
                page.mouse.move(109, 158);
                return await page.$eval(
                    text, element => {
                        return element.textContent.includes("Sales") &&
                            element.textContent.includes("Profits");
                    });
            });

            test.run("tooltip shows pivot labels.", async page => {
                await page.click('#config_button');
                const viewer = await page.$("perspective-viewer");

                // set a row pivot and a column pivot
                await page.evaluate(element => element.setAttribute('row-pivots', '["State"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');
                await page.evaluate(element => element.setAttribute('column-pivots', '["Category"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');

                page.mouse.move(277, 173);
                return await page.$eval(
                    text, element => {
                    return element.textContent.includes("State") &&
                        element.textContent.includes("Category");
                    });
            });
        });


    });

});
