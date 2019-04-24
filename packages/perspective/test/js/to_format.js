/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

var int_float_string_data = [
    {int: 1, float: 2.25, string: "a", datetime: new Date()},
    {int: 2, float: 3.5, string: "b", datetime: new Date()},
    {int: 3, float: 4.75, string: "c", datetime: new Date()},
    {int: 4, float: 5.25, string: "d", datetime: new Date()}
];

module.exports = perspective => {
    describe("data slice", function() {
        it("should filter out invalid start rows", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view();
            let json = await view.to_json({
                start_row: 5
            });
            expect(json).toEqual([]);
        });

        it("should filter out invalid start columns", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view();
            let json = await view.to_json({
                start_col: 5
            });
            expect(json).toEqual([{}, {}, {}, {}]);
        });

        it("should respect start/end rows", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view();
            let json = await view.to_json({
                start_row: 2,
                end_row: 3
            });
            let comparator = int_float_string_data[2];
            comparator.datetime = +comparator.datetime;
            expect(json[0]).toEqual(comparator);
        });

        it("should respect start/end columns", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view();
            let json = await view.to_columns({
                start_col: 2,
                end_col: 3
            });
            let comparator = {string: int_float_string_data.map(d => d.string)};
            expect(json).toEqual(comparator);
        });

        it("one-sided views should have row paths", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                row_pivots: ["int"]
            });
            let json = await view.to_json();
            for (let d of json) {
                expect(d.__ROW_PATH__).toBeDefined();
            }
        });

        it("one-sided views with start_col > 0 should have row paths", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                row_pivots: ["int"]
            });
            let json = await view.to_json({start_col: 1});
            for (let d of json) {
                expect(d.__ROW_PATH__).toBeDefined();
            }
        });

        it("one-sided column-only views should not have row paths", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                column_pivots: ["int"]
            });
            let json = await view.to_json();
            for (let d of json) {
                expect(d.__ROW_PATH__).toBeUndefined();
            }
        });

        it("column-only views should not have header rows", async function() {
            let table = perspective.table([{x: 1, y: "a"}, {x: 2, y: "b"}]);
            let view = table.view({
                column_pivots: ["x"]
            });
            let json = await view.to_json();
            expect(json).toEqual([{"1|x": 1, "1|y": "a", "2|x": null, "2|y": null}, {"1|x": null, "1|y": null, "2|x": 2, "2|y": "b"}]);
        });

        it("column-only views should return correct windows of data", async function() {
            let table = perspective.table([{x: 1, y: "a"}, {x: 2, y: "b"}]);
            let view = table.view({
                column_pivots: ["x"]
            });
            let json = await view.to_json({
                start_row: 1
            });
            expect(json).toEqual([{"1|x": null, "1|y": null, "2|x": 2, "2|y": "b"}]);
        });

        it("two-sided views should have row paths", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                row_pivots: ["int"],
                column_pivots: ["string"]
            });
            let json = await view.to_json();
            for (let d of json) {
                expect(d.__ROW_PATH__).toBeDefined();
            }
        });

        it("two-sided views with start_col > 0 should have row paths", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                row_pivots: ["int"],
                column_pivots: ["string"]
            });
            let json = await view.to_json({start_col: 1});
            for (let d of json) {
                expect(d.__ROW_PATH__).toBeDefined();
            }
        });

        it("two-sided sorted views with start_col > 0 should have row paths", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                row_pivots: ["int"],
                column_pivots: ["string"],
                sort: [["string", "desc"]]
            });
            let json = await view.to_json({start_col: 1});
            for (let d of json) {
                expect(d.__ROW_PATH__).toBeDefined();
            }
        });
    });

    describe("to_json", function() {
        it("should emit same number of column names as number of pivots", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                row_pivots: ["int"],
                column_pivots: ["float", "string"],
                sort: [["int", "asc"]]
            });
            let json = await view.to_json();
            // Get the first emitted column name that is not __ROW_PATH__
            let name = Object.keys(json[0])[1];
            // make sure that number of separators = num of column pivots
            expect((name.match(/\|/g) || []).length).toEqual(2);
        });
    });

    describe("to_arrow()", function() {
        it("Transitive arrow output 0-sided", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view();
            let arrow = await view.to_arrow();
            let json2 = await view.to_json();
            //expect(arrow.byteLength).toEqual(1010);

            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json = await view2.to_json();
            expect(json).toEqual(json2);

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });

        it("Transitive arrow output 0-sided, with row range", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view();
            let arrow = await view.to_arrow({start_row: 1, end_row: 3});
            let json2 = await view.to_json({start_row: 1, end_row: 3});
            // expect(arrow.byteLength).toEqual(908);

            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json = await view2.to_json();
            expect(json).toEqual(json2);
            expect(json.length).toEqual(2);

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });

        it("Transitive arrow output 0-sided, with col range", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view();
            let arrow = await view.to_arrow({start_col: 1, end_col: 3});
            let json2 = await view.to_json({start_col: 1, end_col: 3});
            // expect(arrow.byteLength).toEqual(908);

            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json = await view2.to_json();
            expect(json).toEqual(json2);
            expect(json.length).toEqual(4);

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });

        it("Transitive arrow output 1-sided", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({row_pivots: ["string"]});
            let json = await view.to_json();
            let arrow = await view.to_arrow();
            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json2 = await view2.to_json();

            expect(json2).toEqual(
                json.map(x => {
                    delete x["__ROW_PATH__"];
                    return x;
                })
            );

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });

        it("Transitive arrow output 2-sided", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({row_pivots: ["string"], column_pivots: ["int"]});
            let json = await view.to_json();
            let arrow = await view.to_arrow();
            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json2 = await view2.to_json();

            expect(json2).toEqual(
                json.map(x => {
                    delete x["__ROW_PATH__"];
                    return x;
                })
            );

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });

        it("Transitive arrow output 2-sided column only", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({column_pivots: ["string"]});
            let json = await view.to_json();
            let arrow = await view.to_arrow();
            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json2 = await view2.to_json();

            expect(json2).toEqual(
                json.map(x => {
                    delete x["__ROW_PATH__"];
                    return x;
                })
            );

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });
    });
};
