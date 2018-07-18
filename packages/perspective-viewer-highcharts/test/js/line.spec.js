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

        //simple_tests.default();

        describe('tooltip tests', () => {
            const tooltip_selector = '.highcharts-label.highcharts-tooltip';
            const text = tooltip_selector + ' > text';

            // todo convert to screenshot type
            test.run('tooltip shows on hover.', async page => {
                await page.mouse.move(490, 112);
                await page.waitForSelector(tooltip_selector);

                return await page.$eval(
                    tooltip_selector,
                        element => element.getAttribute('opacity') === '1');
            });


            test.run('tooltip shows proper column labels.', async page => {
                await page.mouse.move(490, 112);

                return await page.$eval(
                    text, element => {
                        const text = element.textContent;
                        return text.includes('Order Date') && text.includes('Profits');
                    });
            });

            test.run('tooltip shows pivot labels.', async page => {
                await page.click('#config_button');
                const viewer = await page.$('perspective-viewer');

                // set a row pivot and a column pivot
                await page.evaluate(element => element.setAttribute('row-pivots', '["State"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');
                await page.evaluate(element => element.setAttribute('column-pivots', '["Category"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');

                await page.mouse.move(306, 169);

                return await page.$eval(
                    text, element => {
                    return element.textContent.includes('State') &&
                        element.textContent.includes('Category');
                    });
            });
        });


    });

});
