/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const common = require("./common.js");

const data = [
    {x: 1, y: 2},
    {x: 2, y: 4},
    {x: 3, y: 6},
    {x: 4, y: 8}
];

const pivot_data = [
    {int: 1, float: 2.25},
    {int: 2, float: 3.5},
    {int: 3, float: 4.75},
    {int: 4, float: 5.25}
];

/**
 * Tests the correctness of updates on Tables with computed columns created
 * through `View`, including partial updates, appends, and removes.
 */
module.exports = perspective => {
    describe("computed updates", function() {
        it("Dependent column update appends should notify computed columns, arity 1", async function() {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: ["A", "B", "C", "D"]
            });
            const view = await table.view({
                computed_columns: [
                    {
                        column: "lowercase",
                        computed_function_name: "Lowercase",
                        inputs: ["y"]
                    }
                ]
            });

            const before = await view.to_columns();
            expect(before["lowercase"]).toEqual(["a", "b", "c", "d"]);
            table.update({y: ["HELLO", "WORLD"]});

            const after = await view.to_columns();
            expect(after["lowercase"]).toEqual(["a", "b", "c", "d", "hello", "world"]);
            view.delete();
            table.delete();
        });

        it("Dependent column updates should notify computed columns, arity 1", async function() {
            const table = await perspective.table(
                {
                    x: [1, 2, 3, 4],
                    y: ["A", "B", "C", "D"]
                },
                {index: "x"}
            );
            const view = await table.view({
                computed_columns: [
                    {
                        column: "lowercase",
                        computed_function_name: "Lowercase",
                        inputs: ["y"]
                    }
                ]
            });

            const before = await view.to_columns();
            expect(before["lowercase"]).toEqual(["a", "b", "c", "d"]);
            table.update({x: [1, 3], y: ["HELLO", "WORLD"]});

            const after = await view.to_columns();
            expect(after["lowercase"]).toEqual(["hello", "b", "world", "d"]);
            view.delete();
            table.delete();
        });

        it("Dependent column appends with missing columns should notify computed columns, arity 1", async function() {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: [1.5, 2.5, 3.5, 4.5],
                z: ["a", "b", "c", "d"]
            });
            const view = await table.view({
                computed_columns: [
                    {
                        column: "upper",
                        computed_function_name: "Uppercase",
                        inputs: ["z"]
                    }
                ]
            });
            const before = await view.to_columns();
            expect(before["upper"]).toEqual(["A", "B", "C", "D"]);

            // `z` is missing in the update, so it should render as null
            table.update({x: [2, 4], y: [10.5, 12.5]});

            const after = await view.to_columns();
            expect(after).toEqual({
                x: [1, 2, 3, 4, 2, 4],
                y: [1.5, 2.5, 3.5, 4.5, 10.5, 12.5],
                z: ["a", "b", "c", "d", null, null],
                upper: ["A", "B", "C", "D", null, null]
            });
            view.delete();
            table.delete();
        });

        it("Dependent column update appends should notify computed columns, pivoted arity 1", async function() {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: ["A", "B", "C", "C"]
            });
            const view = await table.view({
                row_pivots: ["lowercase"],
                computed_columns: [
                    {
                        column: "lowercase",
                        computed_function_name: "Lowercase",
                        inputs: ["y"]
                    }
                ]
            });

            const before = await view.to_columns();
            expect(before).toEqual({
                __ROW_PATH__: [[], ["a"], ["b"], ["c"]],
                lowercase: [4, 1, 1, 2],
                x: [10, 1, 2, 7],
                y: [4, 1, 1, 2]
            });

            table.update({y: ["HELLO", "WORLD"]});

            const after = await view.to_columns();
            expect(after).toEqual({
                __ROW_PATH__: [[], ["a"], ["b"], ["c"], ["hello"], ["world"]],
                lowercase: [6, 1, 1, 2, 1, 1],
                x: [10, 1, 2, 7, 0, 0],
                y: [6, 1, 1, 2, 1, 1]
            });
            view.delete();
            table.delete();
        });

        it("Dependent column appends should notify computed columns, arity 2", async function() {
            const table = await perspective.table(common.int_float_data);
            const view = await table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });
            const before = await view.to_columns();
            expect(before["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);

            table.update({x: [2, 4], w: [10.5, 12.5]});

            const after = await view.to_columns();
            expect(after["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5, 12.5, 16.5]);
            view.delete();
            table.delete();
        });

        it("Dependent column updates on all column updates should notify computed columns, arity 2", async function() {
            const table = await perspective.table(common.int_float_data, {index: "x"});
            const view = await table.view({
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
            let before = await view.to_columns();
            expect(before["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(before["uppercase"]).toEqual(["A", "B", "C", "D"]);

            table.update({x: [2, 4], w: [10.5, 12.5]});

            const after = await view.to_columns();
            expect(after["int + float"]).toEqual([2.5, 12.5, 6.5, 16.5]);

            table.update({x: [1, 3], y: ["hello", "world"]});

            const after2 = await view.to_columns();
            expect(after2["uppercase"]).toEqual(["HELLO", "B", "WORLD", "D"]);
            view.delete();
            table.delete();
        });

        it("Dependent column appends should notify computed columns on different views, arity 2", async function() {
            const table = await perspective.table(common.int_float_data);
            const view = await table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const view2 = await table.view({
                computed_columns: [
                    {
                        column: "int - float",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const before = await view.to_columns();
            const before2 = await view2.to_columns();
            expect(before["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(before2["int - float"]).toEqual([0.5, 0.5, 0.5, 0.5]);

            table.update({x: [2, 4], w: [10.5, 12.5]});

            const after = await view.to_columns();
            const after2 = await view2.to_columns();
            expect(after["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5, 12.5, 16.5]);
            expect(after2["int - float"]).toEqual([0.5, 0.5, 0.5, 0.5, 8.5, 8.5]);
            view2.delete();
            view.delete();
            table.delete();
        });

        it("Dependent column updates should notify computed columns on different views, arity 2.", async function() {
            const table = await perspective.table(common.int_float_data, {index: "x"});
            const view = await table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const view2 = await table.view({
                computed_columns: [
                    {
                        column: "int - float",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const before = await view.to_columns();
            const before2 = await view2.to_columns();
            expect(before["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(before2["int - float"]).toEqual([0.5, 0.5, 0.5, 0.5]);

            table.update({x: [2, 4], w: [10.5, 12.5]});

            const after = await view.to_columns();
            const after2 = await view2.to_columns();
            expect(after["int + float"]).toEqual([2.5, 12.5, 6.5, 16.5]);
            expect(after2["int - float"]).toEqual([0.5, 8.5, 0.5, 8.5]);
            view2.delete();
            view.delete();
            table.delete();
        });

        it("Dependent column updates should notify `all` computed columns on different views, arity 2.", async function() {
            const table = await perspective.table(common.int_float_data, {index: "x"});
            const view = await table.view({
                computed_columns: [
                    {
                        column: "col1",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "col2",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const view2 = await table.view({
                computed_columns: [
                    {
                        column: "col3",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "col4",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const before = await view.to_columns();
            const before2 = await view2.to_columns();
            expect(before["col1"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(before["col2"]).toEqual([0.5, 0.5, 0.5, 0.5]);
            expect(before2["col3"]).toEqual([0.5, 0.5, 0.5, 0.5]);
            expect(before2["col4"]).toEqual([2.5, 4.5, 6.5, 8.5]);

            table.update({x: [2, 4], w: [10.5, 12.5]});

            const after = await view.to_columns();
            const after2 = await view2.to_columns();
            expect(after["col1"]).toEqual([2.5, 12.5, 6.5, 16.5]);
            expect(after["col2"]).toEqual([0.5, 8.5, 0.5, 8.5]);
            expect(after2["col3"]).toEqual([0.5, 8.5, 0.5, 8.5]);
            expect(after2["col4"]).toEqual([2.5, 12.5, 6.5, 16.5]);
            view2.delete();
            view.delete();
            table.delete();
        });

        it("Dependent column update with `null` should notify computed columns on different views, arity 2.", async function() {
            const table = await perspective.table(common.int_float_data, {index: "x"});
            const view = await table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const view2 = await table.view({
                computed_columns: [
                    {
                        column: "int - float",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]
            });

            const before = await view.to_columns();
            const before2 = await view2.to_columns();
            expect(before["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(before2["int - float"]).toEqual([0.5, 0.5, 0.5, 0.5]);

            table.update({x: [2, 4], w: [null, 12.5]});

            const after = await view.to_columns();
            const after2 = await view2.to_columns();
            expect(after["int + float"]).toEqual([2.5, null, 6.5, 16.5]);
            expect(after2["int - float"]).toEqual([0.5, null, 0.5, 8.5]);
            view2.delete();
            view.delete();
            table.delete();
        });

        it("Dependent column update with `null` should notify chained computed columns on different views, arity 2.", async function() {
            const table = await perspective.table(common.int_float_data, {index: "x"});
            const view = await table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "p2",
                        computed_function_name: "x^2",
                        inputs: ["int + float"]
                    }
                ]
            });

            const view2 = await table.view({
                computed_columns: [
                    {
                        column: "int - float",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    },
                    {
                        column: "invert",
                        computed_function_name: "1/x",
                        inputs: ["int - float"]
                    }
                ]
            });

            const before = await view.to_columns();
            const before2 = await view2.to_columns();
            expect(before["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(before["p2"]).toEqual(before["int + float"].map(x => Math.pow(x, 2)));
            expect(before2["int - float"]).toEqual([0.5, 0.5, 0.5, 0.5]);
            expect(before2["invert"]).toEqual(before2["int - float"].map(x => 1 / x));

            table.update({x: [2, 4], w: [null, 12.5]});

            const after = await view.to_columns();
            const after2 = await view2.to_columns();
            expect(after["int + float"]).toEqual([2.5, null, 6.5, 16.5]);
            expect(before["p2"]).toEqual(before["int + float"].map(x => (x ? Math.pow(x, 2) : null)));
            expect(after2["int - float"]).toEqual([0.5, null, 0.5, 8.5]);
            expect(before2["invert"]).toEqual(before2["int - float"].map(x => (x ? 1 / x : null)));
            view2.delete();
            view.delete();
            table.delete();
        });

        it("Updating with `null` should clear the output computed column.", async function() {
            const table = await perspective.table(
                {
                    w: [1.5, 2.5, 3.5, 4.5],
                    x: [1, 2, 3, 4],
                    y: [5, 6, 7, 8]
                },
                {index: "x"}
            );
            const view = await table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "y"]
                    }
                ]
            });
            let before = await view.to_columns();
            expect(before["int + float"]).toEqual([6.5, 8.5, 10.5, 12.5]);

            table.update({x: [2, 4], w: [null, 12.5]});

            const after = await view.to_columns();
            expect(after["int + float"]).toEqual([6.5, null, 10.5, 20.5]);

            table.update({x: [2, 3], w: [20.5, null]});

            const after2 = await view.to_columns();
            expect(after2["int + float"]).toEqual([6.5, 26.5, null, 20.5]);
            view.delete();
            table.delete();
        });

        it("Updating with `undefined` should not clear the output computed column.", async function() {
            const table = await perspective.table(
                {
                    w: [1.5, 2.5, 3.5, 4.5],
                    x: [1, 2, 3, 4],
                    y: [5, 6, 7, 8]
                },
                {index: "x"}
            );
            const view = await table.view({
                computed_columns: [
                    {
                        column: "int + float",
                        computed_function_name: "+",
                        inputs: ["w", "y"]
                    }
                ]
            });
            let before = await view.to_columns();
            expect(before["int + float"]).toEqual([6.5, 8.5, 10.5, 12.5]);

            table.update({x: [2, 4], w: [undefined, 12.5]});

            const after = await view.to_columns();
            expect(after["int + float"]).toEqual([6.5, 8.5, 10.5, 20.5]);

            table.update({x: [2, 3], w: [20.5, undefined]});

            const after2 = await view.to_columns();
            expect(after2["int + float"]).toEqual([6.5, 26.5, 10.5, 20.5]);
            view.delete();
            table.delete();
        });

        it("Updates on non-dependent columns should not change computed columns.", async function() {
            var meta = {
                w: "float",
                x: "float",
                y: "string",
                z: "boolean"
            };
            const table = await perspective.table(meta, {index: "y"});
            const view = await table.view({
                columns: ["y", "ratio"],
                computed_columns: [
                    {
                        column: "ratio",
                        computed_function_name: "/",
                        inputs: ["w", "x"]
                    }
                ]
            });

            table.update(common.int_float_data);

            let delta_upd = [
                {y: "a", z: false},
                {y: "b", z: true},
                {y: "c", z: false},
                {y: "d", z: true}
            ];
            table.update(delta_upd);
            let result = await view.to_json();
            let expected = [
                {y: "a", ratio: 1.5},
                {y: "b", ratio: 1.25},
                {y: "c", ratio: 1.1666666666666667},
                {y: "d", ratio: 1.125}
            ];
            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Should recompute after partial update using `__INDEX__`", async function() {
            const table = await perspective.table({x: "integer", y: "integer"});
            const view = await table.view({
                computed_columns: [
                    {
                        column: "multiply",
                        computed_function_name: "*",
                        inputs: ["x", "y"]
                    }
                ]
            });

            table.update(data);
            table.update([
                {__INDEX__: 0, x: 10},
                {__INDEX__: 2, x: 10}
            ]);

            const json = await view.to_json();
            expect(json).toEqual([
                {x: 10, y: 2, multiply: 20},
                {x: 2, y: 4, multiply: 8},
                {x: 10, y: 6, multiply: 60},
                {x: 4, y: 8, multiply: 32}
            ]);
            view.delete();
            table.delete();
        });

        it("Partial update without a new value shouldn't change computed output", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                computed_columns: [
                    {
                        column: "multiply",
                        computed_function_name: "*",
                        inputs: ["x", "y"]
                    }
                ]
            });

            const json = await view.to_json();
            expect(json).toEqual([
                {x: 1, y: 2, multiply: 2},
                {x: 2, y: 4, multiply: 8},
                {x: 3, y: 6, multiply: 18},
                {x: 4, y: 8, multiply: 32}
            ]);

            table.update([{__INDEX__: 0, x: 1}]);
            const json2 = await view.to_json();
            expect(json2).toEqual(json);
            view.delete();
            table.delete();
        });

        it("partial update on single computed source column", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                computed_columns: [
                    {
                        column: "multiply",
                        computed_function_name: "*",
                        inputs: ["x", "y"]
                    }
                ]
            });

            table.update([{__INDEX__: 0, x: 10}]);
            const json = await view.to_json();
            expect(json).toEqual([
                {x: 10, y: 2, multiply: 20},
                {x: 2, y: 4, multiply: 8},
                {x: 3, y: 6, multiply: 18},
                {x: 4, y: 8, multiply: 32}
            ]);
            view.delete();
            table.delete();
        });

        it("partial update on non-contiguous computed source columns", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                computed_columns: [
                    {
                        column: "multiply",
                        computed_function_name: "*",
                        inputs: ["x", "y"]
                    }
                ]
            });
            table.update([
                {__INDEX__: 0, x: 1, y: 10},
                {__INDEX__: 2, x: 3, y: 20}
            ]);
            let json = await view.to_json();
            expect(json).toEqual([
                {x: 1, y: 10, multiply: 10},
                {x: 2, y: 4, multiply: 8},
                {x: 3, y: 20, multiply: 60},
                {x: 4, y: 8, multiply: 32}
            ]);
            view.delete();
            table.delete();
        });

        it("partial update on non-contiguous computed source columns, indexed table", async function() {
            const table = await perspective.table(data, {index: "x"});
            const view = await table.view({
                computed_columns: [
                    {
                        column: "multiply",
                        computed_function_name: "*",
                        inputs: ["x", "y"]
                    }
                ]
            });
            table.update([
                {x: 1, y: 10},
                {x: 3, y: 20}
            ]);
            let json = await view.to_json();
            expect(json).toEqual([
                {x: 1, y: 10, multiply: 10},
                {x: 2, y: 4, multiply: 8},
                {x: 3, y: 20, multiply: 60},
                {x: 4, y: 8, multiply: 32}
            ]);
            view.delete();
            table.delete();
        });

        it("multiple partial update on single computed source column", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                computed_columns: [
                    {
                        column: "multiply",
                        computed_function_name: "*",
                        inputs: ["x", "y"]
                    }
                ]
            });

            table.update([
                {__INDEX__: 0, x: 10},
                {__INDEX__: 2, x: 10}
            ]);
            table.update([
                {__INDEX__: 0, x: 20},
                {__INDEX__: 2, x: 20}
            ]);
            table.update([
                {__INDEX__: 0, x: 30},
                {__INDEX__: 2, x: 30}
            ]);

            let json = await view.to_json();
            expect(json).toEqual([
                {x: 30, y: 2, multiply: 60},
                {x: 2, y: 4, multiply: 8},
                {x: 30, y: 6, multiply: 180},
                {x: 4, y: 8, multiply: 32}
            ]);
            view.delete();
            table.delete();
        });

        it("multiple computed columns with updates on source columns", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                computed_columns: [
                    {
                        column: "multiply",
                        computed_function_name: "*",
                        inputs: ["x", "y"]
                    }
                ]
            });
            const view2 = await table.view({
                computed_columns: [
                    {
                        column: "add",
                        computed_function_name: "+",
                        inputs: ["x", "y"]
                    }
                ]
            });

            table.update([
                {__INDEX__: 0, x: 5},
                {__INDEX__: 2, x: 10}
            ]);

            let result = await view.to_columns();
            let result2 = await view2.to_columns();

            expect(result).toEqual({
                x: [5, 2, 10, 4],
                y: [2, 4, 6, 8],
                multiply: [10, 8, 60, 32]
            });

            expect(result2).toEqual({
                x: [5, 2, 10, 4],
                y: [2, 4, 6, 8],
                add: [7, 6, 16, 12]
            });

            view2.delete();
            view.delete();
            table.delete();
        });

        it("propagate updates to all computed columns", async function() {
            const table = await perspective.table(data, {index: "x"});

            const view = await table.view({
                computed_columns: [
                    {
                        column: "multiply",
                        computed_function_name: "*",
                        inputs: ["x", "y"]
                    }
                ]
            });

            const view2 = await table.view({
                computed_columns: [
                    {
                        column: "add",
                        computed_function_name: "+",
                        inputs: ["x", "y"]
                    }
                ]
            });

            const view3 = await table.view({
                computed_columns: [
                    {
                        column: "subtract",
                        computed_function_name: "-",
                        inputs: ["x", "y"]
                    }
                ]
            });

            table.update({x: [1, 2, 3, 4], y: [1, 2, 3, 4]});

            let result = await view.to_columns();
            let result2 = await view2.to_columns();
            let result3 = await view3.to_columns();

            expect(result).toEqual({
                x: [1, 2, 3, 4],
                y: [1, 2, 3, 4],
                multiply: [1, 4, 9, 16]
            });

            expect(result2).toEqual({
                x: [1, 2, 3, 4],
                y: [1, 2, 3, 4],
                add: [2, 4, 6, 8]
            });

            expect(result3).toEqual({
                x: [1, 2, 3, 4],
                y: [1, 2, 3, 4],
                subtract: [0, 0, 0, 0]
            });

            view3.delete();
            view2.delete();
            view.delete();
            table.delete();
        });

        it("propagate appends to all computed columns", async function() {
            const table = await perspective.table(data);

            const view = await table.view({
                computed_columns: [
                    {
                        column: "multiply",
                        computed_function_name: "*",
                        inputs: ["x", "y"]
                    }
                ]
            });

            const view2 = await table.view({
                computed_columns: [
                    {
                        column: "add",
                        computed_function_name: "+",
                        inputs: ["x", "y"]
                    }
                ]
            });

            const view3 = await table.view({
                computed_columns: [
                    {
                        column: "subtract",
                        computed_function_name: "-",
                        inputs: ["x", "y"]
                    }
                ]
            });

            table.update({x: [1, 2, 3, 4], y: [1, 2, 3, 4]});

            let result = await view.to_columns();
            let result2 = await view2.to_columns();
            let result3 = await view3.to_columns();

            expect(result).toEqual({
                x: [1, 2, 3, 4, 1, 2, 3, 4],
                y: [2, 4, 6, 8, 1, 2, 3, 4],
                multiply: [2, 8, 18, 32, 1, 4, 9, 16]
            });

            expect(result2).toEqual({
                x: [1, 2, 3, 4, 1, 2, 3, 4],
                y: [2, 4, 6, 8, 1, 2, 3, 4],
                add: [3, 6, 9, 12, 2, 4, 6, 8]
            });

            expect(result3).toEqual({
                x: [1, 2, 3, 4, 1, 2, 3, 4],
                y: [2, 4, 6, 8, 1, 2, 3, 4],
                subtract: [-1, -2, -3, -4, 0, 0, 0, 0]
            });

            view3.delete();
            view2.delete();
            view.delete();
            table.delete();
        });
    });

    describe("Computed updates with row pivots", function() {
        it("should update on dependent columns, add", async function() {
            const table = await perspective.table(pivot_data);
            const view = await table.view({
                columns: ["computed", "int"],
                aggregates: {
                    computed: "sum"
                },
                row_pivots: ["computed"],
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "+",
                        inputs: ["int", "float"]
                    }
                ]
            });

            table.update({int: [4], __INDEX__: [0]});

            let results = await view.to_columns({
                index: true
            });

            expect(results).toEqual({
                __ROW_PATH__: [[], [5.5], [6.25], [7.75], [9.25]],
                int: [13, 2, 4, 3, 4],
                computed: [28.75, 5.5, 6.25, 7.75, 9.25],
                __INDEX__: [[0, 3, 2, 1], [1], [0], [2], [3]]
            });

            view.delete();
            table.delete();
        });

        it("should update on dependent columns, subtract", async function() {
            const table = await perspective.table(pivot_data);
            const view = await table.view({
                columns: ["computed", "int"],
                row_pivots: ["computed"],
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "-",
                        inputs: ["int", "float"]
                    }
                ]
            });

            table.update([{int: 4, __INDEX__: 0}]);

            let json = await view.to_json({
                index: true
            });

            expect(json).toEqual([
                {__ROW_PATH__: [], int: 13, computed: -2.75, __INDEX__: [0, 3, 1, 2]},
                {__ROW_PATH__: [-1.75], int: 3, computed: -1.75, __INDEX__: [2]},
                {__ROW_PATH__: [-1.5], int: 2, computed: -1.5, __INDEX__: [1]},
                {__ROW_PATH__: [-1.25], int: 4, computed: -1.25, __INDEX__: [3]},
                {__ROW_PATH__: [1.75], int: 4, computed: 1.75, __INDEX__: [0]}
            ]);

            view.delete();
            table.delete();
        });

        it("should update on dependent columns, multiply", async function() {
            const table = await perspective.table(pivot_data);

            const view = await table.view({
                columns: ["computed", "int"],
                row_pivots: ["computed"],
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "*",
                        inputs: ["int", "float"]
                    }
                ]
            });

            table.update([{int: 4, __INDEX__: 0}]);

            let json = await view.to_json({
                index: true
            });

            expect(json).toEqual([
                {__ROW_PATH__: [], int: 13, computed: 51.25, __INDEX__: [0, 3, 2, 1]},
                {__ROW_PATH__: [7], int: 2, computed: 7, __INDEX__: [1]},
                {__ROW_PATH__: [9], int: 4, computed: 9, __INDEX__: [0]},
                {__ROW_PATH__: [14.25], int: 3, computed: 14.25, __INDEX__: [2]},
                {__ROW_PATH__: [21], int: 4, computed: 21, __INDEX__: [3]}
            ]);

            view.delete();
            table.delete();
        });

        it("should update on dependent columns, divide", async function() {
            const table = await perspective.table(pivot_data);

            const view = await table.view({
                columns: ["computed", "int"],
                row_pivots: ["computed"],
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "/",
                        inputs: ["int", "float"]
                    }
                ]
            });

            table.update([{int: 4, __INDEX__: 0}]);

            let json = await view.to_json({
                index: true
            });

            expect(json).toEqual([
                {__ROW_PATH__: [], int: 13, computed: 3.742690058479532, __INDEX__: [0, 3, 2, 1]},
                {__ROW_PATH__: [0.5714285714285714], int: 2, computed: 0.5714285714285714, __INDEX__: [1]},
                {__ROW_PATH__: [0.631578947368421], int: 3, computed: 0.631578947368421, __INDEX__: [2]},
                {__ROW_PATH__: [0.7619047619047619], int: 4, computed: 0.7619047619047619, __INDEX__: [3]},
                {__ROW_PATH__: [1.7777777777777777], int: 4, computed: 1.7777777777777777, __INDEX__: [0]}
            ]);

            view.delete();
            table.delete();
        });
    });

    describe("Partial update with null", function() {
        it("Update over null should recalculate", async function() {
            const table = await perspective.table(pivot_data, {index: "int"});
            const view = await table.view({
                columns: ["computed", "int", "float"],
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "+",
                        inputs: ["int", "float"]
                    }
                ]
            });

            table.update([{int: 2, float: 3.5}]);

            let result = await view.to_columns();

            expect(result).toEqual({
                computed: [3.25, 5.5, 7.75, 9.25],
                int: [1, 2, 3, 4],
                float: [2.25, 3.5, 4.75, 5.25]
            });

            view.delete();
            table.delete();
        });

        it("Update with null should unset", async function() {
            const table = await perspective.table(pivot_data, {index: "int"});

            const view = await table.view({
                columns: ["computed", "int", "float"],
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "+",
                        inputs: ["int", "float"]
                    }
                ]
            });

            table.update([{int: 2, float: null}]);

            let result = await view.to_columns();

            expect(result).toEqual({
                computed: [3.25, null, 7.75, 9.25],
                int: [1, 2, 3, 4],
                float: [2.25, null, 4.75, 5.25]
            });

            view.delete();
            table.delete();
        });

        it("Undefined should be a no-op on computed columns", async function() {
            const table = await perspective.table(
                [
                    {int: 1, float: 2.25, string: "a", datetime: new Date()},
                    {int: 2, float: 3.5, string: "b", datetime: new Date()},
                    {int: 3, float: 4.75, string: "c", datetime: new Date()},
                    {int: 4, float: 5.25, string: "d", datetime: new Date()}
                ],
                {index: "int"}
            );
            const view = await table.view({
                columns: ["computed", "int", "float"],
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "+",
                        inputs: ["int", "float"]
                    }
                ]
            });

            table.update([{int: 2, float: undefined}]);

            let result = await view.to_columns();

            expect(result).toEqual({
                computed: [3.25, 5.5, 7.75, 9.25],
                int: [1, 2, 3, 4],
                float: [2.25, 3.5, 4.75, 5.25]
            });

            view.delete();
            table.delete();
        });
    });
};
