/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

var data = [{x: 1, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];

var meta = {
    x: "integer",
    y: "string",
    z: "boolean"
};

var data2 = [{x: 1, y: 1, z: true}, {x: 2, y: 1, z: false}, {x: 3, y: 2, z: true}, {x: 4, y: 2, z: false}];

var data_7 = {
    w: [1.5, 2.5, 3.5, 4.5],
    x: [1, 2, 3, 4],
    y: ["a", "b", "c", "d"],
    z: [true, false, true, false]
};

module.exports = perspective => {
    describe("Aggregate", function() {
        it("['z'], sum", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["z"],
                aggregate: [{op: "sum", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 10}, {__ROW_PATH__: [false], x: 6}, {__ROW_PATH__: [true], x: 4}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("['z'], sum with new column syntax", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["z"],
                aggregate: [{op: "sum", column: ["x"]}]
            });
            var answer = [{__ROW_PATH__: [], x: 10}, {__ROW_PATH__: [false], x: 6}, {__ROW_PATH__: [true], x: 4}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("['z'], weighted_mean", async function() {
            var table = perspective.table(data2);
            var view = table.view({
                row_pivot: ["z"],
                aggregate: [{op: "mean", column: ["x"]}, {op: "weighted mean", column: ["x", "y"]}]
            });
            var answer = [{__ROW_PATH__: [], x: 2.5, "x|y": 2.8333333333333335}, {__ROW_PATH__: [false], x: 3, "x|y": 3.3333333333333335}, {__ROW_PATH__: [true], x: 2, "x|y": 2.3333333333333335}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("['z'], mean", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["z"],
                aggregate: [{op: "mean", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 2.5}, {__ROW_PATH__: [false], x: 3}, {__ROW_PATH__: [true], x: 2}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("['z'], first by index", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["z"],
                aggregate: [{op: "first by index", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 1}, {__ROW_PATH__: [false], x: 2}, {__ROW_PATH__: [true], x: 1}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("['z'], last by index", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["z"],
                aggregate: [{op: "last by index", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 4}, {__ROW_PATH__: [false], x: 4}, {__ROW_PATH__: [true], x: 3}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("['z'], last", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["z"],
                aggregate: [{op: "last", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 3}, {__ROW_PATH__: [false], x: 4}, {__ROW_PATH__: [true], x: 3}];
            let result = await view.to_json();
            expect(answer).toEqual(result);

            table.update([{x: 1, y: "c", z: true}, {x: 2, y: "d", z: false}]);
            var answerAfterUpdate = [{__ROW_PATH__: [], x: 1}, {__ROW_PATH__: [false], x: 2}, {__ROW_PATH__: [true], x: 1}];
            let result2 = await view.to_json();
            expect(answerAfterUpdate).toEqual(result2);
        });
    });

    describe("Aggregates with nulls", function() {
        it("mean", async function() {
            var table = perspective.table([{x: 3, y: 1}, {x: 2, y: 1}, {x: null, y: 1}, {x: null, y: 1}, {x: 4, y: 2}, {x: null, y: 2}]);
            var view = table.view({
                row_pivot: ["y"],
                aggregate: [{op: "mean", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 3}, {__ROW_PATH__: [1], x: 2.5}, {__ROW_PATH__: [2], x: 4}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("mean with 0", async function() {
            var table = perspective.table([{x: 3, y: 1}, {x: 3, y: 1}, {x: 0, y: 1}, {x: null, y: 1}, {x: null, y: 1}, {x: 4, y: 2}, {x: null, y: 2}]);
            var view = table.view({
                row_pivot: ["y"],
                aggregate: [{op: "mean", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 2.5}, {__ROW_PATH__: [1], x: 2}, {__ROW_PATH__: [2], x: 4}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("mean with 0.0 (floats)", async function() {
            var table = perspective.table({x: "float", y: "integer"});
            table.update([{x: 3, y: 1}, {x: 3, y: 1}, {x: 0, y: 1}, {x: null, y: 1}, {x: null, y: 1}, {x: 4, y: 2}, {x: null, y: 2}]);
            var view = table.view({
                row_pivot: ["y"],
                aggregate: [{op: "mean", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 2.5}, {__ROW_PATH__: [1], x: 2}, {__ROW_PATH__: [2], x: 4}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("sum", async function() {
            var table = perspective.table([{x: 3, y: 1}, {x: 2, y: 1}, {x: null, y: 1}, {x: null, y: 1}, {x: 4, y: 2}, {x: null, y: 2}]);
            var view = table.view({
                row_pivot: ["y"],
                aggregate: [{op: "sum", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 9}, {__ROW_PATH__: [1], x: 5}, {__ROW_PATH__: [2], x: 4}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("mean after update", async function() {
            var table = perspective.table([{x: 3, y: 1}, {x: null, y: 1}, {x: null, y: 2}]);
            table.update([{x: 2, y: 1}, {x: null, y: 1}, {x: 4, y: 2}]);
            var view = table.view({
                row_pivot: ["y"],
                aggregate: [{op: "mean", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 3}, {__ROW_PATH__: [1], x: 2.5}, {__ROW_PATH__: [2], x: 4}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("mean at aggregate level", async function() {
            var table = perspective.table([{x: 4, y: 1, z: "a"}, {x: null, y: 1, z: "a"}, {x: null, y: 2, z: "a"}]);
            table.update([{x: 1, y: 1, z: "b"}, {x: 1, y: 1, z: "b"}, {x: null, y: 1, z: "b"}, {x: 4, y: 2, z: "b"}, {x: null, y: 2, z: "b"}]);
            table.update([{x: 2, y: 2, z: "c"}, {x: 3, y: 2, z: "c"}, {x: null, y: 2, z: "c"}, {x: 7, y: 2, z: "c"}]);
            var view = table.view({
                row_pivot: ["y", "z"],
                aggregate: [{op: "mean", column: "x"}]
            });
            var answer = [
                {__ROW_PATH__: [], x: 3.142857142857143},
                {__ROW_PATH__: [1], x: 2},
                {__ROW_PATH__: [1, "a"], x: 4},
                {__ROW_PATH__: [1, "b"], x: 1},
                {__ROW_PATH__: [2], x: 4},
                {__ROW_PATH__: [2, "a"], x: null},
                {__ROW_PATH__: [2, "b"], x: 4},
                {__ROW_PATH__: [2, "c"], x: 4}
            ];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });

        it("null_in_pivot_column", async function() {
            var table = perspective.table([{x: null}, {x: "x"}, {x: "y"}]);
            var view = table.view({
                row_pivot: ["x"],
                aggregate: [{op: "distinct count", column: "x"}]
            });
            var answer = [{__ROW_PATH__: [], x: 3}, {__ROW_PATH__: ["x"], x: 1}, {__ROW_PATH__: ["y"], x: 1}, {__ROW_PATH__: [null], x: 1}];
            let result = await view.to_json();
            expect(result).toEqual(answer);
        });

        it("weighted mean", async function() {
            var table = perspective.table([{a: "a", x: 1, y: 200}, {a: "a", x: 2, y: 100}, {a: "a", x: 3, y: null}]);
            var view = table.view({
                row_pivot: ["a"],
                aggregate: [{op: "weighted mean", column: ["y", "x"], name: "y"}]
            });
            var answer = [{__ROW_PATH__: [], y: (1 * 200 + 2 * 100) / (1 + 2)}, {__ROW_PATH__: ["a"], y: (1 * 200 + 2 * 100) / (1 + 2)}];
            let result = await view.to_json();
            expect(answer).toEqual(result);
        });
    });

    describe("Row pivot", function() {
        it("['x']", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["x"]
            });
            var answer = [
                {__ROW_PATH__: [], x: 10, y: 4, z: 2},
                {__ROW_PATH__: [1], x: 1, y: 1, z: 1},
                {__ROW_PATH__: [2], x: 2, y: 1, z: 1},
                {__ROW_PATH__: [3], x: 3, y: 1, z: 1},
                {__ROW_PATH__: [4], x: 4, y: 1, z: 1}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
        });

        it("['x'] test update pkey column", async function() {
            const schema = {
                id: "integer",
                name: "string",
                chg: "float",
                pos: "integer"
            };
            const rec1 = [{id: 1, name: "John", pos: 100, chg: 1}, {id: 2, name: "Mary", pos: 200, chg: 2}, {id: 3, name: "Tom", pos: 300, chg: 3}];
            const table = perspective.table(schema, {index: "id"});
            table.update(rec1);
            let view = table.view({
                row_pivot: ["id"],
                aggregate: [{op: "sum", column: "pos"}]
            });
            let rec2 = [{id: 1, chg: 3}];
            table.update(rec2);
            let result2 = await view.to_json();
            var answer = [{__ROW_PATH__: [], pos: 600}, {__ROW_PATH__: [1], pos: 100}, {__ROW_PATH__: [2], pos: 200}, {__ROW_PATH__: [3], pos: 300}];
            expect(answer).toEqual(result2);
        });

        it("['x'] has a schema", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["x"]
            });
            let result2 = await view.schema();
            expect(result2).toEqual(meta);
        });

        it("['x'] translates type `string` to `integer` when pivoted by row", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["x"],
                aggregate: [{column: "y", op: "distinct count"}]
            });
            let result2 = await view.schema();
            expect(result2).toEqual({y: "integer"});
        });

        it("['x'] translates type `integer` to `float` when pivoted by row", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["y"],
                aggregate: [{column: "x", op: "avg"}]
            });
            let result2 = await view.schema();
            expect(result2).toEqual({x: "float"});
        });

        it("['x'] does not translate type when only pivoted by column", async function() {
            var table = perspective.table(data);
            var view = table.view({
                col_pivot: ["y"],
                aggregate: [{column: "x", op: "avg"}]
            });
            let result2 = await view.schema();
            expect(result2).toEqual({x: "integer"});
        });

        it("['x'] has the correct # of rows", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["x"]
            });
            let result2 = await view.num_rows();
            expect(result2).toEqual(5);
        });

        it("['x'] has the correct # of columns", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["x"]
            });
            let result2 = await view.num_columns();
            expect(result2).toEqual(3);
        });

        it("['z']", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["z"]
            });
            var answer = [{__ROW_PATH__: [], x: 10, y: 4, z: 2}, {__ROW_PATH__: [false], x: 6, y: 2, z: 1}, {__ROW_PATH__: [true], x: 4, y: 2, z: 1}];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
        });

        it("['x', 'z']", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["x", "z"]
            });
            var answer = [
                {__ROW_PATH__: [], x: 10, y: 4, z: 2},
                {__ROW_PATH__: [1], x: 1, y: 1, z: 1},
                {__ROW_PATH__: [1, true], x: 1, y: 1, z: 1},
                {__ROW_PATH__: [2], x: 2, y: 1, z: 1},
                {__ROW_PATH__: [2, false], x: 2, y: 1, z: 1},
                {__ROW_PATH__: [3], x: 3, y: 1, z: 1},
                {__ROW_PATH__: [3, true], x: 3, y: 1, z: 1},
                {__ROW_PATH__: [4], x: 4, y: 1, z: 1},
                {__ROW_PATH__: [4, false], x: 4, y: 1, z: 1}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
        });

        it("['x', 'z'] windowed", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["x", "z"]
            });
            var answer = [
                {__ROW_PATH__: [1, true], x: 1, y: 1, z: 1},
                {__ROW_PATH__: [2], x: 2, y: 1, z: 1},
                {__ROW_PATH__: [2, false], x: 2, y: 1, z: 1},
                {__ROW_PATH__: [3], x: 3, y: 1, z: 1},
                {__ROW_PATH__: [3, true], x: 3, y: 1, z: 1},
                {__ROW_PATH__: [4], x: 4, y: 1, z: 1},
                {__ROW_PATH__: [4, false], x: 4, y: 1, z: 1}
            ];
            let result2 = await view.to_json({start_row: 2});
            expect(result2).toEqual(answer);
        });

        it("['x', 'z'], pivot_depth = 1", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["x", "z"],
                row_pivot_depth: 1
            });
            var answer = [
                {__ROW_PATH__: [], x: 10, y: 4, z: 2},
                {__ROW_PATH__: [1], x: 1, y: 1, z: 1},
                {__ROW_PATH__: [2], x: 2, y: 1, z: 1},
                {__ROW_PATH__: [3], x: 3, y: 1, z: 1},
                {__ROW_PATH__: [4], x: 4, y: 1, z: 1}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
        });
    });

    describe("Column pivot", function() {
        it("['x'] only, schema", async function() {
            var table = perspective.table(data);
            var view = table.view({
                column_pivot: ["y"]
            });
            let result2 = await view.schema();
            expect(meta).toEqual(result2);
        });

        it("['x'] only, column-oriented input", async function() {
            var table = perspective.table(data_7);
            var view = table.view({
                column_pivot: ["z"]
            });
            let result2 = await view.to_json();
            expect(result2).toEqual([
                {"true|w": 1.5, "true|x": 1, "true|y": "a", "true|z": true, "false|w": null, "false|x": null, "false|y": null, "false|z": null},
                {"true|w": null, "true|x": null, "true|y": null, "true|z": null, "false|w": 2.5, "false|x": 2, "false|y": "b", "false|z": false},
                {"true|w": 3.5, "true|x": 3, "true|y": "c", "true|z": true, "false|w": null, "false|x": null, "false|y": null, "false|z": null},
                {"true|w": null, "true|x": null, "true|y": null, "true|z": null, "false|w": 4.5, "false|x": 4, "false|y": "d", "false|z": false}
            ]);
        });

        it("['x'] only, column-oriented output", async function() {
            var table = perspective.table(data_7);
            var view = table.view({
                column_pivot: ["z"]
            });
            let result2 = await view.to_columns();
            expect(result2).toEqual({
                "true|w": [1.5, null, 3.5, null],
                "true|x": [1, null, 3, null],
                "true|y": ["a", null, "c", null],
                "true|z": [true, null, true, null],
                "false|w": [null, 2.5, null, 4.5],
                "false|x": [null, 2, null, 4],
                "false|y": [null, "b", null, "d"],
                "false|z": [null, false, null, false]
            });
        });

        it("['x'] only", async function() {
            var table = perspective.table(data);
            var view = table.view({
                column_pivot: ["y"]
            });
            var answer = [
                {"a|x": 1, "a|y": "a", "a|z": true, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null},
                {"a|x": null, "a|y": null, "a|z": null, "b|x": 2, "b|y": "b", "b|z": false, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null},
                {"a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": 3, "c|y": "c", "c|z": true, "d|x": null, "d|y": null, "d|z": null},
                {"a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": 4, "d|y": "d", "d|z": false}
            ];
            let result2 = await view.to_json();
            expect(answer).toEqual(result2);
        });

        it("['x'] by ['y']", async function() {
            var table = perspective.table(data);
            var view = table.view({
                column_pivot: ["y"],
                row_pivot: ["x"]
            });
            var answer = [
                {__ROW_PATH__: [], "a|x": 1, "a|y": 1, "a|z": 1, "b|x": 2, "b|y": 1, "b|z": 1, "c|x": 3, "c|y": 1, "c|z": 1, "d|x": 4, "d|y": 1, "d|z": 1},
                {__ROW_PATH__: [1], "a|x": 1, "a|y": 1, "a|z": 1, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null},
                {__ROW_PATH__: [2], "a|x": null, "a|y": null, "a|z": null, "b|x": 2, "b|y": 1, "b|z": 1, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null},
                {__ROW_PATH__: [3], "a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": 3, "c|y": 1, "c|z": 1, "d|x": null, "d|y": null, "d|z": null},
                {__ROW_PATH__: [4], "a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": 4, "d|y": 1, "d|z": 1}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
        });
    });

    describe("Column pivot w/sort", function() {
        it("['y'] by ['z'], sorted by 'x'", async function() {
            var table = perspective.table([
                {x: 7, y: "A", z: true},
                {x: 2, y: "A", z: false},
                {x: 5, y: "A", z: true},
                {x: 4, y: "A", z: false},
                {x: 1, y: "B", z: true},
                {x: 8, y: "B", z: false},
                {x: 3, y: "B", z: true},
                {x: 6, y: "B", z: false},
                {x: 9, y: "C", z: true},
                {x: 10, y: "C", z: false},
                {x: 11, y: "C", z: true},
                {x: 12, y: "C", z: false}
            ]);
            var view = table.view({
                column_pivot: ["z"],
                row_pivot: ["y"],
                sort: [["x", "desc"]]
            });

            let answer = [
                {__ROW_PATH__: [], "false|x": 42, "false|y": 3, "false|z": 1, "true|x": 36, "true|y": 3, "true|z": 1},
                {__ROW_PATH__: ["C"], "false|x": 22, "false|y": 1, "false|z": 1, "true|x": 20, "true|y": 1, "true|z": 1},
                {__ROW_PATH__: ["A"], "false|x": 6, "false|y": 1, "false|z": 1, "true|x": 12, "true|y": 1, "true|z": 1},
                {__ROW_PATH__: ["B"], "false|x": 14, "false|y": 1, "false|z": 1, "true|x": 4, "true|y": 1, "true|z": 1}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
        });

        it("['z'] by ['y'], sorted by 'y'", async function() {
            var table = perspective.table([
                {x: 7, y: "A", z: true},
                {x: 2, y: "A", z: false},
                {x: 5, y: "A", z: true},
                {x: 4, y: "A", z: false},
                {x: 1, y: "B", z: true},
                {x: 8, y: "B", z: false},
                {x: 3, y: "B", z: true},
                {x: 6, y: "B", z: false},
                {x: 9, y: "C", z: true},
                {x: 10, y: "C", z: false},
                {x: 11, y: "C", z: true},
                {x: 12, y: "C", z: false}
            ]);
            var view = table.view({
                column_pivot: ["y"],
                row_pivot: ["z"],
                sort: [["y", "desc"]],
                aggregate: [{column: "x", op: "sum"}, {column: "y", op: "any"}]
            });

            let result2 = await view.to_columns();
            expect(Object.keys(result2)).toEqual(["__ROW_PATH__", "C|x", "C|y", "B|x", "B|y", "A|x", "A|y"]);
        });
    });
};
