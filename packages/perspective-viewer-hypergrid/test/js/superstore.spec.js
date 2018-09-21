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

async function set_lazy(page) {
    const viewer = await page.$("perspective-viewer");
    await page.evaluate(element => {
        element.hypergrid.properties.repaintIntervalRate = 1;
        Object.defineProperty(element.hypergrid, "_lazy_load", {
            set: () => {},
            get: () => true
        });
    }, viewer);
}

utils.with_server({}, () => {
    describe.page("superstore.html", () => {
        simple_tests.default();

        describe("expand/collapse", () => {
            test.capture("collapses to depth smaller than viewport", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["Category","State"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");

                await page.evaluate(element => {
                    element.view.collapse_to_depth(0);
                    element.notifyResize();
                }, viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
            });
        });

        describe("lazy render mode", () => {
            test.capture("resets viewable area when the logical size expands.", async page => {
                await set_lazy(page);
                await page.click("#config_button");
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("row-pivots", '["City"]'), viewer);
            });

            test.capture("resets viewable area when the physical size expands.", async page => {
                await set_lazy(page);
                await page.click("#config_button");
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["Category"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("row-pivots", "[]"), viewer);
                await page.click("#config_button");
            });
        });
    });
});
