/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const common = require("./common.js");

module.exports = perspective => {
    describe.skip("Parsed expressions", function() {
        it("Should be able to create a computed column in `view()` using an expression", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: []
            });
            const result = await view.to_columns();
            expect(result["(w + x)"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();
            table.delete();
        });

        it("Should be able to create a computed column in `view()` using an expression with 'AS'", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['"w" + "x" as "custom column name"']
            });
            const result = await view.to_columns();
            expect(result["custom column name"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();
            table.delete();
        });

        it("Should be able to create recursive computed columns in `view()` using parentheses", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['"w" / (("w" + "x") * ("w" - "x"))']
            });
            const columns = await view.column_paths();
            expect(columns.includes("(w / ((w + x) * (w - x)))")).toBeTruthy();
            expect(columns.includes("((w + x) * (w - x))")).toBeTruthy();
            expect(columns.includes("(w + x)")).toBeTruthy();
            expect(columns.includes("(w - x)")).toBeTruthy();

            const result = await view.to_columns();

            expect(result["(w + x)"]).toEqual(result.w.map((item, idx) => item + result.x[idx]));
            expect(result["(w - x)"]).toEqual(result.w.map((item, idx) => item - result.x[idx]));
            let expected_final = [];
            for (let i = 0; i < result.w.length; i++) {
                const w = result.w[i];
                const x = result.x[i];
                expected_final.push(w / ((w + x) * (w - x)));
            }
            expect(result["(w / ((w + x) * (w - x)))"]).toEqual(expected_final);

            view.delete();
            table.delete();
        });

        it("Should be able to create recursive computed columns in `view()` using parentheses and 'AS'", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['"w" / (("w" + ("x" + "w" as "sub0") AS "sub1") * ("w" - "x" As "sub2") as "sub3") as "final"']
            });

            const columns = await view.column_paths();
            expect(columns.includes("final")).toBeTruthy();
            expect(columns.includes("sub0")).toBeTruthy();
            expect(columns.includes("sub1")).toBeTruthy();
            expect(columns.includes("sub2")).toBeTruthy();
            expect(columns.includes("sub3")).toBeTruthy();

            const result = await view.to_columns();
            expect(result["sub0"]).toEqual(result.w.map((item, idx) => item + result.x[idx]));

            let expected_sub1 = [];
            for (let i = 0; i < result.w.length; i++) {
                const w = result.w[i];
                const x = result.x[i];
                expected_sub1.push(w + (w + x));
            }

            expect(result["sub1"]).toEqual(expected_sub1);
            expect(result["sub2"]).toEqual(result.w.map((item, idx) => item - result.x[idx]));

            let expected_sub3 = [];
            for (let i = 0; i < result.w.length; i++) {
                const w = result.w[i];
                const x = result.x[i];
                expected_sub3.push((w + (w + x)) * (w - x));
            }
            expect(result["sub3"]).toEqual(expected_sub3);

            let expected_final = [];
            for (let i = 0; i < result.w.length; i++) {
                const w = result.w[i];
                const x = result.x[i];
                expected_final.push(w / ((w + (w + x)) * (w - x)));
            }
            expect(result["final"]).toEqual(expected_final);

            view.delete();
            table.delete();
        });

        it("Should be able to create a computed column in `view()` using a functional operator", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['sqrt("x")']
            });
            const result = await view.to_columns();
            expect(result["sqrt(x)"]).toEqual(result.x.map(x => Math.sqrt(x)));
            view.delete();
            table.delete();
        });

        it("Should be able to create a computed column in `view()` using a functional operator and 'AS'", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['sqrt("x") as "custom column"']
            });
            const result = await view.to_columns();
            expect(result["custom column"]).toEqual(result.x.map(x => Math.sqrt(x)));
            view.delete();
            table.delete();
        });

        it("Should be able to create recursive computed columns in `view()` with functional operators", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['sqrt((pow2("x")))']
            });
            const result = await view.to_columns();
            expect(result["sqrt((x ^ 2))"]).toEqual(result.x.map(x => Math.sqrt(Math.pow(x, 2))));
            view.delete();
            table.delete();
        });

        it("Should be able to create recursive computed columns in `view()` functional operators and 'AS'", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['pow2(("x" * ("w" + "x" as "first") as "second")) as "final"']
            });

            const paths = await view.column_paths();
            expect(paths.includes("first")).toEqual(true);
            expect(paths.includes("second")).toEqual(true);
            expect(paths.includes("final")).toEqual(true);

            const result = await view.to_columns();
            expect(result.first).toEqual(result.w.map((item, idx) => item + result.x[idx]));
            expect(result.second).toEqual(result.w.map((item, idx) => result.x[idx] * (item + result.x[idx])));
            expect(result.final).toEqual(result.w.map((item, idx) => Math.pow(result.x[idx] * (item + result.x[idx]), 2)));

            view.delete();
            table.delete();
        });

        it("Should be able to create recursive computed columns in `view()` with functions and operators", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['(sqrt(("x" + "w"))) * (pow2(("w" / "x")))']
            });

            const paths = await view.column_paths();
            expect(paths.includes("(x + w)")).toEqual(true);
            expect(paths.includes("sqrt((x + w))")).toEqual(true);
            expect(paths.includes("(w / x)")).toEqual(true);
            expect(paths.includes("((w / x) ^ 2)")).toEqual(true);
            expect(paths.includes("(sqrt((x + w)) * ((w / x) ^ 2))")).toEqual(true);

            const result = await view.to_columns();
            expect(result["(x + w)"]).toEqual(result.x.map((item, idx) => item + result.w[idx]));
            expect(result["sqrt((x + w))"]).toEqual(result.x.map((item, idx) => Math.sqrt(item + result.w[idx])));
            expect(result["(w / x)"]).toEqual(result.w.map((item, idx) => item / result.x[idx]));
            expect(result["((w / x) ^ 2)"]).toEqual(result.w.map((item, idx) => Math.pow(item / result.x[idx], 2)));

            let expected_final = [];
            for (let i = 0; i < result.x.length; i++) {
                const x = result.x[i];
                const w = result.w[i];
                expected_final.push(Math.sqrt(x + w) * Math.pow(w / x, 2));
            }

            expect(result["(sqrt((x + w)) * ((w / x) ^ 2))"]).toEqual(expected_final);

            view.delete();
            table.delete();
        });

        it("Should be able to create recursive computed columns in `view()` functions, operators and 'AS'", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['(sqrt(("x" + "w" as "first")) as "second") * (pow2(("w" / "x" as "third")) as "fourth") as "final"']
            });

            const paths = await view.column_paths();
            expect(paths.includes("first")).toEqual(true);
            expect(paths.includes("second")).toEqual(true);
            expect(paths.includes("third")).toEqual(true);
            expect(paths.includes("fourth")).toEqual(true);
            expect(paths.includes("final")).toEqual(true);

            const result = await view.to_columns();
            expect(result["first"]).toEqual(result.x.map((item, idx) => item + result.w[idx]));
            expect(result["second"]).toEqual(result.x.map((item, idx) => Math.sqrt(item + result.w[idx])));
            expect(result["third"]).toEqual(result.w.map((item, idx) => item / result.x[idx]));
            expect(result["fourth"]).toEqual(result.w.map((item, idx) => Math.pow(item / result.x[idx], 2)));

            let expected_final = [];
            for (let i = 0; i < result.x.length; i++) {
                const x = result.x[i];
                const w = result.w[i];
                expected_final.push(Math.sqrt(x + w) * Math.pow(w / x, 2));
            }

            expect(result["final"]).toEqual(expected_final);

            view.delete();
            table.delete();
        });

        it("Should be able to create a expression computed column in `view()` from schema, and updates propagate", async function() {
            const table = perspective.table({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean"
            });
            const view = table.view({
                computed_columns: ['"w" + "x" as "int + float"']
            });

            const result = await view.to_columns();
            expect(result).toEqual({});

            table.update(common.int_float_data);

            const new_result = await view.to_columns();
            expect(new_result["int + float"]).toEqual([2.5, 4.5, 6.5, 8.5]);

            view.delete();
            table.delete();
        });

        it("Should be able to create multiple computed columns in `view()`", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['"w" + "x" as "int + float"', 'uppercase("y") as "uppercase"']
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
                computed_columns: ['"w" + "x" as "float + int"']
            });
            const view2 = table.view({
                computed_columns: ['"w" - "x" as "float - int"']
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

        it("Should be able to create multiple expression computed columns in multiple `view()`s, and arbitarily delete views.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['"w" + "x" as "float + int"']
            });
            const view2 = table.view({
                computed_columns: ['"w" - "x" as "float - int"']
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

        it("A view should be able to create a computed column with the same name as another deleted view's computed columns.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['"w" + "x" as "int + float"']
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

        it("When computed columns are repeated between views, column indices should grow linearly.", async function() {
            let computed = ['"w" + "x" as "float + int"', '"w" - "x" as "float - int"', '"w" * "x" as "float * int"', '"w" / "x" as "float / int"'];
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

        it("Should be able to create multiple computed column in multiple `view()`s with the same name", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                computed_columns: ['"w" + "x" as "float + int"']
            });
            const view2 = table.view({
                computed_columns: ['"w" - "x" as "float - int"']
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
                computed_columns: ['"w" + "x" as "int + float"']
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
                computed_columns: ['"w" + "x" as "int + float"']
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

        it("Should not be able to overwrite an existing 'real' column.", async function() {
            const table = perspective.table(common.int_float_data);
            expect(() =>
                table.view({
                    computed_columns: ['"w" + "x" as "w"']
                })
            ).toThrow();
            table.delete();
        });

        it("Should be able to show a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                columns: ["int + float"],
                computed_columns: ['"w" + "x" as "int + float"']
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
                computed_columns: ['"w" + "x" as "int + float"']
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

        it("Should be able to row pivot on a computed column.", async function() {
            const table = perspective.table(common.int_float_data);
            const view = table.view({
                row_pivots: ["int + float"],
                computed_columns: ['"w" + "x" as "int + float"']
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
                computed_columns: ['"w" + "x" as "int + float"']
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
                computed_columns: ['"w" + "x" as "int + float"']
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
                computed_columns: ['"x" + "z" as "comp"']
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
                computed_columns: ['concat_comma("x", "y") as "comp"']
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
                computed_columns: ['month_bucket("x") as "comp"']
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
                computed_columns: ['"x" + "z" as "comp"']
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
                computed_columns: ['"w" + "x" as "int + float"']
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
                computed_columns: ['"w" + "x" as "int + float"']
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
                computed_columns: ['"x" + "w" as "int + float"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                w: [4.5, 3.5, 2.5, 1.5]
            });
            view.delete();
            table.delete();
        });
    });
};
