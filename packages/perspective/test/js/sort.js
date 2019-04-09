/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const data = {
    w: [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5],
    x: [1, 2, 3, 4, 4, 3, 2, 1],
    y: ["a", "b", "c", "d", "a", "b", "c", "d"],
    z: [true, false, true, false, true, false, true, false]
};

module.exports = perspective => {
    describe("Sorts", function() {
        describe("On hidden columns", function() {
            it("unpivotted", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    columns: ["w", "y"],
                    sort: [["x", "desc"]]
                });
                var answer = [{w: 4.5, y: "d"}, {w: 5.5, y: "a"}, {w: 3.5, y: "c"}, {w: 6.5, y: "b"}, {w: 2.5, y: "b"}, {w: 7.5, y: "c"}, {w: 1.5, y: "a"}, {w: 8.5, y: "d"}];
                let result = await view.to_json();
                expect(result).toEqual(answer);
                view.delete();
                table.delete();
            });

            it("row pivot ['y']", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    columns: ["w"],
                    row_pivots: ["y"],
                    sort: [["x", "desc"]]
                });
                var answer = [{__ROW_PATH__: [], w: 40}, {__ROW_PATH__: ["a"], w: 7}, {__ROW_PATH__: ["b"], w: 9}, {__ROW_PATH__: ["c"], w: 11}, {__ROW_PATH__: ["d"], w: 13}];
                let result = await view.to_json();
                expect(result).toEqual(answer);
                view.delete();
                table.delete();
            });

            it("column pivot ['y']", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    columns: ["w"],
                    column_pivots: ["y"],
                    sort: [["x", "desc"]]
                });
                var answer = [
                    {"a|w": null, "b|w": null, "c|w": null, "d|w": 4.5},
                    {"a|w": 5.5, "b|w": null, "c|w": null, "d|w": null},
                    {"a|w": null, "b|w": null, "c|w": 3.5, "d|w": null},
                    {"a|w": null, "b|w": 6.5, "c|w": null, "d|w": null},
                    {"a|w": null, "b|w": 2.5, "c|w": null, "d|w": null},
                    {"a|w": null, "b|w": null, "c|w": 7.5, "d|w": null},
                    {"a|w": 1.5, "b|w": null, "c|w": null, "d|w": null},
                    {"a|w": null, "b|w": null, "c|w": null, "d|w": 8.5}
                ];
                let result = await view.to_json();
                expect(result).toEqual(answer);
                view.delete();
                table.delete();
            });

            it("row pivot ['y'], column pivot ['z']", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    columns: ["w"],
                    row_pivots: ["y"],
                    column_pivots: ["z"],
                    sort: [["x", "desc"]]
                });
                var answer = [
                    {__ROW_PATH__: [], "false|w": 22, "true|w": 18},
                    {__ROW_PATH__: ["a"], "false|w": null, "true|w": 7},
                    {__ROW_PATH__: ["b"], "false|w": 9, "true|w": null},
                    {__ROW_PATH__: ["c"], "false|w": null, "true|w": 11},
                    {__ROW_PATH__: ["d"], "false|w": 13, "true|w": null}
                ];
                let result = await view.to_json();
                expect(result).toEqual(answer);
                view.delete();
                table.delete();
            });

            it("column pivot ['y'] has correct # of columns", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    columns: ["w"],
                    column_pivots: ["y"],
                    sort: [["x", "desc"]]
                });
                let result = await view.num_columns();
                expect(result).toEqual(4);
                view.delete();
                table.delete();
            });
        });
    });
};
