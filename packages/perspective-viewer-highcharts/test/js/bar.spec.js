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

const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

const click_details = async page => {
    const viewer = await page.$("perspective-viewer");

    const click_event = page.evaluate(element => {
        return new Promise(resolve => {
            element.addEventListener("perspective-click", e => {
                resolve(e.detail);
            });
        });
    }, viewer);

    await utils.click_highcharts("rect.highcharts-color-1", page);

    return await click_event;
};

utils.with_server({}, () => {
    describe.page(
        "bar.html",
        () => {
            simple_tests.default();

            describe("clicking on a bar", () => {
                describe("when no filters are present", () => {
                    test.capture("perspective dispatches perspective-click event with NO filters.", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");

                        const detail = await click_details(page);
                        expect(detail.config).toEqual({filters: []});
                        expect(detail.column_names).toEqual(["Profit"]);
                        expect(detail.row).toEqual({Profit: 219.582, Sales: 731.94});
                    });
                });

                describe("when a filter is present", () => {
                    test.capture("perspective dispatches perspective-click event with one filter.", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.evaluate(element => {
                            element.setAttribute("columns", '["Sales", "Profit"]');
                            element.setAttribute("filters", '[["Segment", "==", "Consumer"]]');
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");

                        const detail = await click_details(page);
                        expect(detail.config).toEqual({filters: [["Segment", "==", "Consumer"]]});
                        expect(detail.column_names).toEqual(["Profit"]);
                        expect(detail.row).toEqual({Profit: 219.582, Sales: 731.94});
                    });

                    test.capture("perspective dispatches perspective-click event with filters.", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.evaluate(element => {
                            element.setAttribute("columns", '["Sales", "Profit"]');
                            element.setAttribute("filters", '[["Segment", "==", "Consumer"]]');
                            element.setAttribute("column-pivots", '["Region"]');
                            element.setAttribute("row-pivots", '["Country", "City"]');
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");

                        const detail = await click_details(page);
                        expect(detail.config).toEqual({
                            filters: [["Segment", "==", "Consumer"], ["Country", "==", "United States"], ["City", "==", "Houston"], ["Region", "==", "Central"]]
                        });
                        expect(detail.column_names).toEqual(["Profit"]);
                    });
                });
            });

            describe("tooltip tests", () => {
                const bar = "rect.highcharts-point";

                test.capture("tooltip shows on hover.", async page => {
                    await utils.invoke_tooltip(bar, page);
                });

                test.capture("dates on the x-axis display correctly.", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.setAttribute("row-pivots", '["Order Date"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });

                test.capture("tooltip shows proper column labels based on hover target.", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    // set a new column
                    await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await utils.invoke_tooltip(bar, page);
                });

                test.capture("tooltip shows proper column labels based on hover target, pt2.", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    // set a new column
                    await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await utils.invoke_tooltip("rect.highcharts-color-1", page);
                });

                test.capture("tooltip shows pivot labels.", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    // set a row pivot and a column pivot
                    await page.evaluate(element => element.setAttribute("row-pivots", '["State"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await utils.invoke_tooltip(bar, page);
                });
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..")}
    );

    describe.page("null.html", () => {
        test.capture("should handle null categories in a pivot", async page => {
            await page.waitForSelector("perspective-viewer:not([updating])");
        });
    });

    describe.page(
        "render_warning.html",
        () => {
            test.capture("render warning should not show under size limit.", async page => {
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("render warning should show above size limit.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.evaluate(element => {
                    window.getPlugin("y_bar").max_cells = 50;
                    element.setAttribute("columns", '["col_b"]');
                }, viewer);
                await page.waitForFunction(
                    element => {
                        return !element.shadowRoot.querySelector(".plugin_information.hidden");
                    },
                    {},
                    viewer
                );
            });

            test.capture("dismissing render warning should trigger render.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.evaluate(element => {
                    window.getPlugin("y_bar").max_cells = 50;
                    element.setAttribute("columns", '["col_b"]');
                }, viewer);
                await page.waitForFunction(
                    element => {
                        return !element.shadowRoot.querySelector(".plugin_information.hidden");
                    },
                    {},
                    viewer
                );
                await page.evaluate(element => element.shadowRoot.querySelector(".plugin_information__action").click(), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("underlying data updates should not trigger rerender if warning is visible.", async page => {
                await page.evaluate(() => {
                    window.getPlugin("y_bar").max_cells = 50;
                });

                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.evaluate(element => {
                    element.setAttribute("columns", '["col_a", "col_b"]');
                }, viewer);
                await page.waitForSelector("perspective-viewer[updating]", {timeout: 100000});
                await page.evaluate(element => {
                    element.update([{col_a: 1234, col_b: 4321}]);
                }, viewer);
                await page.waitForFunction(
                    element => {
                        return !element.shadowRoot.querySelector(".plugin_information.hidden");
                    },
                    {},
                    viewer
                );
            });
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
