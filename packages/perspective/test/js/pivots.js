/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

var data = [
    {x: 1, y: "a", z: true},
    {x: 2, y: "b", z: false},
    {x: 3, y: "c", z: true},
    {x: 4, y: "d", z: false}
];

var meta = {
    x: "integer",
    y: "string",
    z: "boolean"
};

var data2 = [
    {x: 1, y: 1, z: true},
    {x: 2, y: 1, z: false},
    {x: 3, y: 2, z: true},
    {x: 4, y: 2, z: false}
];

var data_7 = {
    w: [1.5, 2.5, 3.5, 4.5],
    x: [1, 2, 3, 4],
    y: ["a", "b", "c", "d"],
    z: [true, false, true, false]
};

var data_8 = {
    w: [1.5, 2.5, 3.5, 4.5],
    x: [1, 2, 3, 4],
    y: ["a", "b", "c", "d"],
    z: [new Date(1555126035065), new Date(1555126035065), new Date(1555026035065), new Date(1555026035065)]
};

module.exports = perspective => {
    describe("Aggregate", function() {
        it("old `aggregate` syntax is backwards compatible", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                aggregate: [{column: "x", op: "sum"}],
                row_pivots: ["z"]
            });
            var answer = [
                {__ROW_PATH__: [], x: 10},
                {__ROW_PATH__: [false], x: 6},
                {__ROW_PATH__: [true], x: 4}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], sum", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["z"],
                columns: ["x"]
            });
            var answer = [
                {__ROW_PATH__: [], x: 10},
                {__ROW_PATH__: [false], x: 6},
                {__ROW_PATH__: [true], x: 4}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], weighted mean", async function() {
            var table = await perspective.table(data2);
            var view = await table.view({
                row_pivots: ["z"],
                aggregates: {x: ["weighted mean", "y"]},
                columns: ["x"]
            });
            var answer = [
                {__ROW_PATH__: [], x: 2.8333333333333335},
                {__ROW_PATH__: [false], x: 3.3333333333333335},
                {__ROW_PATH__: [true], x: 2.3333333333333335}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], weighted mean on a table created from schema should return valid values after update", async function() {
            const table = await perspective.table({
                x: "integer",
                y: "integer",
                z: "boolean"
            });

            const view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: ["weighted mean", "y"]}
            });

            const answer = [
                {__ROW_PATH__: [], x: 2.8333333333333335},
                {__ROW_PATH__: [false], x: 3.3333333333333335},
                {__ROW_PATH__: [true], x: 2.3333333333333335}
            ];

            table.update(data2);

            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], mean", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: "mean"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 2.5},
                {__ROW_PATH__: [false], x: 3},
                {__ROW_PATH__: [true], x: 2}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], mean on a table created from schema should return valid values after update", async function() {
            const table = await perspective.table({
                x: "integer",
                y: "string",
                z: "boolean"
            });
            const view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: "mean"}
            });
            const answer = [
                {__ROW_PATH__: [], x: 2.5},
                {__ROW_PATH__: [false], x: 3},
                {__ROW_PATH__: [true], x: 2}
            ];

            table.update(data);

            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], first by index", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: "first by index"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 1},
                {__ROW_PATH__: [false], x: 2},
                {__ROW_PATH__: [true], x: 1}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], first by index with appends", async function() {
            var table = await perspective.table(data, {index: "y"});
            var view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: "first by index"}
            });
            const answer = [
                {__ROW_PATH__: [], x: 1},
                {__ROW_PATH__: [false], x: 2},
                {__ROW_PATH__: [true], x: 1}
            ];
            table.update({
                x: [5],
                y: ["e"],
                z: [true]
            });
            const result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], first by index with partial updates", async function() {
            var table = await perspective.table(data, {index: "y"});
            var view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: "first by index"}
            });
            const answer = [
                {__ROW_PATH__: [], x: 5},
                {__ROW_PATH__: [false], x: 2},
                {__ROW_PATH__: [true], x: 5}
            ];
            table.update({
                x: [5],
                y: ["a"],
                z: [true]
            });
            const result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], last by index", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: "last by index"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 4},
                {__ROW_PATH__: [false], x: 4},
                {__ROW_PATH__: [true], x: 3}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], last by index with appends", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: "last by index"}
            });
            const answer = [
                {__ROW_PATH__: [], x: 5},
                {__ROW_PATH__: [false], x: 4},
                {__ROW_PATH__: [true], x: 5}
            ];
            table.update({
                x: [5],
                y: ["e"],
                z: [true]
            });
            const result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], last by index with partial updates", async function() {
            const table = await perspective.table(data, {index: "y"});
            const view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: "last by index"}
            });
            const answer = [
                {__ROW_PATH__: [], x: 4},
                {__ROW_PATH__: [false], x: 4},
                {__ROW_PATH__: [true], x: 5}
            ];
            table.update({
                x: [5],
                y: ["c"],
                z: [true]
            });
            const result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'], last", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["z"],
                columns: ["x"],
                aggregates: {x: "last"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 3},
                {__ROW_PATH__: [false], x: 4},
                {__ROW_PATH__: [true], x: 3}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);

            table.update([
                {x: 1, y: "c", z: true},
                {x: 2, y: "d", z: false}
            ]);
            var answerAfterUpdate = [
                {__ROW_PATH__: [], x: 1},
                {__ROW_PATH__: [false], x: 2},
                {__ROW_PATH__: [true], x: 1}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answerAfterUpdate);
            view.delete();
            table.delete();
        });
    });

    describe("Aggregates with nulls", function() {
        it("mean", async function() {
            var table = await perspective.table([
                {x: 3, y: 1},
                {x: 2, y: 1},
                {x: null, y: 1},
                {x: null, y: 1},
                {x: 4, y: 2},
                {x: null, y: 2}
            ]);
            var view = await table.view({
                row_pivots: ["y"],
                columns: ["x"],
                aggregates: {x: "mean"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 3},
                {__ROW_PATH__: [1], x: 2.5},
                {__ROW_PATH__: [2], x: 4}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("mean with 0", async function() {
            var table = await perspective.table([
                {x: 3, y: 1},
                {x: 3, y: 1},
                {x: 0, y: 1},
                {x: null, y: 1},
                {x: null, y: 1},
                {x: 4, y: 2},
                {x: null, y: 2}
            ]);
            var view = await table.view({
                row_pivots: ["y"],
                columns: ["x"],
                aggregates: {x: "mean"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 2.5},
                {__ROW_PATH__: [1], x: 2},
                {__ROW_PATH__: [2], x: 4}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("mean with 0.0 (floats)", async function() {
            var table = await perspective.table({x: "float", y: "integer"});
            table.update([
                {x: 3, y: 1},
                {x: 3, y: 1},
                {x: 0, y: 1},
                {x: null, y: 1},
                {x: null, y: 1},
                {x: 4, y: 2},
                {x: null, y: 2}
            ]);
            var view = await table.view({
                row_pivots: ["y"],
                columns: ["x"],
                aggregates: {x: "mean"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 2.5},
                {__ROW_PATH__: [1], x: 2},
                {__ROW_PATH__: [2], x: 4}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("sum", async function() {
            var table = await perspective.table([
                {x: 3, y: 1},
                {x: 2, y: 1},
                {x: null, y: 1},
                {x: null, y: 1},
                {x: 4, y: 2},
                {x: null, y: 2}
            ]);
            var view = await table.view({
                row_pivots: ["y"],
                columns: ["x"]
            });
            var answer = [
                {__ROW_PATH__: [], x: 9},
                {__ROW_PATH__: [1], x: 5},
                {__ROW_PATH__: [2], x: 4}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("abs sum", async function() {
            var table = await perspective.table([
                {x: 3, y: 1},
                {x: 2, y: 1},
                {x: null, y: 1},
                {x: null, y: 1},
                {x: -4, y: 2},
                {x: null, y: 2}
            ]);
            var view = await table.view({
                row_pivots: ["y"],
                columns: ["x"],
                aggregates: {x: "abs sum"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 1},
                {__ROW_PATH__: [1], x: 5},
                {__ROW_PATH__: [2], x: 4}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("mean after update", async function() {
            var table = await perspective.table([
                {x: 3, y: 1},
                {x: null, y: 1},
                {x: null, y: 2}
            ]);
            table.update([
                {x: 2, y: 1},
                {x: null, y: 1},
                {x: 4, y: 2}
            ]);
            var view = await table.view({
                row_pivots: ["y"],
                columns: ["x"],
                aggregates: {x: "mean"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 3},
                {__ROW_PATH__: [1], x: 2.5},
                {__ROW_PATH__: [2], x: 4}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("mean at aggregate level", async function() {
            var table = await perspective.table([
                {x: 4, y: 1, z: "a"},
                {x: null, y: 1, z: "a"},
                {x: null, y: 2, z: "a"}
            ]);
            table.update([
                {x: 1, y: 1, z: "b"},
                {x: 1, y: 1, z: "b"},
                {x: null, y: 1, z: "b"},
                {x: 4, y: 2, z: "b"},
                {x: null, y: 2, z: "b"}
            ]);
            table.update([
                {x: 2, y: 2, z: "c"},
                {x: 3, y: 2, z: "c"},
                {x: null, y: 2, z: "c"},
                {x: 7, y: 2, z: "c"}
            ]);
            var view = await table.view({
                row_pivots: ["y", "z"],
                columns: ["x"],
                aggregates: {x: "mean"}
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
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("null in pivot column", async function() {
            var table = await perspective.table([{x: null}, {x: "x"}, {x: "y"}]);
            var view = await table.view({
                row_pivots: ["x"],
                columns: ["x"],
                aggregates: {x: "distinct count"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 3},
                {__ROW_PATH__: [null], x: 1},
                {__ROW_PATH__: ["x"], x: 1},
                {__ROW_PATH__: ["y"], x: 1}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("weighted mean", async function() {
            var table = await perspective.table([
                {a: "a", x: 1, y: 200},
                {a: "a", x: 2, y: 100},
                {a: "a", x: 3, y: null}
            ]);
            var view = await table.view({
                row_pivots: ["a"],
                aggregates: {y: ["weighted mean", "x"]},
                columns: ["y"]
            });
            var answer = [
                {__ROW_PATH__: [], y: (1 * 200 + 2 * 100) / (1 + 2)},
                {__ROW_PATH__: ["a"], y: (1 * 200 + 2 * 100) / (1 + 2)}
            ];
            let result = await view.to_json();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });
    });

    describe("Aggregates with negatives", function() {
        it("sum abs", async function() {
            var table = await perspective.table([
                {x: 3, y: 1},
                {x: 2, y: 1},
                {x: 1, y: 1},
                {x: -1, y: 1},
                {x: -2, y: 2},
                {x: -3, y: 2}
            ]);
            var view = await table.view({
                row_pivots: ["y"],
                columns: ["x"],
                aggregates: {x: "sum abs"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 12},
                {__ROW_PATH__: [1], x: 7},
                {__ROW_PATH__: [2], x: 5}
            ];
            let result = await view.to_json();
            expect(answer).toEqual(result);
            view.delete();
            table.delete();
        });

        it("abs sum", async function() {
            var table = await perspective.table([
                {x: 3, y: 1},
                {x: 2, y: 1},
                {x: -1, y: 1},
                {x: -1, y: 1},
                {x: -2, y: 2},
                {x: -3, y: 2}
            ]);
            var view = await table.view({
                row_pivots: ["y"],
                columns: ["x"],
                aggregates: {x: "abs sum"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 2},
                {__ROW_PATH__: [1], x: 3},
                {__ROW_PATH__: [2], x: 5}
            ];
            let result = await view.to_json();
            expect(answer).toEqual(result);
            view.delete();
            table.delete();
        });
    });

    describe("Row pivot", function() {
        it("['x']", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["x"],
                aggregates: {y: "distinct count", z: "distinct count"}
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
            view.delete();
            table.delete();
        });

        it("['x'] test update pkey column", async function() {
            const schema = {
                id: "integer",
                name: "string",
                chg: "float",
                pos: "integer"
            };
            const rec1 = [
                {id: 1, name: "John", pos: 100, chg: 1},
                {id: 2, name: "Mary", pos: 200, chg: 2},
                {id: 3, name: "Tom", pos: 300, chg: 3}
            ];
            const table = await perspective.table(schema, {index: "id"});
            table.update(rec1);
            let view = await table.view({
                row_pivots: ["id"],
                columns: ["pos"]
            });
            let rec2 = [{id: 1, chg: 3}];
            table.update(rec2);
            let result2 = await view.to_json();
            var answer = [
                {__ROW_PATH__: [], pos: 600},
                {__ROW_PATH__: [1], pos: 100},
                {__ROW_PATH__: [2], pos: 200},
                {__ROW_PATH__: [3], pos: 300}
            ];
            expect(result2).toEqual(answer);
            view.delete();
            table.delete();
        });

        describe("pivoting on column containing null values", function() {
            it("shows one pivot for the nulls on initial load", async function() {
                const dataWithNulls = [
                    {name: "Homer", value: 1},
                    {name: null, value: 1},
                    {name: null, value: 1},
                    {name: "Krusty", value: 1}
                ];

                var table = await perspective.table(dataWithNulls);

                var view = await table.view({
                    row_pivots: ["name"],
                    aggregates: {name: "distinct count"}
                });

                const answer = [
                    {__ROW_PATH__: [], name: 3, value: 4},
                    {__ROW_PATH__: [null], name: 1, value: 2},
                    {__ROW_PATH__: ["Homer"], name: 1, value: 1},
                    {__ROW_PATH__: ["Krusty"], name: 1, value: 1}
                ];

                let results = await view.to_json();
                expect(results).toEqual(answer);
                view.delete();
                table.delete();
            });

            it("shows one pivot for the nulls after updating with a null", async function() {
                const dataWithNull1 = [
                    {name: "Homer", value: 1},
                    {name: null, value: 1}
                ];
                const dataWithNull2 = [
                    {name: null, value: 1},
                    {name: "Krusty", value: 1}
                ];

                var table = await perspective.table(dataWithNull1);
                table.update(dataWithNull2);

                var view = await table.view({
                    row_pivots: ["name"],
                    aggregates: {name: "distinct count"}
                });

                const answer = [
                    {__ROW_PATH__: [], name: 3, value: 4},
                    {__ROW_PATH__: [null], name: 1, value: 2},
                    {__ROW_PATH__: ["Homer"], name: 1, value: 1},
                    {__ROW_PATH__: ["Krusty"], name: 1, value: 1}
                ];

                let results = await view.to_json();
                expect(results).toEqual(answer);
                view.delete();
                table.delete();
            });
        });

        it("['x'] has a schema", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["x"]
            });
            let result2 = await view.schema();
            expect(result2).toEqual({x: "integer", y: "integer", z: "integer"});
            view.delete();
            table.delete();
        });

        it("['x'] translates type `string` to `integer` when pivoted by row", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["x"],
                columns: ["y"],
                aggregates: {y: "distinct count"}
            });
            let result2 = await view.schema();
            expect(result2).toEqual({y: "integer"});
            view.delete();
            table.delete();
        });

        it("['x'] translates type `integer` to `float` when pivoted by row", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["y"],
                columns: ["x"],
                aggregates: {x: "avg"}
            });
            let result2 = await view.schema();
            expect(result2).toEqual({x: "float"});
            view.delete();
            table.delete();
        });

        it("['x'] does not translate type when only pivoted by column", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                column_pivots: ["y"],
                columns: ["x"],
                aggregates: {x: "avg"}
            });
            let result2 = await view.schema();
            expect(result2).toEqual({x: "integer"});
            view.delete();
            table.delete();
        });

        it("['x'] has the correct # of rows", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["x"]
            });
            let result2 = await view.num_rows();
            expect(result2).toEqual(5);
            view.delete();
            table.delete();
        });

        it("['x'] has the correct # of columns", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["x"]
            });
            let result2 = await view.num_columns();
            expect(result2).toEqual(3);
            view.delete();
            table.delete();
        });

        it("Row Pivot by date column results in correct headers", async function() {
            var table = await perspective.table({
                a: [
                    new Date("2020/01/15"),
                    new Date("2020/02/15"),
                    new Date("2020/03/15"),
                    new Date("2020/04/15"),
                    new Date("2020/05/15"),
                    new Date("2020/06/15"),
                    new Date("2020/07/15"),
                    new Date("2020/08/15"),
                    new Date("2020/09/15"),
                    new Date("2020/10/15"),
                    new Date("2020/11/15"),
                    new Date("2020/12/15")
                ],
                b: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            });
            var view = await table.view({
                row_pivots: ["a"]
            });
            const results = await view.to_columns();
            expect(results).toEqual({
                __ROW_PATH__: [
                    [],
                    [1579046400000],
                    [1581724800000],
                    [1584230400000],
                    [1586908800000],
                    [1589500800000],
                    [1592179200000],
                    [1594771200000],
                    [1597449600000],
                    [1600128000000],
                    [1602720000000],
                    [1605398400000],
                    [1607990400000]
                ],
                a: [12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                b: [78, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            });

            const dates = results["__ROW_PATH__"];
            let date_results = [];
            const expected = [
                new Date("2020/01/15"),
                new Date("2020/02/15"),
                new Date("2020/03/15"),
                new Date("2020/04/15"),
                new Date("2020/05/15"),
                new Date("2020/06/15"),
                new Date("2020/07/15"),
                new Date("2020/08/15"),
                new Date("2020/09/15"),
                new Date("2020/10/15"),
                new Date("2020/11/15"),
                new Date("2020/12/15")
            ];

            for (const d of dates) {
                if (d[0]) {
                    date_results.push(new Date(d[0]));
                }
            }

            expect(date_results).toEqual(expected);

            view.delete();
            table.delete();
        });

        it("['z']", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["z"],
                aggregates: {y: "distinct count", z: "distinct count"}
            });
            var answer = [
                {__ROW_PATH__: [], x: 10, y: 4, z: 2},
                {__ROW_PATH__: [false], x: 6, y: 2, z: 1},
                {__ROW_PATH__: [true], x: 4, y: 2, z: 1}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['x', 'z']", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["x", "z"],
                aggregates: {y: "distinct count", z: "distinct count"}
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
            view.delete();
            table.delete();
        });

        it("['x', 'z'] windowed", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["x", "z"]
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
            view.delete();
            table.delete();
        });

        it("['x', 'z'], pivot_depth = 1", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["x", "z"],
                row_pivot_depth: 1,
                aggregates: {y: "distinct count", z: "distinct count"}
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
            view.delete();
            table.delete();
        });
    });

    describe("Column pivot", function() {
        it("['y'] only, schema", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                column_pivots: ["y"]
            });
            let result2 = await view.schema();
            expect(result2).toEqual(meta);
            view.delete();
            table.delete();
        });

        it("['z'] only, datetime column", async function() {
            var table = await perspective.table(data_8);
            var view = await table.view({
                column_pivots: ["z"],
                columns: ["x", "y"]
            });
            let result2 = await view.to_columns();
            expect(result2).toEqual({
                "2019-4-11 23:40:35|x": [null, null, 3, 4],
                "2019-4-11 23:40:35|y": [null, null, "c", "d"],
                "2019-4-13 03:27:15|x": [1, 2, null, null],
                "2019-4-13 03:27:15|y": ["a", "b", null, null]
            });
            view.delete();
            table.delete();
        });

        it("['x'] only, column-oriented input", async function() {
            var table = await perspective.table(data_7);
            var view = await table.view({
                column_pivots: ["z"]
            });
            let result2 = await view.to_json();
            expect(result2).toEqual([
                {"true|w": 1.5, "true|x": 1, "true|y": "a", "true|z": true, "false|w": null, "false|x": null, "false|y": null, "false|z": null},
                {"true|w": null, "true|x": null, "true|y": null, "true|z": null, "false|w": 2.5, "false|x": 2, "false|y": "b", "false|z": false},
                {"true|w": 3.5, "true|x": 3, "true|y": "c", "true|z": true, "false|w": null, "false|x": null, "false|y": null, "false|z": null},
                {"true|w": null, "true|x": null, "true|y": null, "true|z": null, "false|w": 4.5, "false|x": 4, "false|y": "d", "false|z": false}
            ]);
            view.delete();
            table.delete();
        });

        it("['z'] only, column-oriented output", async function() {
            var table = await perspective.table(data_7);
            var view = await table.view({
                column_pivots: ["z"]
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
            view.delete();
            table.delete();
        });

        it("['y'] only sorted by ['x'] desc", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                column_pivots: ["y"],
                sort: [["x", "desc"]]
            });
            var answer = [
                {"a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": 4, "d|y": "d", "d|z": false},
                {"a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": 3, "c|y": "c", "c|z": true, "d|x": null, "d|y": null, "d|z": null},
                {"a|x": null, "a|y": null, "a|z": null, "b|x": 2, "b|y": "b", "b|z": false, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null},
                {"a|x": 1, "a|y": "a", "a|z": true, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['y'] only", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                column_pivots: ["y"]
            });
            var answer = [
                {"a|x": 1, "a|y": "a", "a|z": true, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null},
                {"a|x": null, "a|y": null, "a|z": null, "b|x": 2, "b|y": "b", "b|z": false, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null},
                {"a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": 3, "c|y": "c", "c|z": true, "d|x": null, "d|y": null, "d|z": null},
                {"a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": 4, "d|y": "d", "d|z": false}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['x'] by ['y']", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                column_pivots: ["y"],
                row_pivots: ["x"]
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
            view.delete();
            table.delete();
        });

        it("['x', 'z']", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                column_pivots: ["x", "z"],
                columns: ["y"]
            });
            let result2 = await view.to_json();
            expect(result2).toEqual([
                {"1|true|y": "a", "2|false|y": null, "3|true|y": null, "4|false|y": null},
                {"1|true|y": null, "2|false|y": "b", "3|true|y": null, "4|false|y": null},
                {"1|true|y": null, "2|false|y": null, "3|true|y": "c", "4|false|y": null},
                {"1|true|y": null, "2|false|y": null, "3|true|y": null, "4|false|y": "d"}
            ]);
            view.delete();
            table.delete();
        });
    });

    describe("Expand/Collapse", function() {
        it("Collapse a row in a 2x2 pivot", async function() {
            var table = await perspective.table([
                {x: 7, y: "A", z: true, a: "AA", b: "BB", c: "CC"},
                {x: 2, y: "A", z: false, a: "AA", b: "CC", c: "CC"},
                {x: 5, y: "A", z: true, a: "AA", b: "BB", c: "DD"},
                {x: 4, y: "A", z: false, a: "AA", b: "CC", c: "DD"},
                {x: 1, y: "B", z: true, a: "AA", b: "BB", c: "CC"},
                {x: 8, y: "B", z: false, a: "AA", b: "CC", c: "CC"},
                {x: 3, y: "B", z: true, a: "BB", b: "BB", c: "DD"},
                {x: 6, y: "B", z: false, a: "BB", b: "CC", c: "DD"},
                {x: 9, y: "C", z: true, a: "BB", b: "BB", c: "CC"},
                {x: 10, y: "C", z: false, a: "BB", b: "CC", c: "CC"},
                {x: 11, y: "C", z: true, a: "BB", b: "BB", c: "DD"},
                {x: 12, y: "C", z: false, a: "BB", b: "CC", c: "DD"}
            ]);
            var view = await table.view({
                column_pivots: ["z", "b"],
                row_pivots: ["y", "a"],
                columns: ["x"],
                aggregates: {x: "last"}
            });

            let answer = [
                {__ROW_PATH__: [], "false|CC|x": 12, "true|BB|x": 11},
                {__ROW_PATH__: ["A"], "false|CC|x": 4, "true|BB|x": 5},
                {__ROW_PATH__: ["A", "AA"], "false|CC|x": 4, "true|BB|x": 5},
                {__ROW_PATH__: ["B"], "false|CC|x": 6, "true|BB|x": 3},
                {__ROW_PATH__: ["C"], "false|CC|x": 12, "true|BB|x": 11},
                {__ROW_PATH__: ["C", "BB"], "false|CC|x": 12, "true|BB|x": 11}
            ];
            view.collapse(3);
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
            view.delete();
            table.delete();
        });
    });

    describe("Column pivot w/sort", function() {
        it("['y'] by ['z'], sorted by 'x'", async function() {
            var table = await perspective.table([
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
            var view = await table.view({
                column_pivots: ["z"],
                row_pivots: ["y"],
                sort: [["x", "desc"]],
                aggregates: {y: "distinct count", z: "distinct count"}
            });

            let answer = [
                {__ROW_PATH__: [], "false|x": 42, "false|y": 3, "false|z": 1, "true|x": 36, "true|y": 3, "true|z": 1},
                {__ROW_PATH__: ["C"], "false|x": 22, "false|y": 1, "false|z": 1, "true|x": 20, "true|y": 1, "true|z": 1},
                {__ROW_PATH__: ["A"], "false|x": 6, "false|y": 1, "false|z": 1, "true|x": 12, "true|y": 1, "true|z": 1},
                {__ROW_PATH__: ["B"], "false|x": 14, "false|y": 1, "false|z": 1, "true|x": 4, "true|y": 1, "true|z": 1}
            ];
            let result2 = await view.to_json();
            expect(result2).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("['z'] by ['y'], sorted by 'y'", async function() {
            var table = await perspective.table([
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
            var view = await table.view({
                column_pivots: ["y"],
                row_pivots: ["z"],
                sort: [["y", "col desc"]],
                columns: ["x", "y"],
                aggregates: {x: "sum", y: "any"}
            });

            let result2 = await view.to_columns();
            expect(Object.keys(result2)).toEqual(["__ROW_PATH__", "C|x", "C|y", "B|x", "B|y", "A|x", "A|y"]);
            view.delete();
            table.delete();
        });

        it("['y'] by ['x'] sorted by ['x'] desc has the correct # of columns", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                column_pivots: ["y"],
                row_pivots: ["x"],
                sort: [["x", "desc"]]
            });
            let num_cols = await view.num_columns();
            expect(num_cols).toEqual(12);
            view.delete();
            table.delete();
        });
    });

    describe("Pivot table operations", function() {
        it("Should not expand past number of row pivots", async function() {
            var table = await perspective.table(data);
            var view = await table.view({
                row_pivots: ["x"],
                column_pivots: ["y"]
            });
            var expanded_idx = await view.expand(2);
            // invalid expands return the index
            expect(expanded_idx).toEqual(2);
        });
    });

    describe("Column paths", function() {
        it("Should return all columns, 0-sided view from schema", async function() {
            const table = await perspective.table(meta);
            const view = await table.view();
            const paths = await view.column_paths();
            expect(paths).toEqual(["x", "y", "z"]);
            view.delete();
            table.delete();
        });

        it("Should return all columns in specified order, 0-sided view from schema", async function() {
            const table = await perspective.table(meta);
            const view = await table.view({
                columns: ["z", "y", "x"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["z", "y", "x"]);
            view.delete();
            table.delete();
        });

        it("Should return specified visible columns, 0-sided view from schema", async function() {
            const table = await perspective.table(meta);
            const view = await table.view({
                columns: ["x"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["x"]);
            view.delete();
            table.delete();
        });

        it("Should return all columns, 0-sided view", async function() {
            const table = await perspective.table(data);
            const view = await table.view();
            const paths = await view.column_paths();
            expect(paths).toEqual(["x", "y", "z"]);
            view.delete();
            table.delete();
        });

        it("Should return all columns in specified order, 0-sided view", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                columns: ["z", "y", "x"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["z", "y", "x"]);
            view.delete();
            table.delete();
        });

        it("Should return specified visible columns, 0-sided view", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                columns: ["x"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["x"]);
            view.delete();
            table.delete();
        });

        it("Should return all columns with __ROW_PATH__, 1-sided view", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                row_pivots: ["x"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["__ROW_PATH__", "x", "y", "z"]);
            view.delete();
            table.delete();
        });

        it("Should return all columns in specified order, 1-sided view", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                row_pivots: ["x"],
                columns: ["z", "y", "x"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["__ROW_PATH__", "z", "y", "x"]);
            view.delete();
            table.delete();
        });

        it("Should return specified visible columns with __ROW_PATH__, 1-sided view", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                columns: ["x"],
                row_pivots: ["x"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["__ROW_PATH__", "x"]);
            view.delete();
            table.delete();
        });

        it("Should return all columns with __ROW_PATH__, 2-sided view", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                row_pivots: ["x"],
                column_pivots: ["y"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["__ROW_PATH__", "a|x", "a|y", "a|z", "b|x", "b|y", "b|z", "c|x", "c|y", "c|z", "d|x", "d|y", "d|z"]);
            view.delete();
            table.delete();
        });

        it("Should return specified visible columns with __ROW_PATH__, 2-sided view", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                columns: ["z", "y", "x"],
                row_pivots: ["x"],
                column_pivots: ["y"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["__ROW_PATH__", "a|z", "a|y", "a|x", "b|z", "b|y", "b|x", "c|z", "c|y", "c|x", "d|z", "d|y", "d|x"]);
            view.delete();
            table.delete();
        });

        it("Should return specified visible columns with __ROW_PATH__, 2-sided view", async function() {
            const table = await perspective.table(data);
            const view = await table.view({
                columns: ["x"],
                row_pivots: ["x"],
                column_pivots: ["y"]
            });
            const paths = await view.column_paths();
            expect(paths).toEqual(["__ROW_PATH__", "a|x", "b|x", "c|x", "d|x"]);
            view.delete();
            table.delete();
        });
    });
};
