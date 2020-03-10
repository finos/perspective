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
    await page.evaluate(element => {
        const editor = element.shadowRoot.querySelector("perspective-computed-expression-editor");
        const button = editor.shadowRoot.querySelector("#psp-expression-button-save");
        button.removeAttribute("disabled");
        button.click();
    }, viewer);
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
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["Sales", "Profit"])), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("Typing an expression in the textarea should work even when pushed down to page bottom.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#add-computed-expression");
                await page.shadow_type('"Sales" + ("Profit" * "Quantity") as "new column"', "perspective-viewer", "perspective-computed-expression-editor", "#psp-expression-input");
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => {
                    const editor = element.shadowRoot.querySelector("perspective-computed-expression-editor");
                    const button = editor.shadowRoot.querySelector("#psp-expression-button-save");
                    button.removeAttribute("disabled");
                }, viewer);
            });

            test.capture("Typing a large expression in the textarea should work even when pushed down to page bottom.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#add-computed-expression");
                await page.shadow_type('"Sales" + ("Profit" * "Quantity") as "new column"\n'.repeat(10), "perspective-viewer", "perspective-computed-expression-editor", "#psp-expression-input");
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => {
                    const editor = element.shadowRoot.querySelector("perspective-computed-expression-editor");
                    const button = editor.shadowRoot.querySelector("#psp-expression-button-save");
                    button.removeAttribute("disabled");
                }, viewer);
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
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["Sales", "Profit"])), viewer);
            });

            test.capture("saving a single computed expression with dependencies should add all columns to inactive columns.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, '"Sales" + (pow2("Sales")) as "new column"');
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["Sales", "Profit"])), viewer);
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
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["State", "City"])), viewer);
            });

            test.capture("Computed expression columns should persist when new computed columns are added.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'month_bucket("Ship Date")');
                await add_computed_expression(page, '"Sales" % "Profit"');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["Sales", "Profit"])), viewer);
            });

            // usage
            test.capture("aggregates by computed expression column.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'concat_comma("State", "City") as "Computed"');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("row-pivots", '["Computed"]'), viewer);
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["State", "City", "Computed"])), viewer);
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
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["State", "City"])), viewer);
            });

            test.capture("sorts by computed expression column.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'pow2("Sales") as "p2"');
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["p2", "Sales"])), viewer);
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
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["Row ID", "Quantity", "Computed"])), viewer);
                await page.evaluate(element => element.setAttribute("aggregates", '{"Computed":"any"}'), viewer);
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["Quantity"])), viewer);
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["Row ID", "Quantity", "Computed"])), viewer);
            });

            // Attributes
            test.skip("adds computed expression via attribute", async page => {
                const computed = ['"Sales" + "Profit" as "First"', 'sqrt((pow2("Row ID"))) as "Second"'];
                await page.shadow_click("perspective-viewer", "#config_button");
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => element.setAttribute("computed-columns", JSON.stringify(computed)), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["First"])), viewer);
            });

            test.capture("adds computed expression via attribute in classic syntax", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(element => {
                    const computed = [
                        {
                            column: "First",
                            computed_function_name: "+",
                            inputs: ["Sales", "Profit"]
                        },
                        {
                            column: "pow2(Row ID)",
                            computed_function_name: "pow2",
                            inputs: ["Row ID"]
                        },
                        {
                            column: "Second",
                            computed_function_name: "sqrt",
                            inputs: ["pow2(Row ID)"]
                        }
                    ];

                    element.setAttribute("computed-columns", JSON.stringify(computed));
                }, viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["First", "Second"])), viewer);
            });

            // Save and restore
            test.capture("Computed expressions are saved without changes", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'day_of_week("Order Date") as "Computed"');
                await add_computed_expression(page, 'month_of_year("Ship Date") as "Computed2"');
                const viewer = await page.$("perspective-viewer");
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => {
                    const config = element.save();
                    const result = JSON.stringify(config["computed-columns"]);
                    const expected = JSON.stringify(['day_of_week("Order Date") as "Computed"', 'month_of_year("Ship Date") as "Computed2"']);
                    if (result !== expected) {
                        throw new Error(`Expected ${expected} but received ${result}`);
                    }
                }, viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(element => element.setAttribute("columns", JSON.stringify(["Computed", "Computed2"])), viewer);
            });

            test.capture("Computed expressions are restored without changes", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'day_of_week("Order Date") as "Computed"');
                await add_computed_expression(page, 'month_of_year("Ship Date") as "Computed2"');
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(async () => {
                    const viewer = await document.querySelector("perspective-viewer");
                    const config = {
                        columns: ["Order Date", "Ship Date"],
                        computed_columns: ['day_of_week("Order Date") as "Computed"', 'month_of_year("Ship Date") as "Computed2"']
                    };
                    await viewer.restore(config);
                });
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("On restore, computed expressions in the active columns list are not double created in inactive columns.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'day_of_week("Order Date") as "Computed"');
                await add_computed_expression(page, 'month_of_year("Ship Date") as "Computed2"');
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(async () => {
                    const viewer = await document.querySelector("perspective-viewer");
                    const config = {
                        columns: ["Computed", "Computed2"],
                        computed_columns: ['day_of_week("Order Date") as "Computed"', 'month_of_year("Ship Date") as "Computed2"']
                    };
                    await viewer.restore(config);
                });
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("On restore, computed expressions in pivots are not double created in inactive columns.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'day_of_week("Order Date") as "Computed"');
                await add_computed_expression(page, 'month_of_year("Ship Date") as "Computed2"');
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(async () => {
                    const viewer = await document.querySelector("perspective-viewer");
                    const config = {
                        "row-pivots": ["Computed"],
                        "column-pivots": ["Computed2"],
                        columns: ["Order Date", "Ship Date"],
                        computed_columns: ['day_of_week("Order Date") as "Computed"', 'month_of_year("Ship Date") as "Computed2"']
                    };
                    await viewer.restore(config);
                });
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("On restore, computed expressions in filter are not double created in inactive columns.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'day_of_week("Order Date") as "Computed"');
                await add_computed_expression(page, 'month_of_year("Ship Date") as "Computed2"');
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(async () => {
                    const viewer = await document.querySelector("perspective-viewer");
                    const config = {
                        filters: [["Computed", "==", "5 Thursday"]],
                        columns: ["Order Date", "Ship Date"],
                        computed_columns: ['day_of_week("Order Date") as "Computed"', 'month_of_year("Ship Date") as "Computed2"']
                    };
                    await viewer.restore(config);
                });
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("On restore, computed expressions in sort are not double created in inactive columns.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'day_of_week("Order Date") as "Computed"');
                await add_computed_expression(page, 'month_of_year("Ship Date") as "Computed2"');
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(async () => {
                    const viewer = await document.querySelector("perspective-viewer");
                    const config = {
                        sort: [["Computed", "desc"]],
                        columns: ["Order Date", "Ship Date"],
                        computed_columns: ['day_of_week("Order Date") as "Computed"', 'month_of_year("Ship Date") as "Computed2"']
                    };
                    await viewer.restore(config);
                });
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("On restore, computed expressions in classic syntax are parsed correctly.", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await add_computed_expression(page, 'day_of_week("Order Date") as "Computed"');
                await add_computed_expression(page, 'month_of_year("Ship Date") as "Computed2"');
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.evaluate(async () => {
                    const viewer = await document.querySelector("perspective-viewer");
                    const computed = [
                        {
                            column: "First",
                            computed_function_name: "+",
                            inputs: ["Sales", "Profit"]
                        },
                        {
                            column: "pow2(Row ID)",
                            computed_function_name: "pow2",
                            inputs: ["Row ID"]
                        },
                        {
                            column: "Second",
                            computed_function_name: "sqrt",
                            inputs: ["pow2(Row ID)"]
                        }
                    ];
                    const config = {
                        columns: ["Computed", "Computed2"],
                        computed_columns: computed
                    };
                    await viewer.restore(config);
                });
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("On restore, user defined aggregates are maintained on computed expression columns", async page => {
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.evaluate(async () => {
                    const viewer = await document.querySelector("perspective-viewer");
                    const config = {
                        aggregates: {Computed: "mean"},
                        "computed-columns": ['sqrt("Sales") as "Computed"'],
                        columns: ["Computed"],
                        "row-pivots": ["Category"]
                    };
                    await viewer.restore(config);
                });
                await page.$("perspective-viewer:not([updating])");
            });
        },
        {
            root: path.join(__dirname, "..", ".."),
            name: "Computed Expressions"
        }
    );
});
