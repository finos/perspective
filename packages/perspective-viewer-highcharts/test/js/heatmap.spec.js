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

    describe.page("heatmap.html", () => {

        simple_tests.default();

        describe('tooltip tests', () => {
            test("tooltip shows a value.", async page => {
                await page.hover("rect.highcharts-point.highcharts-color-0:first-of-type");
                const text = await page.$(".highcharts-label.highcharts-tooltip > text");
                const has_value = await page.evaluate(
                    element => element.textContent !== undefined,
                    text);

                expect(has_value === true);
            });
        });

    });

});
