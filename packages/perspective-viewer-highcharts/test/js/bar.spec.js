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

    describe.page('bar.html', () => {

        //simple_tests.default();

        describe('tooltip tests', () => {
            const tooltip_selector = '.highcharts-label.highcharts-tooltip';
            const text = tooltip_selector + ' > text';

            // fixme hashes have changed
            test.run('tooltip shows on hover.', async page => {
                // puppeteer bug: does not click/hover over svg elements
                await page.mouse.move(280, 140);
                await page.waitForSelector(tooltip_selector);
                return await page.$eval(
                    tooltip_selector, element => element.getAttribute('opacity') === '1');
            });

            test.run('tooltip shows column label.', async page => {
                await page.mouse.move(280, 140);
                await page.waitForSelector(tooltip_selector);
                return await page.$eval(
                    tooltip_selector + ' > text',
                    element => element.textContent.includes('Sales'));
            });

            test.run('tooltip shows proper column labels based on hover target.', async page => {
                await page.click('#config_button');
                const viewer = await page.$('perspective-viewer');

                // set a new column
                await page.evaluate(element => element.setAttribute('columns', '["Sales", "Profit"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');

                await page.mouse.move(387, 251);
                const has_sales_label = await page.$eval(
                    text, element => element.textContent.includes('Sales'));

                await page.mouse.move(389, 433);
                const has_profit_label = await page.$eval(
                    text, element => element.textContent.includes('Profit'));

                return has_sales_label && has_profit_label;
            });

            test.run('tooltip shows pivot labels.', async page => {
                await page.click('#config_button');
                const viewer = await page.$('perspective-viewer');

                // set a row pivot and a column pivot
                await page.evaluate(element => element.setAttribute('row-pivots', '["State"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');
                await page.evaluate(element => element.setAttribute('column-pivots', '["Category"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');

                // hover and validate tooltip text
                await page.mouse.move(306, 245);
                return await page.$eval(
                    text, element => {
                        return element.textContent.includes('State') &&
                            element.textContent.includes('Category')});
            });
        });

    });

});
