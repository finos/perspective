/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@jpmorganchase/perspective-viewer/test/js/utils.js");
const path = require("path");

const simple_tests = require("@jpmorganchase/perspective-viewer/test/js/simple_tests.js");

utils.with_server({}, () => {
    describe.page(
        "hypergrid.html",
        () => {
            simple_tests.default();

            describe("clicking on a cell in the grid", () => {
                describe("when no filters are present", () => {
                    test.capture("Dispatches perspective-click event with NO filters.", async page => {
                        const viewer = await page.$("perspective-viewer");
                        const click_event = page.evaluate(element => {
                            return new Promise(resolve => {
                                element.addEventListener("perspective-click", e => {
                                    console.error(JSON.stringify(e.detail));
                                    resolve(e.detail);
                                });
                            });
                        }, viewer);

                        await page.mouse.click(300, 300);
                        const config = await click_event;
                        expect(config).toEqual({filters: []});
                        await page.waitFor(100);
                    });
                });

                describe("when a filter is present", () => {
                    test.capture("Dispatches perspective-click event with filters.", async page => {
                        const viewer = await page.$("perspective-viewer");

                        await page.evaluate(element => {
                            const filters = [["Segment", "==", "Consumer"]];
                            element.setAttribute("filters", JSON.stringify(filters));
                        }, viewer);

                        const click_event = page.evaluate(element => {
                            return new Promise(resolve => {
                                element.addEventListener("perspective-click", e => {
                                    console.error(JSON.stringify(e.detail));
                                    resolve(e.detail);
                                });
                            });
                        }, viewer);

                        await page.mouse.click(300, 300);
                        const config = await click_event;
                        expect(config).toEqual({filters: []});
                        await page.waitFor(100);
                    });
                });
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});
