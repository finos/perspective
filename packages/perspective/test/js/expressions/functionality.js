/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const expressions_common = require("./common.js");

/**
 * Tests the functionality of `View`-based expressions, specifically that
 * existing column/view semantics (pivots, aggregates, columns, sorts, filters)
 * continue to be functional on expressions.
 */
module.exports = perspective => {
    describe("Functionality", function() {
        it("Should be able to create an expression column in `view()`", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();
            table.delete();
        });

        it("Should be able to create an expression column with scalars in `view()`", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ["1 + 2 + 3 + 4 + 5 + 6"]
            });
            const result = await view.to_columns();
            expect(result["1 + 2 + 3 + 4 + 5 + 6"]).toEqual([21, 21, 21, 21]);
            view.delete();
            table.delete();
        });

        it("Should be able to create a string expression column with scalars in `view()`", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                row_pivots: ["'abc'"], // check that the strings are interned
                expressions: ["'abc'"]
            });
            const result = await view.to_columns();
            expect(result["__ROW_PATH__"]).toEqual([[], ["abc"]]);
            expect(result["'abc'"]).toEqual([4, 4]);
            view.delete();
            table.delete();
        });

        it("Should be able to create a boolean expression column with scalars in `view()`", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ["0 and 1", "0 or 1"]
            });
            expect(await view.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "0 and 1": "float",
                "0 or 1": "float"
            });
            const result = await view.to_columns();
            expect(result["0 and 1"]).toEqual([0, 0, 0, 0]);
            expect(result["0 or 1"]).toEqual([1, 1, 1, 1]);
            view.delete();
            table.delete();
        });

        it("Should be able to create an expression column with scalars and columns `view()`", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                columns: ['("w" + "x") ^ 2'],
                expressions: ['("w" + "x") ^ 2']
            });
            const result = await view.to_columns();
            expect(result['("w" + "x") ^ 2']).toEqual([2.5, 4.5, 6.5, 8.5].map(x => Math.pow(x, 2)));
            view.delete();
            table.delete();
        });

        it("Should be able to create a boolean expression column with scalars and columns in `view()`", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"x" and 1', '"x" or 1']
            });
            expect(await view.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"x" and 1': "float",
                '"x" or 1': "float"
            });
            const result = await view.to_columns();
            expect(result['"x" and 1']).toEqual([1, 1, 1, 1]);
            expect(result['"x" or 1']).toEqual([1, 1, 1, 1]);
            view.delete();
            table.delete();
        });

        it("Should be able to create an expression column in `view()` from schema, and updates propagate", async function() {
            const table = await perspective.table({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean"
            });
            const view = await table.view({
                expressions: ['("w" + "x") * 10']
            });

            const result = await view.to_columns();
            expect(result).toEqual({});

            table.update(expressions_common.int_float_data);

            const new_result = await view.to_columns();
            expect(new_result['("w" + "x") * 10']).toEqual([25, 45, 65, 85]);

            table.update(expressions_common.int_float_data);

            const new_result2 = await view.to_columns();
            expect(new_result2['("w" + "x") * 10']).toEqual([25, 45, 65, 85, 25, 45, 65, 85]);

            view.delete();
            table.delete();
        });

        it("A new view should not reference expression columns it did not create.", async function(done) {
            expect.assertions(2);
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            table
                .view({
                    columns: ['"w" + "x"', "x"]
                })
                .catch(e => {
                    expect(e.message).toMatch(`Abort(): Invalid column '"w" + "x"' found in View columns.\n`);
                    view.delete();
                    table.delete();
                    done();
                });
        });

        it("A view should be able to shadow real columns with an expression column", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w"', '"x"', '"y"', '"z"']
            });
            expect(await view.expression_schema()).toEqual({
                '"w"': "float",
                '"x"': "integer",
                '"y"': "string",
                '"z"': "boolean"
            });
            expect(await view.to_json()).toEqual([
                {w: 1.5, x: 1, y: "a", z: true, '"w"': 1.5, '"x"': 1, '"y"': "a", '"z"': true},
                {w: 2.5, x: 2, y: "b", z: false, '"w"': 2.5, '"x"': 2, '"y"': "b", '"z"': false},
                {w: 3.5, x: 3, y: "c", z: true, '"w"': 3.5, '"x"': 3, '"y"': "c", '"z"': true},
                {w: 4.5, x: 4, y: "d", z: false, '"w"': 4.5, '"x"': 4, '"y"': "d", '"z"': false}
            ]);
            view.delete();
            table.delete();
        });

        it("Should be able to create multiple expression columns in `view()`", async function() {
            const table = await perspective.table(expressions_common.int_float_data);

            const view = await table.view({
                expressions: ['"w" + "x"', 'upper("y")']
            });

            expect(await view.expression_schema()).toEqual({
                '"w" + "x"': "float",
                'upper("y")': "string"
            });

            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(result['upper("y")']).toEqual(["A", "B", "C", "D"]);
            view.delete();
            table.delete();
        });

        it("Should be able to create multiple expression columns with unique names in multiple `view()`s", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"', '"w" - "x"', '"w" * "x"']
            });
            const view2 = await table.view({
                expressions: ['"w" / "x"', '"x" * "w"']
            });

            const schema = await view.schema();
            const schema2 = await view2.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float",
                '"w" * "x"': "float"
            });

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" / "x"': "float",
                '"x" * "w"': "float"
            });

            const result = await view.to_columns();
            const result2 = await view2.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5],
                '"w" - "x"': [0.5, 0.5, 0.5, 0.5],
                '"w" * "x"': [1.5, 5, 10.5, 18]
            });

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" / "x"': [1.5, 1.25, 1.1666666666666667, 1.125],
                '"x" * "w"': [1.5, 5, 10.5, 18]
            });

            view2.delete();
            view.delete();
            table.delete();
        });

        it("Should be able to create multiple expression columns in multiple `view()`s, and arbitarily delete views.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"']
            });
            const view2 = await table.view({
                expressions: ['"w" - "x"']
            });

            const schema = await view.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float"
            });
            const result = await view.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5]
            });

            view.delete();

            // force a process()
            expect(await table.size()).toEqual(4);

            const schema2 = await view2.schema();

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" - "x"': "float"
            });

            const result2 = await view2.to_columns();

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" - "x"': [0.5, 0.5, 0.5, 0.5]
            });

            view2.delete();
            table.delete();
        });

        it("Should be able to create multiple duplicate expression columns in multiple `view()`s, and delete preceding views without affecting later columns.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"']
            });

            const view2 = await table.view({
                expressions: ['"w" + "x"', '"w" - "x"']
            });

            const schema = await view.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float"
            });
            const result = await view.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5]
            });

            view.delete();

            const schema2 = await view2.schema();

            // force a process()
            expect(await table.size()).toEqual(4);

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float"
            });

            const result2 = await view2.to_columns();

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5],
                '"w" - "x"': [0.5, 0.5, 0.5, 0.5]
            });

            view2.delete();
            table.delete();
        });

        it("Multiple views inheriting the same expression columns with the same names should not conflict", async function() {
            const table = await perspective.table(expressions_common.int_float_data);

            const view = await table.view({
                expressions: ['"w" + "x"']
            });

            expect(await view.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float"
            });

            const view2 = await table.view({
                expressions: ['"w" + "x"', '"w" - "x"']
            });

            expect(await view2.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float"
            });

            const view3 = await table.view({
                expressions: ['"w" + "x"', '"w" - "x"', '("w" - "x") + "x"']
            });

            expect(await view3.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float",
                '("w" - "x") + "x"': "float"
            });

            const result = await view3.to_columns();
            expect(result['("w" - "x") + "x"']).toEqual(result["w"]);

            view3.delete();
            view2.delete();
            view.delete();
            table.delete();
        });

        it("A view should be able to create an expression column with the same name as another deleted view's expression columns.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"']
            });

            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();

            const view2 = await table.view({
                expressions: ['"w" - "x"']
            });

            const result2 = await view2.to_columns();
            expect(result2['"w" - "x"']).toEqual([0.5, 0.5, 0.5, 0.5]);

            view2.delete();
            table.delete();
        });

        it("A view without expression columns should not serialize expression columns from other views.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"']
            });

            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();

            const view2 = await table.view();

            const result2 = await view2.to_json();
            expect(result2).toEqual(expressions_common.int_float_data);

            view2.delete();
            table.delete();
        });

        it("When expression columns are repeated between views, column indices should grow linearly.", async function() {
            let expressions = ['"w" + "x"', '"w" - "x"', '"w" * "x"', '"w" / "x"'];
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({expressions: [expressions[0]]});
            const view2 = await table.view({expressions: [expressions[0], expressions[1]]});
            const view3 = await table.view({expressions: [expressions[0], expressions[1], expressions[2]]});
            const view4 = await table.view({expressions: expressions});

            const schema = await view.schema();
            const schema2 = await view2.schema();
            const schema3 = await view3.schema();
            const schema4 = await view4.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float"
            });

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float"
            });

            expect(schema3).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float",
                '"w" * "x"': "float"
            });

            expect(schema4).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float",
                '"w" * "x"': "float",
                '"w" / "x"': "float"
            });

            view4.delete();
            view3.delete();
            view2.delete();
            view.delete();
            table.delete();
        });

        it("Should be able to create duplicate expressions in multiple views, and updates should propagate to both", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"']
            });
            const view2 = await table.view({
                expressions: ['"w" + "x"']
            });

            const schema = await view.schema();
            const schema2 = await view2.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float"
            });

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float"
            });

            const result = await view.to_columns();
            const result2 = await view2.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5]
            });

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5]
            });

            table.update({
                w: [5, 6, 7, 8],
                x: [1, 2, 3, 4]
            });

            expect(await view.to_columns()).toEqual({
                w: [1.5, 2.5, 3.5, 4.5, 5, 6, 7, 8],
                x: [1, 2, 3, 4, 1, 2, 3, 4],
                y: ["a", "b", "c", "d", null, null, null, null],
                z: [true, false, true, false, null, null, null, null],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5, 6, 8, 10, 12]
            });

            expect(await view2.to_columns()).toEqual({
                w: [1.5, 2.5, 3.5, 4.5, 5, 6, 7, 8],
                x: [1, 2, 3, 4, 1, 2, 3, 4],
                y: ["a", "b", "c", "d", null, null, null, null],
                z: [true, false, true, false, null, null, null, null],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5, 6, 8, 10, 12]
            });

            view2.delete();
            view.delete();
            table.delete();
        });

        it("A new view should not inherit expression columns if not created.", async function() {
            expect.assertions(2);
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);

            try {
                await table.view({
                    columns: ['"w" + "x"', "x"]
                });
            } catch (e) {
                expect(e.message).toEqual(`Abort(): Invalid column '"w" + "x"' found in View columns.\n`);
            }

            view.delete();
            table.delete();
        });

        it("The view's underlying table should not have a mutated schema.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(await table.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean"
            });
            view.delete();
            table.delete();
        });

        it("Should be able to show an expression column.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                columns: ['"w" + "x"'],
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();
            table.delete();
        });

        it("Should be able to hide an expression column.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                columns: ["x"],
                expressions: ['"w" + "x"']
            });
            expect(await view.schema()).toEqual({
                x: "integer"
            });
            expect(await view.expression_schema()).toEqual({
                '"w" + "x"': "float"
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual(undefined);
            expect(result["x"]).toEqual([1, 2, 3, 4]);
            view.delete();
            table.delete();
        });

        it("Should be able to row pivot on a non-expression column and get correct results for the expression column.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                row_pivots: ["w"],
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [1.5], [2.5], [3.5], [4.5]],
                '"w" + "x"': [22, 2.5, 4.5, 6.5, 8.5],
                w: [12, 1.5, 2.5, 3.5, 4.5],
                x: [10, 1, 2, 3, 4],
                y: [4, 1, 1, 1, 1],
                z: [4, 1, 1, 1, 1]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to row pivot on an expression column.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                row_pivots: ['"w" + "x"'],
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                '"w" + "x"': [22, 2.5, 4.5, 6.5, 8.5],
                w: [12, 1.5, 2.5, 3.5, 4.5],
                x: [10, 1, 2, 3, 4],
                y: [4, 1, 1, 1, 1],
                z: [4, 1, 1, 1, 1]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to column pivot on an expression column.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                column_pivots: ['"w" + "x"'],
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                "2.5|w": [1.5, null, null, null],
                "2.5|x": [1, null, null, null],
                "2.5|y": ["a", null, null, null],
                "2.5|z": [true, null, null, null],
                '2.5|"w" + "x"': [2.5, null, null, null],
                "4.5|w": [null, 2.5, null, null],
                "4.5|x": [null, 2, null, null],
                "4.5|y": [null, "b", null, null],
                "4.5|z": [null, false, null, null],
                '4.5|"w" + "x"': [null, 4.5, null, null],
                "6.5|w": [null, null, 3.5, null],
                "6.5|x": [null, null, 3, null],
                "6.5|y": [null, null, "c", null],
                "6.5|z": [null, null, true, null],
                '6.5|"w" + "x"': [null, null, 6.5, null],
                "8.5|w": [null, null, null, 4.5],
                "8.5|x": [null, null, null, 4],
                "8.5|y": [null, null, null, "d"],
                "8.5|z": [null, null, null, false],
                '8.5|"w" + "x"': [null, null, null, 8.5]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to row + column pivot on an expression column.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                row_pivots: ['"w" + "x"'],
                column_pivots: ['"w" + "x"'],
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                "2.5|w": [1.5, 1.5, null, null, null],
                "2.5|x": [1, 1, null, null, null],
                "2.5|y": [1, 1, null, null, null],
                "2.5|z": [1, 1, null, null, null],
                '2.5|"w" + "x"': [2.5, 2.5, null, null, null],
                "4.5|w": [2.5, null, 2.5, null, null],
                "4.5|x": [2, null, 2, null, null],
                "4.5|y": [1, null, 1, null, null],
                "4.5|z": [1, null, 1, null, null],
                '4.5|"w" + "x"': [4.5, null, 4.5, null, null],
                "6.5|w": [3.5, null, null, 3.5, null],
                "6.5|x": [3, null, null, 3, null],
                "6.5|y": [1, null, null, 1, null],
                "6.5|z": [1, null, null, 1, null],
                '6.5|"w" + "x"': [6.5, null, null, 6.5, null],
                "8.5|w": [4.5, null, null, null, 4.5],
                "8.5|x": [4, null, null, null, 4],
                "8.5|y": [1, null, null, null, 1],
                "8.5|z": [1, null, null, null, 1],
                '8.5|"w" + "x"': [8.5, null, null, null, 8.5]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a numeric expression column.", async function() {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: [100, 200, 300, 400],
                z: [1.5, 2.5, 3.5, 4.5]
            });
            const view = await table.view({
                row_pivots: ['"x" + "z"'],
                aggregates: {
                    '"x" + "z"': "median",
                    x: "median"
                },
                expressions: ['"x" + "z"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                '"x" + "z"': [6.5, 2.5, 4.5, 6.5, 8.5],
                x: [3, 1, 2, 3, 4],
                y: [1000, 100, 200, 300, 400],
                z: [12, 1.5, 2.5, 3.5, 4.5]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a numeric expression column that aliases a real column.", async function() {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: [100, 200, 300, 400],
                z: [1.5, 2.5, 3.5, 4.5]
            });
            const view = await table.view({
                row_pivots: ['"x"'],
                aggregates: {
                    '"x"': "median",
                    x: "median"
                },
                expressions: ['"x"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [1], [2], [3], [4]],
                '"x"': [3, 1, 2, 3, 4],
                x: [3, 1, 2, 3, 4],
                y: [1000, 100, 200, 300, 400],
                z: [12, 1.5, 2.5, 3.5, 4.5]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a string expression column.", async function() {
            const table = await perspective.table({
                x: ["a", "a", "c", "a"],
                y: ["w", "w", "y", "w"]
            });
            const view = await table.view({
                row_pivots: ['upper("x")'],
                aggregates: {
                    'upper("x")': "distinct count"
                },
                expressions: ['upper("x")']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], ["A"], ["C"]],
                'upper("x")': [2, 1, 1],
                x: [4, 3, 1],
                y: [4, 3, 1]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a date expression column.", async function() {
            const table = await perspective.table({
                x: [new Date(2019, 0, 15), new Date(2019, 0, 30), new Date(2019, 1, 15)]
            });
            const view = await table.view({
                row_pivots: [`date_bucket("x", 'M')`],
                aggregates: {
                    "date_bucket(\"x\", 'M')": "distinct count"
                },
                expressions: [`date_bucket("x", 'M')`]
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [1546300800000], [1548979200000]],
                "date_bucket(\"x\", 'M')": [2, 1, 1],
                x: [3, 2, 1]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to weighted mean on an expression column.", async function() {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: [100, 200, 300, 400],
                z: [1.5, 2.5, 3.5, 4.5]
            });
            const view = await table.view({
                row_pivots: ['"x" + "z"'],
                aggregates: {
                    x: ["weighted mean", '"x" + "z"'],
                    '"x" + "z"': ["weighted mean", "y"]
                },
                expressions: ['"x" + "z"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                '"x" + "z"': [6.5, 2.5, 4.5, 6.5, 8.5],
                x: [2.9545454545454546, 1, 2, 3, 4],
                y: [1000, 100, 200, 300, 400],
                z: [12, 1.5, 2.5, 3.5, 4.5]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to filter on an expression column.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                filter: [['"w" + "x"', ">", 6.5]],
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                '"w" + "x"': [8.5],
                w: [4.5],
                x: [4],
                y: ["d"],
                z: [false]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to sort on an expression column.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                sort: [['"w" + "x"', "desc"]],
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                '"w" + "x"': [8.5, 6.5, 4.5, 2.5],
                w: [4.5, 3.5, 2.5, 1.5],
                x: [4, 3, 2, 1],
                y: ["d", "c", "b", "a"],
                z: [false, true, false, true]
            });
            view.delete();
            table.delete();
        });

        it("Should be able to sort on a hidden expression column.", async function() {
            const table = await perspective.table(expressions_common.int_float_data);
            const view = await table.view({
                columns: ["w"],
                sort: [['"w" + "x"', "desc"]],
                expressions: ['"w" + "x"']
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                w: [4.5, 3.5, 2.5, 1.5]
            });
            view.delete();
            table.delete();
        });

        describe("Validation using table expression schema", function() {
            it("Should show correct expression column types in table expression schema.", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const expressions = ['"a" ^ 2', "sqrt(144)", "0 and 1", "0 or 1", '-"a"', 'upper("c")', `date_bucket("b", 'M')`, `date_bucket("b", 's')`];
                const schema = await table.expression_schema(expressions);
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "float",
                    "0 or 1": "float",
                    'upper("c")': "string",
                    "date_bucket(\"b\", 'M')": "date",
                    "date_bucket(\"b\", 's')": "datetime"
                });
                table.delete();
            });

            it("Should skip invalid columns due to type error", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5]
                });
                const expressions = [
                    '"a" + "d"', // valid
                    '"c" + "b"', // invalid
                    '"c"', // valid
                    "date_bucket(\"b\", 'M')", // valid
                    "date_bucket(\"b\", 'abcde')", // invalid
                    'upper("c")', // valid
                    'lower("a")' // invalid
                ];
                const schema = await table.expression_schema(expressions);
                expect(schema).toEqual({
                    '"a" + "d"': "float",
                    '"c"': "string",
                    "date_bucket(\"b\", 'M')": "date",
                    'upper("c")': "string"
                });
                table.delete();
            });

            it("Should skip a invalid column due to invalid column name", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5]
                });
                const expressions = [
                    '"a" + "d"', // valid
                    '"abxbasd" + "sdfadsf"', // invalid
                    '"c"', // valid
                    "date_bucket(\"b\", 'M')", // valid
                    "date_bucket(\"basdsa\", 'Y')", // invalid
                    'upper("c")', // valid
                    'lower("sdfadsj")' // invalid
                ];
                const schema = await table.expression_schema(expressions);
                expect(schema).toEqual({
                    '"a" + "d"': "float",
                    '"c"': "string",
                    "date_bucket(\"b\", 'M')": "date",
                    'upper("c")': "string"
                });
                table.delete();
            });

            it("Should skip a invalid column due to parse error", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5]
                });
                const expressions = [
                    '"a" + "d"', // valid
                    "{", // invalid
                    "if (\"c\" == 'a') 123; else 0;", // valid
                    "if (" // invalid
                ];
                const schema = await table.expression_schema(expressions);
                expect(schema).toEqual({
                    '"a" + "d"': "float",
                    "if (\"c\" == 'a') 123; else 0;": "float"
                });
                table.delete();
            });
        });

        describe("View expression schema", function() {
            it("Column types in view schema on 0-sided view.", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = await table.view({
                    expressions: ['"a" ^ 2', "sqrt(144)", "0 and 1", "0 or 1", '-"a"', 'upper("c")', `date_bucket("b", 'M')`, `date_bucket("b", 's')`]
                });
                const schema = await view.schema();
                expect(schema).toEqual({
                    a: "integer",
                    b: "datetime",
                    c: "string",
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "float",
                    "0 or 1": "float",
                    'upper("c")': "string",
                    "date_bucket(\"b\", 'M')": "date",
                    "date_bucket(\"b\", 's')": "datetime"
                });
                view.delete();
                table.delete();
            });

            it("Column types in view expression schema on 0-sided view.", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = await table.view({
                    expressions: ['"a" ^ 2', "sqrt(144)", "0 and 1", "0 or 1", '-"a"', 'upper("c")', `date_bucket("b", 'M')`, `date_bucket("b", 's')`]
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "float",
                    "0 or 1": "float",
                    'upper("c")': "string",
                    "date_bucket(\"b\", 'M')": "date",
                    "date_bucket(\"b\", 's')": "datetime"
                });
                view.delete();
                table.delete();
            });

            it("Should show ALL columns in view expression schema regardless of custom columns.", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = await table.view({
                    columns: ["a"],
                    expressions: ['"a" ^ 2', "sqrt(144)", "0 and 1", "0 or 1", '-"a"', 'upper("c")', `date_bucket("b", 'M')`, `date_bucket("b", 's')`]
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "float",
                    "0 or 1": "float",
                    'upper("c")': "string",
                    "date_bucket(\"b\", 'M')": "date",
                    "date_bucket(\"b\", 's')": "datetime"
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view expression schema on 1-sided view.", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = await table.view({
                    row_pivots: ["c"],
                    expressions: ['"a" ^ 2', "sqrt(144)", "0 and 1", "0 or 1", '-"a"', 'upper("c")', `date_bucket("b", 'M')`, `date_bucket("b", 's')`]
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "float",
                    "0 or 1": "float",
                    'upper("c")': "integer",
                    "date_bucket(\"b\", 'M')": "integer",
                    "date_bucket(\"b\", 's')": "integer"
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view expression schema on 1-sided view with custom aggregates.", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = await table.view({
                    row_pivots: ["c"],
                    aggregates: {
                        "0 and 1": "any",
                        "0 or 1": "any",
                        "date_bucket(\"b\", 's')": "last"
                    },
                    expressions: ['"a" ^ 2', "sqrt(144)", "0 and 1", "0 or 1", '-"a"', 'upper("c")', `date_bucket("b", 'M')`, `date_bucket("b", 's')`]
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "float",
                    "0 or 1": "float",
                    'upper("c")': "integer",
                    "date_bucket(\"b\", 'M')": "integer",
                    "date_bucket(\"b\", 's')": "datetime"
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view expression schema on 2-sided view.", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = await table.view({
                    row_pivots: ["c"],
                    column_pivots: ["a"],
                    expressions: ['"a" ^ 2', "sqrt(144)", "0 and 1", "0 or 1", '-"a"', 'upper("c")', `date_bucket("b", 'M')`, `date_bucket("b", 's')`]
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "float",
                    "0 or 1": "float",
                    'upper("c")': "integer",
                    "date_bucket(\"b\", 'M')": "integer",
                    "date_bucket(\"b\", 's')": "integer"
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view expression schema on 2-sided column-only view.", async function() {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"]
                });
                const view = await table.view({
                    row_pivots: ["c"],
                    column_pivots: ["a"],
                    aggregates: {
                        "0 and 1": "any",
                        "0 or 1": "any",
                        "date_bucket(\"b\", 's')": "last"
                    },
                    expressions: ['"a" ^ 2', "sqrt(144)", "0 and 1", "0 or 1", '-"a"', 'upper("c")', `date_bucket("b", 'M')`, `date_bucket("b", 's')`]
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "float",
                    "0 or 1": "float",
                    'upper("c")': "integer",
                    "date_bucket(\"b\", 'M')": "integer",
                    "date_bucket(\"b\", 's')": "datetime"
                });
                view.delete();
                table.delete();
            });
        });
    });
};
