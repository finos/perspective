/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");

utils.with_server({}, () => {
    describe.page(
        "selectable.html",
        () => {
            describe("no pivots", () => {
                describe("selecting a row", () => {
                    test.capture("highlights the row with no pivots", async page => {
                        await page.$("perspective-viewer");
                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);
                        await page.mouse.move(80, 40);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                    });

                    test.capture("keeps selection when row moves with no pivots", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.evaluate(element => {
                            element.setAttribute("sort", '[["number", "asc"]]');
                        }, viewer);

                        await page.waitForSelector("perspective-viewer:not([updating])");

                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);

                        await page.evaluate(element => {
                            element.update([{name: "Homer", number: 300}]);
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                    });
                });
            });
            describe("row pivots", () => {
                describe("selecting a row", () => {
                    test.capture("highlights the row with row pivots", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.evaluate(element => {
                            element.setAttribute("row-pivots", '["name"]');
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");

                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);
                        await page.mouse.move(80, 40);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                    });

                    test.capture("keeps selection when row moves with row pivots", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.evaluate(element => {
                            element.setAttribute("sort", '[["number", "asc"]]');
                            element.setAttribute("row-pivots", '["name"]');
                        }, viewer);

                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);

                        await page.evaluate(element => {
                            element.update([{name: "Homer", number: 300}]);
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                    });
                });
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});
