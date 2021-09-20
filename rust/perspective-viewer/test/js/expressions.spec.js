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
        "superstore.html",
        () => {
            test.capture(
                "click on add column button opens the expression UI.",
                async (page) => {
                    await page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.getTable();
                        await elem.toggleConfig(true);
                    });

                    await page.shadow_click(
                        "perspective-viewer",
                        "#add-expression"
                    );
                    const monaco = await page.waitFor(async () => {
                        const elem = document.querySelector(
                            "perspective-expression-editor"
                        );
                        return elem?.shadowRoot.querySelector(
                            "#monaco-container"
                        );
                    });

                    return await monaco.evaluate((x) => x.outerHTML);
                }
            );

            test.capture("blur closes the expression UI.", async (page) => {
                await page.evaluate(async () => {
                    document.activeElement.blur();
                    const elem = document.querySelector("perspective-viewer");
                    await elem.toggleConfig(true);
                });

                await page.shadow_click(
                    "perspective-viewer",
                    "#add-expression"
                );
                await page.waitForSelector(
                    "perspective-expression-editor:not([initializing]"
                );
                await page.evaluate(() => document.activeElement.blur());
                return await page.evaluate(async () => {
                    return (
                        document.querySelector("perspective-expression-editor")
                            ?.shadowRoot?.innerHTML || "MISSING"
                    );
                });
            });

            async function type_expression_test(page, expr) {
                await page.evaluate(async () => {
                    document.activeElement.blur();
                    const elem = document.querySelector("perspective-viewer");
                    await elem.toggleConfig(true);
                });

                await page.shadow_click(
                    "perspective-viewer",
                    "#add-expression"
                );
                await page.waitForSelector(
                    "perspective-expression-editor:not([initializing])"
                );
                await page.shadow_type(
                    expr,
                    "perspective-expression-editor",
                    "textarea"
                );
                await page.waitForSelector(
                    "perspective-expression-editor:not([validating])"
                );
                return await page.evaluate(async () => {
                    const elem = document.querySelector(
                        "perspective-expression-editor"
                    );
                    return (
                        elem.shadowRoot
                            .querySelector("button")
                            .getAttribute("disabled") || "MISSING"
                    );
                });
            }

            // Functionality - make sure the UI will validate error cases so
            // the engine is not affected.
            test.capture(
                "An expression with unknown symbols should disable the save button",
                async (page) => {
                    return await type_expression_test(page, "abc");
                }
            );

            test.capture(
                "A type-invalid expression should disable the save button",
                async (page) => {
                    return await type_expression_test(
                        page,
                        '"Sales" + "Category";'
                    );
                }
            );

            test.capture(
                "An expression with invalid input columns should disable the save button",
                async (page) => {
                    return await type_expression_test(
                        page,
                        '"aaaa" + "Sales";'
                    );
                }
            );

            test.capture(
                "Should show both aliased and non-aliased expressions in columns",
                async (page) => {
                    return await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                        await elem.restore({
                            expressions: ["1 + 2", "// abc \n3 + 4"],
                        });
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture(
                "Should save an expression when the save button is clicked",
                async (page) => {
                    await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                    });

                    await type_expression_test(page, "// abc2 \n 4 + 5");
                    await page.shadow_click(
                        "perspective-expression-editor",
                        "button"
                    );

                    return page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.flush();
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture(
                "Should overwrite a duplicate expression alias",
                async (page) => {
                    await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                        await elem.restore({
                            expressions: ["// abc \n3 + 4"],
                        });
                    });

                    await type_expression_test(page, "// abc \n 4 + 5");
                    await page.shadow_click(
                        "perspective-expression-editor",
                        "button"
                    );

                    return page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture(
                "Should overwrite a duplicate expression",
                async (page) => {
                    await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                        await elem.restore({
                            expressions: ["3 + 4"],
                        });
                    });

                    await type_expression_test(page, "3 + 4");
                    await page.shadow_click(
                        "perspective-expression-editor",
                        "button"
                    );

                    return page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture(
                "Resetting the viewer should delete all expressions",
                async (page) => {
                    await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                        await elem.restore({
                            expressions: ["3 + 4", "1 + 2"],
                        });
                        await elem.reset();
                    });

                    return page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture(
                "Resetting the viewer when expression as in columns field, should delete all expressions",
                async (page) => {
                    await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                        await elem.restore({
                            columns: ["1 + 2"],
                            expressions: ["3 + 4", "1 + 2"],
                        });
                        await elem.reset();
                    });

                    return page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture(
                "Resetting the viewer when expression as in row_pivots or other field, should delete all expressions",
                async (page) => {
                    await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                        await elem.restore({
                            columns: ["1 + 2"],
                            row_pivots: ["3 + 4"],
                            sort: [["1 + 2", "asc"]],
                            filter: [["1 + 2", "==", 3]],
                            expressions: ["3 + 4", "1 + 2"],
                        });
                        await elem.reset();
                    });

                    return page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture(
                "Expressions should persist when new views are created which don't use them",
                async (page) => {
                    await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                        await elem.restore({
                            expressions: ["3 + 4", "1 + 2"],
                        });
                        await elem.restore({
                            columns: ["State"],
                        });
                    });

                    return page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture(
                "Expressions should persist when new views are created using them",
                async (page) => {
                    await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                        await elem.restore({
                            expressions: ["3 + 4", "1 + 2"],
                        });
                        await elem.restore({
                            columns: ["3 + 4"],
                        });
                    });

                    return page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture(
                "Aggregates for expressions should apply",
                async (page) => {
                    await page.evaluate(async () => {
                        document.activeElement.blur();
                        const elem =
                            document.querySelector("perspective-viewer");
                        await elem.toggleConfig(true);
                        await elem.restore({
                            expressions: ['"Sales" + 100'],
                            aggregates: {'"Sales" + 100': "avg"},
                            row_pivots: ["State"],
                            columns: ['"Sales" + 100'],
                        });
                    });

                    return page.evaluate(async () => {
                        const elem =
                            document.querySelector("perspective-viewer");
                        return elem.shadowRoot.querySelector(
                            "#expression-columns"
                        ).innerHTML;
                    });
                }
            );

            test.capture("Should sort by hidden expressions", async (page) => {
                await page.evaluate(async () => {
                    document.activeElement.blur();
                    const elem = document.querySelector("perspective-viewer");
                    await elem.toggleConfig(true);
                    await elem.restore({
                        expressions: ['"Sales" + 100'],
                        sort: [['"Sales" + 100', "asc"]],
                        columns: ["Row ID"],
                    });
                });

                return page.evaluate(async () => {
                    const elem = document.querySelector("perspective-viewer");
                    return elem.shadowRoot.querySelector("#expression-columns")
                        .innerHTML;
                });
            });

            test.capture("Should filter by an expression", async (page) => {
                await page.evaluate(async () => {
                    document.activeElement.blur();
                    const elem = document.querySelector("perspective-viewer");
                    await elem.toggleConfig(true);
                    await elem.restore({
                        expressions: ['"Sales" + 100'],
                        filter: [['"Sales" + 100', ">", 150]],
                        columns: ["Row ID", '"Sales" + 100'],
                    });
                });

                return page.evaluate(async () => {
                    const elem = document.querySelector("perspective-viewer");
                    return elem.shadowRoot.querySelector("#expression-columns")
                        .innerHTML;
                });
            });
        },
        {
            root: path.join(__dirname, "..", ".."),
            name: "Expressions",
        }
    );
});
