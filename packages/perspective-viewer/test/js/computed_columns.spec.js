/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

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

const add_computed_column = async page => {
    const viewer = await page.$("perspective-viewer");
    await page.shadow_click("perspective-viewer", "#config_button");
    await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
    await page.evaluate(element => element.shadowRoot.querySelector("#add-computed-column").click(), viewer);
    await page.evaluate(element => {
        let com = element.shadowRoot.querySelector("perspective-computed-column");
        const columns = [{name: "Order Date", type: "datetime"}];
        com.state.computed_function_name = "day_of_week";
        com._apply_state(columns, com.computations["day_of_week"], "new_cc");
    }, viewer);
    await page.evaluate(
        element =>
            element.shadowRoot
                .querySelector("perspective-computed-column")
                .shadowRoot.querySelector("#psp-cc-button-save")
                .click(),
        viewer
    );
    await page.waitForSelector("perspective-viewer:not([updating])");
    await page.evaluate(element => {
        const aggs = JSON.parse(element.getAttribute("aggregates")) || {};
        aggs["new_cc"] = "dominant";
        element.setAttribute("aggregates", JSON.stringify(aggs));
    }, viewer);
    await page.waitForSelector("perspective-viewer:not([updating])");
};

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            describe.page(
                undefined,
                () => {
                    test.capture("click on add computed column button opens the UI.", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.shadow_click("perspective-viewer", "#config_button");
                        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
                        await page.$("perspective-viewer");
                        await page.evaluate(element => element.shadowRoot.querySelector("#add-computed-column").click(), viewer);
                    });

                    test.capture("click on close button closes the UI.", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.shadow_click("perspective-viewer", "#config_button");
                        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
                        await page.$("perspective-viewer");
                        await page.evaluate(element => element.shadowRoot.querySelector("#add-computed-column").click(), viewer);
                        await page.evaluate(
                            element =>
                                element.shadowRoot
                                    .querySelector("perspective-computed-column")
                                    .shadowRoot.querySelector("#psp-cc__close")
                                    .click(),
                            viewer
                        );
                    });

                    // input column
                    test.capture("setting a valid column should set it as input.", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.shadow_click("perspective-viewer", "#config_button");
                        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
                        await page.$("perspective-viewer");
                        await page.evaluate(element => element.shadowRoot.querySelector("#add-computed-column").click(), viewer);
                        await page.evaluate(element => {
                            let com = element.shadowRoot.querySelector("perspective-computed-column");
                            const columns = [{name: "State", type: "string"}];
                            com.state.computed_function_name = "lowercase";
                            com._apply_state(columns, com.computations["lowercase"], "new_cc");
                        }, viewer);
                    });

                    test.capture("setting multiple column parameters should set input.", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.shadow_click("perspective-viewer", "#config_button");
                        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
                        await page.$("perspective-viewer");
                        await page.evaluate(element => element.shadowRoot.querySelector("#add-computed-column").click(), viewer);
                        await page.evaluate(element => {
                            let com = element.shadowRoot.querySelector("perspective-computed-column");
                            const columns = [
                                {name: "Quantity", type: "integer"},
                                {name: "Row ID", type: "integer"}
                            ];
                            com.state.computed_function_name = "add";
                            com._apply_state(columns, com.computations["add"], "new_cc");
                        }, viewer);
                    });

                    // computation
                    test.capture("computations should clear input column.", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.shadow_click("perspective-viewer", "#config_button");
                        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
                        await page.$("perspective-viewer");
                        await page.evaluate(element => element.shadowRoot.querySelector("#add-computed-column").click(), viewer);
                        await page.evaluate(element => {
                            let com = element.shadowRoot.querySelector("perspective-computed-column");
                            const columns = [{name: "State", type: "string"}];
                            com.state.computed_function_name = "lowercase";
                            com._apply_state(columns, com.computations["lowercase"], "new_cc");
                        }, viewer);
                        await page.evaluate(element => {
                            const select = element.shadowRoot.querySelector("perspective-computed-column").shadowRoot.querySelector("#psp-cc-computation__select");
                            select.value = "subtract";
                            select.dispatchEvent(new Event("change"));
                        }, viewer);
                        // await page.select("#psp-cc-computation__select", "subtract");
                    });
                },
                {reload_page: false, name: "UI interaction"}
            );

            // save
            test.capture("saving without parameters should fail as button is disabled.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
                await page.evaluate(element => element.shadowRoot.querySelector("#add-computed-column").click(), viewer);
                await page.evaluate(
                    element =>
                        element.shadowRoot
                            .querySelector("perspective-computed-column")
                            .shadowRoot.querySelector("#psp-cc-button-save")
                            .click(),
                    viewer
                );
            });

            test.capture("saving a computed column should add it to inactive columns.", async page => {
                await add_computed_column(page);
            });

            test.capture("saving a duplicate column should fail with error message.", async page => {
                await add_computed_column(page);
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.shadowRoot.querySelector("#add-computed-column").click(), viewer);
                await page.evaluate(element => {
                    let com = element.shadowRoot.querySelector("perspective-computed-column");
                    const columns = [{name: "Order Date", type: "datetime"}];
                    com.state.computed_function_name = "day_of_week";
                    com._apply_state(columns, com.computations["day_of_week"], "new_cc");
                }, viewer);
                await page.evaluate(
                    element =>
                        element.shadowRoot
                            .querySelector("perspective-computed-column")
                            .shadowRoot.querySelector("#psp-cc-button-save")
                            .click(),
                    viewer
                );
            });

            // edit
            test.skip("clicking on the edit button should bring up the UI", async page => {
                await add_computed_column(page);
                await page.click("#row_edit");
            });

            // usage
            test.skip("aggregates by computed column.", async page => {
                await add_computed_column(page);
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["Quantity"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity", "new_cc"]'), viewer);
            });

            test.capture("pivots by computed column.", async page => {
                await add_computed_column(page);
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["new_cc"]'), viewer);
            });

            test.capture("adds computed column via attribute", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.evaluate(element => element.setAttribute("computed-columns", '[{"name":"test","computed_function_name":"month_bucket","inputs":["Order Date"]}]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("columns", '["Quantity", "test"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("sorts by computed column.", async page => {
                await add_computed_column(page);
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("sort", '[["new_cc", "asc"]]'), viewer);
            });

            test.capture("filters by computed column.", async page => {
                await add_computed_column(page);
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("filters", '[["new_cc", "==", "2 Monday"]]'), viewer);
            });

            test.capture("computed column aggregates should persist.", async page => {
                await add_computed_column(page);
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["Quantity"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity", "new_cc"]'), viewer);
                await page.evaluate(element => element.setAttribute("aggregates", '{"new_cc":"any"}'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity", "new_cc"]'), viewer);
            });

            test.capture("user defined aggregates maintained on computed columns", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");

                await page.evaluate(element => {
                    element.restore({
                        aggregates: {Computed: "mean"},
                        "computed-columns": [{name: "Computed", inputs: ["Sales", "Profit"], computed_function_name: "add"}],
                        columns: ["Computed", "Quantity"],
                        "row-pivots": ["Category"]
                    });
                }, viewer);
            });
        },
        {
            root: path.join(__dirname, "..", "..")
        }
    );
});
