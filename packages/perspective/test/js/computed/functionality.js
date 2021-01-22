/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const common = require("./common.js");

/**
 * Tests the functionality of `View`-based computed columns, specifically that
 * existing column/view semantics (pivots, aggregates, columns, sorts, filters)
 * continue to be functional on computed columns.
 */
module.exports = perspective => {
    describe("Functionality", function() {
        it("Should be able to create a computed column in `view()`", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();
            table.delete();
        });

        it("Should be able to create a chained computed column in `view()`", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                columns: ["col2"],
                computed_columns: [
                    {
                        column: "col1",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "col2",
                        computed_function_name: "x^2",
                        inputs: ["col1"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result["col2"]).toEqual([2.5, 4.5, 6.5, 8.5].map(x => Math.pow(x, 2)));
            view.delete();
            table.delete();
        });

        it("Should be able to create a computed column in `view()` from schema, and updates propagate", async function() {
            const table = perspective.table({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean"
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const result = await view.to_columns();
            expect(result).toEqual({});

            table.update(common.int_float_data);

            const new_result = await view.to_columns();
            expect(new_result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);

            view.delete();
            table.delete();
        });

        it("Should be able to create chained computed columns in `view()` from schema, and updates propagate", async function() {
            const table = perspective.table({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean"
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "computed2",
                        computed_function_name: "pow2",
                        inputs: ["int + float"]
                    }
                ]
            });

            const result = await view.to_columns();
            expect(result).toEqual({});

            table.update(common.int_float_data);

            const new_result = await view.to_columns();
            expect(new_result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(new_result["computed2"]).toEqual([2.5, 4.5, 6.5, 8.5].map(x => Math.pow(x, 2)));

            view.delete();
            table.delete();
        });

        it("Should not be able to create multiple computed column in multiple `view()`s with the same name and different types.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const schema = await view.schema();
            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                computed: "float"
            });

            expect(() =>
                table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "uppercase",
                            inputs: ["y"]
                        }
                    ]
                })
            ).toThrow();

            // Earlier view should not break
            const result = await view.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                computed: [2.5, 4.5, 6.5, 8.5]
            });

            view.delete();
            table.delete();
        });

        it("A new view should not reference computed columns it did not create.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result["computed"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(() => {
                table.view({
                    columns: ["computed", "x"]
                });
            }).toThrow();
            view.delete();
            table.delete();
        });

        it("A view should not be able to overwrite table columns with a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            expect(() => {
                table.view({
                    computed_columns: [
                        {
                            column: "x",
                            computed_function_name: "+",
                            inputs: ["x", "y"]
                        }
                    ]
                });
            }).toThrow();
            table.delete();
        });

        it("Should be able to create multiple computed columns in `view()`", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "uppercase",
                        computed_function_name: "Uppercase",
                        inputs: ["y"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(result["uppercase"]).toEqual(["A", "B", "C", "D"]);
            view.delete();
            table.delete();
        });

        it("Should be able to create multiple computed columns in multiple `view()`s", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "float + int",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const view2 = table.view({
                computed_columns: [
                    {
                        column: "float - int",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const schema = await view.schema();
            const schema2 = await view2.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float"
            });

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float - int": "float"
            });

            const result = await view.to_columns();
            const result2 = await view2.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                "float + int": [2.5, 4.5, 6.5, 8.5]
            });

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                "float - int": [0.5, 0.5, 0.5, 0.5]
            });

            view2.delete();
            view.delete();
            table.delete();
        });

        it("Should be able to create multiple computed columns in multiple `view()`s, and arbitarily delete views.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "float + int",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const view2 = table.view({
                computed_columns: [
                    {
                        column: "float - int",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const schema = await view.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float"
            });
            const result = await view.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                "float + int": [2.5, 4.5, 6.5, 8.5]
            });

            view.delete();

            const schema2 = await view2.schema();

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float - int": "float"
            });

            const result2 = await view2.to_columns();

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                "float - int": [0.5, 0.5, 0.5, 0.5]
            });

            view2.delete();
            table.delete();
        });

        it("Should be able to create multiple computed columns in multiple `view()`s, and delete preceding views without affecting later columns.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "float + int",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const view2 = table.view({
                computed_columns: [
                    {
                        column: "float + int",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "float - int",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const schema = await view.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float"
            });
            const result = await view.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                "float + int": [2.5, 4.5, 6.5, 8.5]
            });

            view.delete();

            const schema2 = await view2.schema();

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float",
                "float - int": "float"
            });

            const result2 = await view2.to_columns();

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                "float + int": [2.5, 4.5, 6.5, 8.5],
                "float - int": [0.5, 0.5, 0.5, 0.5]
            });

            view2.delete();
            table.delete();
        });

        it("Multiple views inheriting the same computed columns with the same names should not conflict", async function() {
            const table = perspective.table(common.int_float_data);

            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });

            expect(await view.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                computed: "float"
            });

            const view2 = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "computed2",
                        computed_function_name: "-",
                        inputs: ["computed", "w"]
                    }
                ]
            });

            expect(await view2.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                computed: "float",
                computed2: "float"
            });

            const view3 = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "computed2",
                        computed_function_name: "-",
                        inputs: ["computed", "w"]
                    },
                    {
                        column: "result",
                        computed_function_name: "-",
                        inputs: ["computed2", "x"]
                    }
                ]
            });

            expect(await view3.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                computed: "float",
                computed2: "float",
                result: "float"
            });

            const result = await view3.to_columns();
            expect(result["result"]).toEqual(Array(result["w"].length).fill(0));

            view3.delete();
            view2.delete();
            view.delete();
            table.delete();
        });

        it("A view should be able to create a computed column with the same name as another deleted view's computed columns.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const result = await view.to_columns();
            expect(result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();

            const view2 = table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const result2 = await view2.to_columns();
            expect(result2["int + float"]).toEqual([0.5, 0.5, 0.5, 0.5]);

            view2.delete();
            table.delete();
        });

        it("A view without computed columns should break when serializing after another view with a computed column is deleted.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const result = await view.to_columns();
            expect(result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();

            const view2 = table.view();

            const result2 = await view2.to_json();
            expect(result2).toEqual(common.int_float_data);

            view2.delete();
            table.delete();
        });

        it("When computed columns are repeated between views, column indices should grow linearly.", async function() {
            let computed = [
                {
                    column: "float + int",
                    computed_function_name: "+",
                    inputs: ["w", "x"]
                },
                {
                    column: "float - int",
                    computed_function_name: "-",
                    inputs: ["w", "x"]
                },
                {
                    column: "float * int",
                    computed_function_name: "*",
                    inputs: ["w", "x"]
                },
                {
                    column: "float / int",
                    computed_function_name: "/",
                    inputs: ["w", "x"]
                }
            ];
            const table = perspective.table(common.int_float_data);
            const view = table.view({computed_columns: [computed[0]]});
            const view2 = table.view({computed_columns: [computed[0], computed[1]]});
            const view3 = table.view({computed_columns: [computed[0], computed[1], computed[2]]});
            const view4 = table.view({computed_columns: computed});

            const schema = await view.schema();
            const schema2 = await view2.schema();
            const schema3 = await view3.schema();
            const schema4 = await view4.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float"
            });

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float",
                "float - int": "float"
            });

            expect(schema3).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float",
                "float - int": "float",
                "float * int": "float"
            });

            expect(schema4).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float",
                "float - int": "float",
                "float * int": "float",
                "float / int": "float"
            });

            view4.delete();
            view3.delete();
            view2.delete();
            view.delete();
            table.delete();
        });

        it.skip("Should be able to create multiple computed column in multiple `view()`s with the same name", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "float + int",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const view2 = table.view({
                computed_columns: [
                    {
                        column: "float + int",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const schema = await view.schema();
            const schema2 = await view2.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float"
            });

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "float + int": "float"
            });

            const result = await view.to_columns();
            const result2 = await view2.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                "float + int": [2.5, 4.5, 6.5, 8.5]
            });

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                "float + int": [0.5, 0.5, 0.5, 0.5]
            });

            view2.delete();
            view.delete();
            table.delete();
        });

        it("A new view should not inherit computed columns if not created.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(() => {
                table.view({
                    columns: ["int + float", "x"]
                });
            }).toThrow();
            view.delete();
            table.delete();
        });

        it("The view's underlying table should not have a mutated schema.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(await table.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean"
            });
            view.delete();
            table.delete();
        });

        it("Should be able to show a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                columns: ["int + float"],
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();
            table.delete();
        });

        it("Should be able to hide a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                columns: ["x"],
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            expect(await view.schema()).toEqual({
                x: "integer"
            });
            const result = await view.to_columns();
            expect(result["int + float"]).toEqual(undefined);
            expect(result["x"]).toEqual([1, 2, 3, 4]);
            view.delete();
            table.delete();
        });

        it("Should be able to row pivot on a non-computed column and get correct results.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                row_pivots: ["w"],
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [1.5], [2.5], [3.5], [4.5]],
                "int + float": [22, 2.5, 4.5, 6.5, 8.5],
                w: [12, 1.5, 2.5, 3.5, 4.5],
                x: [10, 1, 2, 3, 4],
                y: [4, 1, 1, 1, 1],
                z: [4, 1, 1, 1, 1]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to row pivot on a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                row_pivots: ["int + float"],
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                "int + float": [22, 2.5, 4.5, 6.5, 8.5],
                w: [12, 1.5, 2.5, 3.5, 4.5],
                x: [10, 1, 2, 3, 4],
                y: [4, 1, 1, 1, 1],
                z: [4, 1, 1, 1, 1]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to column pivot on a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                column_pivots: ["int + float"],
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                "2.5|w": [1.5, null, null, null],
                "2.5|x": [1, null, null, null],
                "2.5|y": ["a", null, null, null],
                "2.5|z": [true, null, null, null],
                "2.5|int + float": [2.5, null, null, null],
                "4.5|w": [null, 2.5, null, null],
                "4.5|x": [null, 2, null, null],
                "4.5|y": [null, "b", null, null],
                "4.5|z": [null, false, null, null],
                "4.5|int + float": [null, 4.5, null, null],
                "6.5|w": [null, null, 3.5, null],
                "6.5|x": [null, null, 3, null],
                "6.5|y": [null, null, "c", null],
                "6.5|z": [null, null, true, null],
                "6.5|int + float": [null, null, 6.5, null],
                "8.5|w": [null, null, null, 4.5],
                "8.5|x": [null, null, null, 4],
                "8.5|y": [null, null, null, "d"],
                "8.5|z": [null, null, null, false],
                "8.5|int + float": [null, null, null, 8.5]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to row + column pivot on a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                row_pivots: ["int + float"],
                column_pivots: ["int + float"],
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                "2.5|w": [1.5, 1.5, null, null, null],
                "2.5|x": [1, 1, null, null, null],
                "2.5|y": [1, 1, null, null, null],
                "2.5|z": [1, 1, null, null, null],
                "2.5|int + float": [2.5, 2.5, null, null, null],
                "4.5|w": [2.5, null, 2.5, null, null],
                "4.5|x": [2, null, 2, null, null],
                "4.5|y": [1, null, 1, null, null],
                "4.5|z": [1, null, 1, null, null],
                "4.5|int + float": [4.5, null, 4.5, null, null],
                "6.5|w": [3.5, null, null, 3.5, null],
                "6.5|x": [3, null, null, 3, null],
                "6.5|y": [1, null, null, 1, null],
                "6.5|z": [1, null, null, 1, null],
                "6.5|int + float": [6.5, null, null, 6.5, null],
                "8.5|w": [4.5, null, null, null, 4.5],
                "8.5|x": [4, null, null, null, 4],
                "8.5|y": [1, null, null, null, 1],
                "8.5|z": [1, null, null, null, 1],
                "8.5|int + float": [8.5, null, null, null, 8.5]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a numeric computed column.", async function() {
            const table = perspective.table({
                x: [1, 2, 3, 4],
                y: [100, 200, 300, 400],
                z: [1.5, 2.5, 3.5, 4.5]
            });
            const view = table.view({
                row_pivots: ["comp"],
                aggregates: {
                    comp: "median",
                    x: "median"
                },
                computed_columns: [
                    {
                        column: "comp",
                        computed_function_name: "+",
                        inputs: ["x", "z"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                comp: [6.5, 2.5, 4.5, 6.5, 8.5],
                x: [3, 1, 2, 3, 4],
                y: [1000, 100, 200, 300, 400],
                z: [12, 1.5, 2.5, 3.5, 4.5]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a string computed column.", async function() {
            const table = perspective.table({
                x: ["a", "a", "c", "a"],
                y: ["w", "w", "y", "w"]
            });
            const view = table.view({
                row_pivots: ["comp"],
                aggregates: {
                    comp: "distinct count"
                },
                computed_columns: [
                    {
                        column: "comp",
                        computed_function_name: "concat_comma",
                        inputs: ["x", "y"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], ["a, w"], ["c, y"]],
                comp: [2, 1, 1],
                x: [4, 3, 1],
                y: [4, 3, 1]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a date computed column.", async function() {
            const table = perspective.table({
                x: [new Date(2019, 0, 15), new Date(2019, 0, 30), new Date(2019, 1, 15)]
            });
            const view = table.view({
                row_pivots: ["comp"],
                aggregates: {
                    comp: "distinct count"
                },
                computed_columns: [
                    {
                        column: "comp",
                        computed_function_name: "Bucket (M)",
                        inputs: ["x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [1546300800000], [1548979200000]],
                comp: [2, 1, 1],
                x: [3, 2, 1]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to weighted mean on a computed column.", async function() {
            const table = perspective.table({
                x: [1, 2, 3, 4],
                y: [100, 200, 300, 400],
                z: [1.5, 2.5, 3.5, 4.5]
            });
            const view = table.view({
                row_pivots: ["comp"],
                aggregates: {
                    x: ["weighted mean", "comp"],
                    comp: ["weighted mean", "y"]
                },
                computed_columns: [
                    {
                        column: "comp",
                        computed_function_name: "+",
                        inputs: ["x", "z"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                comp: [6.5, 2.5, 4.5, 6.5, 8.5],
                x: [2.9545454545454546, 1, 2, 3, 4],
                y: [1000, 100, 200, 300, 400],
                z: [12, 1.5, 2.5, 3.5, 4.5]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to filter on a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                filter: [["int + float", ">", 6.5]],
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                "int + float": [8.5],
                w: [4.5],
                x: [4],
                y: ["d"],
                z: [false]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to sort on a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                sort: [["int + float", "desc"]],
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                "int + float": [8.5, 6.5, 4.5, 2.5],
                w: [4.5, 3.5, 2.5, 1.5],
                x: [4, 3, 2, 1],
                y: ["d", "c", "b", "a"],
                z: [false, true, false, true]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to sort on a hidden computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                columns: ["w"],
                sort: [["int + float", "desc"]],
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                w: [4.5, 3.5, 2.5, 1.5]
            });
            view.delete();
            table.delete();
        });

        describe("Table Computed Schema", function() {
            it("Should show computed column types in table computed schema.", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const computed = [
                    {
                        column: "(a ^ 2)",
                        computed_function_name: "pow2",
                        inputs: ["a"]
                    },
                    {
                        column: "def",
                        computed_function_name: "sqrt",
                        inputs: ["(a ^ 2)"]
                    },
                    {
                        column: "concat_comma(c, c)",
                        computed_function_name: "concat_comma",
                        inputs: ["c", "c"]
                    },
                    {
                        column: "upper",
                        computed_function_name: "uppercase",
                        inputs: ["concat_comma(c, c)"]
                    },
                    {
                        column: "wb",
                        computed_function_name: "week_bucket",
                        inputs: ["b"]
                    }
                ];
                const schema = await table.computed_schema(computed);
                expect(schema).toEqual({
                    "(a ^ 2)": "float",
                    "concat_comma(c, c)": "string",
                    wb: "date",
                    def: "float",
                    upper: "string"
                });
                table.delete();
            });

            it("Should skip a invalid column due to type error, as well as all columns that depend on the invalid column.", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5]
                });
                const computed = [
                    {
                        column: "first", // invalid
                        computed_function_name: "concat_comma",
                        inputs: ["a", "c"]
                    },
                    {
                        column: "second", // valid
                        computed_function_name: "sqrt",
                        inputs: ["d"]
                    },
                    {
                        column: "third", // depends on invalid
                        computed_function_name: "uppercase",
                        inputs: ["first"]
                    },
                    {
                        column: "fourth", // depends on invalid of invalid
                        computed_function_name: "lowercase",
                        inputs: ["third"]
                    },
                    {
                        column: "fifth", // valid
                        computed_function_name: "week_bucket",
                        inputs: ["b"]
                    }
                ];
                const schema = await table.computed_schema(computed);
                expect(schema).toEqual({
                    second: "float",
                    fifth: "date"
                });
                table.delete();
            });

            it("Should skip a invalid column due to invalid column name, as well as all columns that depend on the invalid column.", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5]
                });
                const computed = [
                    {
                        column: "first", // valid
                        computed_function_name: "concat_comma",
                        inputs: ["c", "c"]
                    },
                    {
                        column: "second", // invalid
                        computed_function_name: "sqrt",
                        inputs: ["does not exist"]
                    },
                    {
                        column: "third", // depends on invalid
                        computed_function_name: "pow2",
                        inputs: ["second"]
                    },
                    {
                        column: "fourth", // depends on invalid of invalid
                        computed_function_name: "abs",
                        inputs: ["third"]
                    },
                    {
                        column: "fifth", // valid
                        computed_function_name: "week_bucket",
                        inputs: ["b"]
                    }
                ];
                const schema = await table.computed_schema(computed);
                expect(schema).toEqual({
                    first: "string",
                    fifth: "date"
                });
                table.delete();
            });
        });

        describe("Table Computed Function Input Types", function() {
            it("Should return correct types for numeric functions", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const expected = ["integer", "float"];
                expect(await table.get_computation_input_types("pow2")).toEqual(expected);
                expect(await table.get_computation_input_types("+")).toEqual(expected);
                expect(await table.get_computation_input_types("percent_of")).toEqual(expected);
            });

            it("Should return correct types for string functions", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const expected = ["string"];
                expect(await table.get_computation_input_types("concat_comma")).toEqual(expected);
                expect(await table.get_computation_input_types("uppercase")).toEqual(expected);
                expect(await table.get_computation_input_types("length")).toEqual(expected);
            });

            it("Should return correct types for date/time functions", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const expected = ["datetime", "date"];
                expect(await table.get_computation_input_types("week_bucket")).toEqual(expected);
                expect(await table.get_computation_input_types("day_of_week")).toEqual(expected);
                expect(await table.get_computation_input_types("month_of_year")).toEqual(expected);
            });
        });

        describe("View Computed Schema", function() {
            it("Column types in view computed schema on 0-sided view.", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = table.view({
                    computed_columns: [
                        {
                            column: "(a ^ 2)",
                            computed_function_name: "pow2",
                            inputs: ["a"]
                        },
                        {
                            column: "def",
                            computed_function_name: "sqrt",
                            inputs: ["(a ^ 2)"]
                        },
                        {
                            column: "concat_comma(c, c)",
                            computed_function_name: "concat_comma",
                            inputs: ["c", "c"]
                        },
                        {
                            column: "upper",
                            computed_function_name: "uppercase",
                            inputs: ["concat_comma(c, c)"]
                        },
                        {
                            column: "wb",
                            computed_function_name: "week_bucket",
                            inputs: ["b"]
                        }
                    ]
                });
                const schema = await view.computed_schema();
                expect(schema).toEqual({
                    "(a ^ 2)": "float",
                    "concat_comma(c, c)": "string",
                    wb: "date",
                    def: "float",
                    upper: "string"
                });
                view.delete();
                table.delete();
            });

            it("Should show ALL columns in view computed schema regardless of custom columns.", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = table.view({
                    columns: ["wb"],
                    computed_columns: [
                        {
                            column: "(a ^ 2)",
                            computed_function_name: "pow2",
                            inputs: ["a"]
                        },
                        {
                            column: "def",
                            computed_function_name: "sqrt",
                            inputs: ["(a ^ 2)"]
                        },
                        {
                            column: "concat_comma(c, c)",
                            computed_function_name: "concat_comma",
                            inputs: ["c", "c"]
                        },
                        {
                            column: "upper",
                            computed_function_name: "uppercase",
                            inputs: ["concat_comma(c, c)"]
                        },
                        {
                            column: "wb",
                            computed_function_name: "week_bucket",
                            inputs: ["b"]
                        }
                    ]
                });
                const schema = await view.computed_schema();
                expect(schema).toEqual({
                    "(a ^ 2)": "float",
                    "concat_comma(c, c)": "string",
                    wb: "date",
                    def: "float",
                    upper: "string"
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view computed schema on 1-sided view.", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = table.view({
                    row_pivots: ["def"],
                    computed_columns: [
                        {
                            column: "(a ^ 2)",
                            computed_function_name: "pow2",
                            inputs: ["a"]
                        },
                        {
                            column: "def",
                            computed_function_name: "sqrt",
                            inputs: ["(a ^ 2)"]
                        },
                        {
                            column: "concat_comma(c, c)",
                            computed_function_name: "concat_comma",
                            inputs: ["c", "c"]
                        },
                        {
                            column: "upper",
                            computed_function_name: "uppercase",
                            inputs: ["concat_comma(c, c)"]
                        },
                        {
                            column: "wb",
                            computed_function_name: "week_bucket",
                            inputs: ["b"]
                        }
                    ]
                });
                const schema = await view.computed_schema();
                expect(schema).toEqual({
                    "(a ^ 2)": "float",
                    "concat_comma(c, c)": "integer",
                    wb: "integer",
                    def: "float",
                    upper: "integer"
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view computed schema on 1-sided view with custom aggregates.", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = table.view({
                    aggregates: {
                        upper: "any"
                    },
                    row_pivots: ["upper"],
                    computed_columns: [
                        {
                            column: "(a ^ 2)",
                            computed_function_name: "pow2",
                            inputs: ["a"]
                        },
                        {
                            column: "def",
                            computed_function_name: "sqrt",
                            inputs: ["(a ^ 2)"]
                        },
                        {
                            column: "concat_comma(c, c)",
                            computed_function_name: "concat_comma",
                            inputs: ["c", "c"]
                        },
                        {
                            column: "upper",
                            computed_function_name: "uppercase",
                            inputs: ["concat_comma(c, c)"]
                        },
                        {
                            column: "wb",
                            computed_function_name: "week_bucket",
                            inputs: ["b"]
                        }
                    ]
                });
                const schema = await view.computed_schema();
                expect(schema).toEqual({
                    "(a ^ 2)": "float",
                    "concat_comma(c, c)": "integer",
                    wb: "integer",
                    def: "float",
                    upper: "string"
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view computed schema on 2-sided view.", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = table.view({
                    row_pivots: ["def"],
                    column_pivots: ["wb"],
                    computed_columns: [
                        {
                            column: "(a ^ 2)",
                            computed_function_name: "pow2",
                            inputs: ["a"]
                        },
                        {
                            column: "def",
                            computed_function_name: "sqrt",
                            inputs: ["(a ^ 2)"]
                        },
                        {
                            column: "concat_comma(c, c)",
                            computed_function_name: "concat_comma",
                            inputs: ["c", "c"]
                        },
                        {
                            column: "upper",
                            computed_function_name: "uppercase",
                            inputs: ["concat_comma(c, c)"]
                        },
                        {
                            column: "wb",
                            computed_function_name: "week_bucket",
                            inputs: ["b"]
                        }
                    ]
                });
                const schema = await view.computed_schema();
                expect(schema).toEqual({
                    "(a ^ 2)": "float",
                    "concat_comma(c, c)": "integer",
                    wb: "integer",
                    def: "float",
                    upper: "integer"
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view computed schema on 2-sided column-only view.", async function() {
                const table = perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = table.view({
                    column_pivots: ["def"],
                    computed_columns: [
                        {
                            column: "(a ^ 2)",
                            computed_function_name: "pow2",
                            inputs: ["a"]
                        },
                        {
                            column: "def",
                            computed_function_name: "sqrt",
                            inputs: ["(a ^ 2)"]
                        },
                        {
                            column: "concat_comma(c, c)",
                            computed_function_name: "concat_comma",
                            inputs: ["c", "c"]
                        },
                        {
                            column: "upper",
                            computed_function_name: "uppercase",
                            inputs: ["concat_comma(c, c)"]
                        },
                        {
                            column: "wb",
                            computed_function_name: "week_bucket",
                            inputs: ["b"]
                        }
                    ]
                });
                const schema = await view.computed_schema();
                expect(schema).toEqual({
                    "(a ^ 2)": "float",
                    "concat_comma(c, c)": "string",
                    wb: "date",
                    def: "float",
                    upper: "string"
                });
                view.delete();
                table.delete();
            });
        });
    });
};
