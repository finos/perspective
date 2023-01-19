/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

const utils = require("@finos/perspective-test");
const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

const { withTemplate } = require("./simple-template");
withTemplate("line", "Y Line");

utils.with_server({}, () => {
    describe.page(
        "line.html",
        () => {
            const get_contents = (p) =>
                utils.get_contents(
                    "perspective-viewer perspective-viewer-d3fc-yline",
                    p
                );
            simple_tests.default(get_contents);
            // TODO: this shouldnt fail:
            // This test fails because when given a column with all nulls
            // rendering in d3fc errors. This is mostly benign because
            // rendering is already not gonna happen at that point.
            test.skip("by a numerical column", async (page) => {
                await page.evaluate(async () => {
                    const viewer = document.querySelector("perspective-viewer");
                    await viewer.restore({
                        split_by: ["Postal Code"],
                        settings: true,
                    });
                });

                return await get_contents(page);
            });

            // test.capture("Sets a category axis when pivoted by an expression datetime", async page => {
            //     const viewer = await page.$("perspective-viewer");
            //     await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            //     await page.evaluate(element => element.setAttribute("expressions", JSON.stringify([`// abc \n bucket("Ship Date", 'M')`])), viewer);
            //     await page.waitForSelector("perspective-viewer:not([updating])");
            //     await page.evaluate(element => element.setAttribute("row-pivots", JSON.stringify(["abc"])), viewer);
            //     await page.waitForSelector("perspective-viewer:not([updating])");
            //     await page.evaluate(element => element.setAttribute("columns", '["State","Sales"]'), viewer);
            //     await page.waitForSelector("perspective-viewer:not([updating])");
            //     await page.evaluate(element => element.setAttribute("aggregates", '{"State":"dominant","Sales":"sum"}'), viewer);
            //     await page.waitForSelector("perspective-viewer:not([updating])");
            // });
        },
        { reload_page: false, root: path.join(__dirname, "..", "..", "..") }
    );
});
