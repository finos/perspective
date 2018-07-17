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

    describe.page("treemap.html", () => {

        simple_tests.default();

        describe('tooltip tests', () => {
            const point_selector = "rect.highcharts-point:first-of-type";

            beforeAll(async page => {
                await page.click('#config_button');
                const viewer = await page.$("perspective-viewer");

                // set a row pivot and a column pivot so the graph will render
                await page.evaluate(element => element.setAttribute('row-pivots', '["State"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');
                await page.evaluate(element => element.setAttribute('column-pivots', '["Category"]'), viewer);
                await page.waitForSelector('perspective-viewer:not([updating])');
            });

            test.capture("tooltip shows on hover.", async page => {
                await page.hover(point_selector);
                await page.waitForSelector('.highcharts-label.highcharts-tooltip');
            });
        });

    });

});
