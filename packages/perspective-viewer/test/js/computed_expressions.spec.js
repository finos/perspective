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

const add_computed_expression = async (page, expression) => {
    const viewer = await page.$("perspective-viewer");
    await page.waitForSelector("perspective-viewer:not([updating])");
    await page.shadow_click("perspective-viewer", "#add-computed-expression");
    await page.shadow_type(expression, "perspective-viewer", "perspective-computed-expression-editor", "#psp-expression-input");
    await page.evaluate(
        element =>
            element.shadowRoot
                .querySelector("perspective-computed-expression-editor")
                .shadowRoot.querySelector("#psp-expression-button-save")
                .click(),
        viewer
    );
    await page.waitForSelector("perspective-viewer:not([updating])");
};

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            test.capture("click on add column button opens the computed expression UI.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#add-computed-expression");
            });

            test.capture("click on close button closes the computed expression UI.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#add-computed-expression");
                await page.shadow_click("perspective-viewer", "perspective-computed-expression-editor", "#psp-expression-close");
                await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("Typing an expression in the textarea should work even when pushed down to page bottom.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#add-computed-expression");
                await page.shadow_type('"Sales" + ("Profit" * "Quantity") as "new column"', "perspective-viewer", "perspective-computed-expression-editor", "#psp-expression-input");
            });

            test.capture("Typing a large expression in the textarea should work even when pushed down to page bottom.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#add-computed-expression");
                await page.shadow_type('"Sales" + ("Profit" * "Quantity") as "new column"\n'.repeat(10), "perspective-viewer", "perspective-computed-expression-editor", "#psp-expression-input");
            });

            // reset
            test.capture("Resetting the viewer with computed columns should place computed columns in the inactive columns list.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'sqrt("Profit")');
                await page.waitForSelector("perspective-viewer:not([updating])");
                await add_computed_expression(page, 'sqrt("Sales")');
                await page.waitForSelector("perspective-viewer:not([updating])");
                await add_computed_expression(page, 'sqrt(("Sales" * "Profit"))');
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.reset(), viewer);
                await page.evaluate(element => {
                    const inactive = element.shadowRoot.querySelector("#inactive_columns");
                    let computed_count = 0;
                    for (const column of inactive.children) {
                        if (column.classList.contains("computed")) {
                            computed_count++;
                        }
                    }
                    if (computed_count !== 4) {
                        throw new Error(`Expected 4 computed columns, received ${computed_count}. ${inactive.innerHTML}`);
                    }
                }, viewer);
            });

            // save
            test.capture("saving without an expression should fail as button is disabled.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.shadow_click("perspective-viewer", "#add-computed-expression");
                await page.evaluate(
                    element =>
                        element.shadowRoot
                            .querySelector("perspective-computed-expression-editor")
                            .shadowRoot.querySelector("#psp-expression-button-save")
                            .click(),
                    viewer
                );
            });

            test.capture("saving a single computed expression should add it to inactive columns.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'month_bucket("Ship Date")');
                await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
            });

            test.capture("saving a single computed expression with dependencies should add all columns to inactive columns.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, '"Sales" + (pow2("Sales")) as "new column"');
                await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
            });

            test.skip("saving a duplicate expression should fail with error message.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'month_bucket("Ship Date")');
                await add_computed_expression(page, 'month_bucket("Ship Date")');
            });

            // Transforms
            test.capture("Computed expression columns should persist when new views are created.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'month_bucket("Ship Date")');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["State", "City"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["State", "City"]'), viewer);
            });

            test.capture("Computed expression columns should persist when new computed columns are added.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'month_bucket("Ship Date")');
                await add_computed_expression(page, '"Sales" % "Profit"');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
            });

            // usage
            test.capture("aggregates by computed expression column.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'concat_comma("State", "City") as "Computed"');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["Computed"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["State", "City", "Computed"]'), viewer);
                await page.evaluate(element => {
                    const aggs = JSON.parse(element.getAttribute("aggregates")) || {};
                    aggs["Computed"] = "any";
                    element.setAttribute("aggregates", JSON.stringify(aggs));
                }, viewer);
            });

            test.capture("pivots by computed expression column.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'concat_comma("State", "City") as "Computed"');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["Computed"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["State", "City"]'), viewer);
            });

            test.skip("adds computed expression via attribute", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("computed-columns", '[""Sales" + "Profit" as "First""]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("columns", '["First", "Second"]'), viewer);
            });

            test.capture("sorts by computed expression column.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'pow2("Sales") as "p2"');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("columns", '["p2", "Sales"]'), viewer);
                await page.evaluate(element => element.setAttribute("sort", '[["p2", "desc"]]'), viewer);
            });

            test.capture("filters by computed expression column.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'day_of_week("Order Date") as "Computed"');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("filters", '[["Computed", "==", "2 Monday"]]'), viewer);
            });

            test.capture("computed expression column aggregates should persist.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'day_of_week("Order Date") as "Computed"');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["Quantity"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity", "Computed"]'), viewer);
                await page.evaluate(element => element.setAttribute("aggregates", '{"Computed":"any"}'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity", "Computed"]'), viewer);
            });

            // TODO: make sure this works
            test.skip("user defined aggregates maintained on computed expression columns", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                const viewer = await page.$("perspective-viewer");

                await page.evaluate(element => {
                    element.restore({
                        aggregates: {"sqrt(Sales)": "mean"},
                        "computed-columns": ['sqrt("Sales")'],
                        columns: ["sqrt(Sales)"],
                        "row-pivots": ["Category"]
                    });
                }, viewer);

                await page.$("perspective-viewer:not([updating])");
            });
        },
        {
            root: path.join(__dirname, "..", ".."),
            name: "Computed Expressions"
        }
    );
});
