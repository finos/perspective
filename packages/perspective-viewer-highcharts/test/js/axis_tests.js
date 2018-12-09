/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

exports.default = function() {
    describe("axis tests", () => {
        test.capture("sets a category X axis when pivoted by a datetime.", async page => {
            const viewer = await page.$("perspective-viewer");
            await page.shadow_click("perspective-viewer", "#config_button");
            await page.evaluate(element => element.setAttribute("row-pivots", '["Order Date"]'), viewer);
            await page.waitForSelector("perspective-viewer:not([updating])");
            await page.evaluate(element => element.setAttribute("columns", '["State","Sales"]'), viewer);
            await page.waitForSelector("perspective-viewer:not([updating])");
            await page.evaluate(element => element.setAttribute("aggregates", '{"State":"dominant","Sales":"sum"}'), viewer);
            await page.waitForSelector("perspective-viewer:not([updating])");
        });

        test.capture("sets a category axis when the axis type is a string.", async page => {
            const viewer = await page.$("perspective-viewer");
            await page.shadow_click("perspective-viewer", "#config_button");
            await page.evaluate(element => element.setAttribute("columns", '["State","Sales"]'), viewer);
            await page.waitForSelector("perspective-viewer:not([updating])");
        });
    });
};
