/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const _ = require("lodash");
const arrows = require("./test_arrows.js");

var data = [
    {x: 1, y: "a", z: true},
    {x: 2, y: "b", z: false},
    {x: 3, y: "c", z: true},
    {x: 4, y: "d", z: false}
];

let computed_data = [
    {x: 1, y: 2},
    {x: 2, y: 4},
    {x: 3, y: 6},
    {x: 4, y: 8}
];

var col_data = {
    x: [1, 2, 3, 4],
    y: ["a", "b", "c", "d"],
    z: [true, false, true, false]
};

var meta = {
    x: "integer",
    y: "string",
    z: "boolean"
};

var data_2 = [
    {x: 3, y: "c", z: false},
    {x: 4, y: "d", z: true},
    {x: 5, y: "g", z: false},
    {x: 6, y: "h", z: true}
];

const arrow_result = [
    {f32: 1.5, f64: 1.5, i64: 1, i32: 1, i16: 1, i8: 1, bool: true, char: "a", dict: "a", datetime: +new Date("2018-01-25")},
    {f32: 2.5, f64: 2.5, i64: 2, i32: 2, i16: 2, i8: 2, bool: false, char: "b", dict: "b", datetime: +new Date("2018-01-26")},
    {f32: 3.5, f64: 3.5, i64: 3, i32: 3, i16: 3, i8: 3, bool: true, char: "c", dict: "c", datetime: +new Date("2018-01-27")},
    {f32: 4.5, f64: 4.5, i64: 4, i32: 4, i16: 4, i8: 4, bool: false, char: "d", dict: "d", datetime: +new Date("2018-01-28")},
    {f32: 5.5, f64: 5.5, i64: 5, i32: 5, i16: 5, i8: 5, bool: true, char: "d", dict: "d", datetime: +new Date("2018-01-29")}
];

const arrow_partial_result = [
    {f32: 1.5, f64: 1.5, i64: 1, i32: 1, i16: 1, i8: 1, bool: false, char: "a", dict: "a", datetime: +new Date("2018-01-25")},
    {f32: 2.5, f64: 2.5, i64: 2, i32: 2, i16: 2, i8: 2, bool: true, char: "b", dict: "b", datetime: +new Date("2018-01-26")},
    {f32: 3.5, f64: 3.5, i64: 3, i32: 3, i16: 3, i8: 3, bool: false, char: "c", dict: "c", datetime: +new Date("2018-01-27")},
    {f32: 4.5, f64: 4.5, i64: 4, i32: 4, i16: 4, i8: 4, bool: true, char: "d", dict: "d", datetime: +new Date("2018-01-28")},
    {f32: 5.5, f64: 5.5, i64: 5, i32: 5, i16: 5, i8: 5, bool: false, char: "d", dict: "d", datetime: +new Date("2018-01-29")}
];

const arrow_partial_missing_result = [
    {f32: 1.5, f64: 1.5, i64: 1, i32: 1, i16: 1, i8: 1, bool: false, char: "a", dict: "a", datetime: +new Date("2018-01-25")},
    {f32: 2.5, f64: 2.5, i64: 2, i32: 2, i16: 2, i8: 2, bool: false, char: "b", dict: "b", datetime: +new Date("2018-01-26")},
    {f32: 3.5, f64: 3.5, i64: 3, i32: 3, i16: 3, i8: 3, bool: false, char: "c", dict: "c", datetime: +new Date("2018-01-27")},
    {f32: 4.5, f64: 4.5, i64: 4, i32: 4, i16: 4, i8: 4, bool: false, char: "d", dict: "d", datetime: +new Date("2018-01-28")},
    {f32: 5.5, f64: 5.5, i64: 5, i32: 5, i16: 5, i8: 5, bool: false, char: "d", dict: "d", datetime: +new Date("2018-01-29")}
];

const arrow_indexed_result = [
    {f32: 1.5, f64: 1.5, i64: 1, i32: 1, i16: 1, i8: 1, bool: true, char: "a", dict: "a", datetime: +new Date("2018-01-25")},
    {f32: 2.5, f64: 2.5, i64: 2, i32: 2, i16: 2, i8: 2, bool: false, char: "b", dict: "b", datetime: +new Date("2018-01-26")},
    {f32: 3.5, f64: 3.5, i64: 3, i32: 3, i16: 3, i8: 3, bool: true, char: "c", dict: "c", datetime: +new Date("2018-01-27")},
    {f32: 5.5, f64: 5.5, i64: 5, i32: 5, i16: 5, i8: 5, bool: true, char: "d", dict: "d", datetime: +new Date("2018-01-29")}
];

module.exports = perspective => {
    describe("Removes", function() {
        it("after an `update()`", async function() {
            var table = perspective.table(meta, {index: "x"});
            table.update(data);
            var view = table.view();
            table.remove([1, 2]);
            let result = await view.to_json();
            expect(result.length).toEqual(2);
            expect(result).toEqual(data.slice(2, 4));
            view.delete();
            table.delete();
        });

        it("after a regular data load", async function() {
            var table = perspective.table(data, {index: "x"});
            var view = table.view();
            table.remove([1, 2]);
            let result = await view.to_json();
            expect(result.length).toEqual(2);
            expect(result).toEqual(data.slice(2, 4));
            view.delete();
            table.delete();
        });

        it("multiple single element removes", async function() {
            let table = perspective.table(meta, {index: "x"});
            for (let i = 0; i < 100; i++) {
                table.update([{x: i, y: "test", z: false}]);
            }
            for (let i = 1; i < 100; i++) {
                table.remove([i]);
            }
            let view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([{x: 0, y: "test", z: false}]);
            expect(result.length).toEqual(1);
            view.delete();
            table.delete();
        });
    });

    describe("Schema", function() {
        it("updates with columns not in schema", async function() {
            var table = perspective.table({x: "integer", y: "string"});
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([
                {x: 1, y: "a"},
                {x: 2, y: "b"},
                {x: 3, y: "c"},
                {x: 4, y: "d"}
            ]);
            view.delete();
            table.delete();
        });

        it("coerces to string", async function() {
            var table = perspective.table({x: "string", y: "string", z: "string"});
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([
                {x: "1", y: "a", z: "true"},
                {x: "2", y: "b", z: "false"},
                {x: "3", y: "c", z: "true"},
                {x: "4", y: "d", z: "false"}
            ]);
            view.delete();
            table.delete();
        });
    });

    describe("Updates", function() {
        it("Meta constructor then `update()`", async function() {
            var table = perspective.table(meta);
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });

        it("Meta constructor then column oriented `update()`", async function() {
            var table = perspective.table(meta);
            table.update(col_data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });

        it("Column oriented `update()` with columns in different order to schema", async function() {
            var table = perspective.table(meta);

            var reordered_col_data = {
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                x: [1, 2, 3, 4]
            };

            table.update(reordered_col_data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });

        it("Column data constructor then column oriented `update()`", async function() {
            var colUpdate = {
                x: [3, 4, 5],
                y: ["h", "i", "j"],
                z: [false, true, false]
            };

            var expected = [
                {x: 1, y: "a", z: true},
                {x: 2, y: "b", z: false},
                {x: 3, y: "h", z: false},
                {x: 4, y: "i", z: true},
                {x: 5, y: "j", z: false}
            ];

            var table = perspective.table(col_data, {index: "x"});
            table.update(colUpdate);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("`update()` unbound to table", async function() {
            var table = perspective.table(meta);
            var updater = table.update;
            updater(data);
            let view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });

        it("`update([])` does not error", async function() {
            let table = perspective.table(meta);
            let view = table.view();
            table.update([]);
            let result = await view.to_json();
            expect(result).toEqual([]);
            view.delete();
            table.delete();
        });

        it("Multiple `update()`s", async function() {
            var table = perspective.table(meta);
            table.update(data);
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data.concat(data));
            view.delete();
            table.delete();
        });

        it("`update()` called after `view()`", async function() {
            var table = perspective.table(meta);
            var view = table.view();
            table.update(data);
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });
    });

    describe("Arrow Updates", function() {
        it("arrow contructor then arrow `update()`", async function() {
            const arrow = arrows.test_arrow;
            var table = perspective.table(arrow.slice());
            table.update(arrow.slice());
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(arrow_result.concat(arrow_result));
            view.delete();
            table.delete();
        });

        it("non-arrow constructor then arrow `update()`", async function() {
            let table = perspective.table(arrow_result);
            let view = table.view();
            let generated_arrow = await view.to_arrow();
            table.update(generated_arrow);
            let result = await view.to_json();
            expect(result).toEqual(arrow_result.concat(arrow_result));
            view.delete();
            table.delete();
        });

        it("arrow dict contructor then arrow dict `update()`", async function() {
            var table = perspective.table(arrows.dict_arrow.slice());
            table.update(arrows.dict_update_arrow.slice());
            var view = table.view();
            let result = await view.to_columns();
            expect(result).toEqual({
                a: ["abc", "def", "def", null, "abc", null, "update1", "update2"],
                b: ["klm", "hij", null, "hij", "klm", "update3", null, "update4"]
            });
            view.delete();
            table.delete();
        });

        it("non-arrow constructor then arrow dict `update()`", async function() {
            let table = perspective.table({
                a: ["a", "b", "c"],
                b: ["d", "e", "f"]
            });
            let view = table.view();
            table.update(arrows.dict_update_arrow.slice());
            let result = await view.to_columns();
            expect(result).toEqual({
                a: ["a", "b", "c", null, "update1", "update2"],
                b: ["d", "e", "f", "update3", null, "update4"]
            });
            view.delete();
            table.delete();
        });

        it("arrow partial `update()` a single column", async function() {
            let table = perspective.table(arrows.test_arrow.slice(), {index: "i64"});
            table.update(arrows.partial_arrow.slice());
            const view = table.view();
            const result = await view.to_json();
            expect(result).toEqual(arrow_partial_result);
            view.delete();
            table.delete();
        });

        it("arrow partial `update()` a single column with missing rows", async function() {
            let table = perspective.table(arrows.test_arrow.slice(), {index: "i64"});
            table.update(arrows.partial_missing_rows_arrow.slice());
            const view = table.view();
            const result = await view.to_json();
            expect(result).toEqual(arrow_partial_missing_result);
            view.delete();
            table.delete();
        });

        it("schema constructor, then arrow `update()`", async function() {
            const table = perspective.table({
                a: "integer",
                b: "float",
                c: "string"
            });
            table.update(arrows.int_float_str_arrow.slice());
            const view = table.view();
            const size = await table.size();
            expect(size).toEqual(4);
            const result = await view.to_columns();
            expect(result).toEqual({
                a: [1, 2, 3, 4],
                b: [1.5, 2.5, 3.5, 4.5],
                c: ["a", "b", "c", "d"]
            });
            view.delete();
            table.delete();
        });

        it("schema constructor, then arrow dictionary `update()`", async function() {
            const table = perspective.table({
                a: "string",
                b: "string"
            });
            table.update(arrows.dict_arrow.slice());
            const view = table.view();
            const size = await table.size();
            expect(size).toEqual(5);
            const result = await view.to_columns();
            expect(result).toEqual({
                a: ["abc", "def", "def", null, "abc"],
                b: ["klm", "hij", null, "hij", "klm"]
            });
            view.delete();
            table.delete();
        });

        it.skip("schema constructor, then indexed arrow `update()`", async function() {
            const table = perspective.table(
                {
                    a: "integer",
                    b: "float",
                    c: "string"
                },
                {index: "a"}
            );

            table.update(arrows.int_float_str_arrow.slice());
            table.update(arrows.int_float_str_update_arrow.slice());
            const view = table.view();
            const result = await view.to_columns();
            expect(result).toEqual({
                a: [1, 2, 3, 4],
                b: [100.5, 2.5, 3.5, 400.5],
                c: ["x", "b", "c", "y"]
            });
            view.delete();
            table.delete();
        });

        it("schema constructor, then arrow stream and arrow file `update()`", async function() {
            const table = perspective.table({
                a: "integer",
                b: "float",
                c: "string"
            });

            table.update(arrows.int_float_str_arrow.slice());
            table.update(arrows.int_float_str_file_arrow.slice());
            const view = table.view();
            const result = await view.to_columns();
            expect(result).toEqual({
                a: [1, 2, 3, 4, 1, 2, 3, 4],
                b: [1.5, 2.5, 3.5, 4.5, 1.5, 2.5, 3.5, 4.5],
                c: ["a", "b", "c", "d", "a", "b", "c", "d"]
            });
            view.delete();
            table.delete();
        });
    });

    describe("Notifications", function() {
        it("`on_update()`", function(done) {
            var table = perspective.table(meta);
            var view = table.view();
            view.on_update(
                function(new_data) {
                    expect(new_data).toEqual(data);
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "cell"}
            );
            table.update(data);
        });

        it("`on_update` before and after `update()`", function(done) {
            var table = perspective.table(meta);
            var view = table.view();
            table.update(data);
            var ran = false;
            view.on_update(
                function(new_data) {
                    if (!ran) {
                        expect(new_data).toEqual(data);
                        ran = true;
                        view.delete();
                        table.delete();
                        done();
                    }
                },
                {mode: "cell"}
            );
            table.update(data);
        });

        it("`on_update(table.update) !`", function(done) {
            var table1 = perspective.table(meta);
            var table2 = perspective.table(meta);
            var view1 = table1.view();
            var view2 = table2.view();
            view1.on_update(
                async function(x) {
                    table2.update(x);
                    let result = await view2.to_json();
                    expect(result).toEqual(data);
                    view1.delete();
                    view2.delete();
                    table1.delete();
                    table2.delete();
                    done();
                },
                {mode: "cell"}
            );
            table1.update(data);
        });

        it("`on_update(table.update)` before and after `update()`", function(done) {
            var table1 = perspective.table(meta);
            var table2 = perspective.table(meta);
            var view1 = table1.view();
            var view2 = table2.view();

            table1.update(data);
            table2.update(data);
            view1.on_update(
                async function(x) {
                    table2.update(x);
                    let result = await view2.to_json();
                    expect(result).toEqual(data.concat(data));
                    view1.delete();
                    view2.delete();
                    table1.delete();
                    table2.delete();
                    done();
                },
                {mode: "cell"}
            );
            table1.update(data);
        });

        it("properly removes a failed update callback on a table", async function(done) {
            const table = perspective.table({x: "integer"});
            const view = table.view();
            let size = await table.size();
            let counter = 0;

            // when a callback throws, it should delete that callback
            view.on_update(() => {
                counter++;
                throw new Error("something went wrong!");
            });

            view.on_update(async () => {
                // failed callback gets removed; non-failing callback gets called
                let sz = await table.size();
                expect(counter).toEqual(1);
                expect(sz).toEqual(size++);
            });

            table.update([{x: 1}]);
            table.update([{x: 2}]);
            table.update([{x: 3}]);

            const view2 = table.view(); // create a new view to make sure we process every update transacation.
            const final_size = await table.size();
            expect(final_size).toEqual(3);

            view2.delete();
            view.delete();
            table.delete();
            done();
        });
    });

    describe("Limit", function() {
        it("{limit: 2} with table of size 4", async function() {
            var table = perspective.table(data, {limit: 2});
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data.slice(2));
            view.delete();
            table.delete();
        });

        it("{limit: 5} with 2 updates of size 4", async function() {
            var table = perspective.table(data, {limit: 5});
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(
                data
                    .slice(1)
                    .concat(data.slice(3, 4))
                    .concat(data.slice(0, 1))
            );
            view.delete();
            table.delete();
        });

        it("{limit: 1} with arrow update", async function() {
            const arrow = arrows.test_arrow.slice();
            var table = perspective.table(arrow, {limit: 1});
            table.update(arrow.slice());
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([arrow_result[arrow_result.length - 1]]);
            view.delete();
            table.delete();
        });
    });

    describe("Indexed", function() {
        it("{index: 'x'} (int)", async function() {
            var table = perspective.table(data, {index: "x"});
            var view = table.view();
            table.update(data);
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });

        it("{index: 'y'} (string)", async function() {
            var table = perspective.table(data, {index: "y"});
            var view = table.view();
            table.update(data);
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });

        it("{index: 'x'} (int) with null and 0", async function() {
            const data = {
                x: [0, 1, null, 2, 3],
                y: ["a", "b", "c", "d", "e"]
            };
            const table = perspective.table(data, {index: "x"});
            const view = table.view();
            const result = await view.to_columns();
            expect(result).toEqual({
                x: [null, 0, 1, 2, 3], // null before 0
                y: ["c", "a", "b", "d", "e"]
            });
            view.delete();
            table.delete();
        });

        it("{index: 'y'} (str) with null and empty string", async function() {
            const data = {
                x: [0, 1, 2, 3, 4],
                y: ["", "a", "b", "c", null]
            };
            const table = perspective.table(data, {index: "y"});
            const view = table.view();
            const result = await view.to_columns();
            expect(result).toEqual({
                x: [4, 0, 1, 2, 3],
                y: [null, "", "a", "b", "c"] // null before empties
            });
            view.delete();
            table.delete();
        });

        it("{index: 'x'} (int) with null and 0, update", async function() {
            const data = {
                x: [0, 1, null, 2, 3],
                y: ["a", "b", "c", "d", "e"]
            };
            const table = perspective.table(data, {index: "x"});
            table.update({
                x: [null, 0],
                y: ["x", "y"]
            });
            const view = table.view();
            const result = await view.to_columns();
            expect(result).toEqual({
                x: [null, 0, 1, 2, 3], // null before 0
                y: ["x", "y", "b", "d", "e"]
            });
            view.delete();
            table.delete();
        });

        it("{index: 'y'} (str) with null and empty string, update", async function() {
            const data = {
                x: [0, 1, 2, 3, 4],
                y: ["", "a", "b", "c", null]
            };
            const table = perspective.table(data, {index: "y"});
            table.update({
                x: [5, 6],
                y: ["", null]
            });
            const view = table.view();
            const result = await view.to_columns();
            expect(result).toEqual({
                x: [6, 5, 1, 2, 3],
                y: [null, "", "a", "b", "c"] // null before empties
            });
            view.delete();
            table.delete();
        });

        it("{index: 'x'} (date) with null", async function() {
            const data = {
                x: ["10/30/2016", "11/1/2016", null, "1/1/2000"],
                y: [1, 2, 3, 4]
            };
            const table = perspective.table(
                {
                    x: "date",
                    y: "integer"
                },
                {index: "x"}
            );
            table.update(data);
            const view = table.view();
            const result = await view.to_columns();
            expect(result).toEqual({
                x: [null, new Date("2000-1-1").getTime(), new Date("2016-10-30").getTime(), new Date("2016-11-1").getTime()],
                y: [3, 4, 1, 2]
            });
            view.delete();
            table.delete();
        });

        it("{index: 'y'} (datetime) with datetime and null", async function() {
            const data = {
                x: ["2016-11-01 11:00:00", "2016-11-01 11:10:00", null, "2016-11-01 11:20:00"],
                y: [1, 2, 3, 4]
            };
            const table = perspective.table(
                {
                    x: "datetime",
                    y: "integer"
                },
                {index: "x"}
            );
            table.update(data);
            const view = table.view();
            const result = await view.to_columns();
            expect(result).toEqual({
                x: [null, new Date("2016-11-1 11:00:00").getTime(), new Date("2016-11-1 11:10:00").getTime(), new Date("2016-11-1 11:20:00").getTime()],
                y: [3, 1, 2, 4]
            });
            view.delete();
            table.delete();
        });

        it("Arrow with {index: 'i64'} (int)", async function() {
            var table = perspective.table(arrows.test_arrow.slice(), {index: "i64"});
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(arrow_result);
            view.delete();
            table.delete();
        });

        it("Arrow with {index: 'char'} (char)", async function() {
            var table = perspective.table(arrows.test_arrow.slice(), {index: "char"});
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(arrow_indexed_result);
            view.delete();
            table.delete();
        });

        it("Arrow with {index: 'dict'} (dict)", async function() {
            var table = perspective.table(arrows.test_arrow.slice(), {index: "dict"});
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(arrow_indexed_result);
            view.delete();
            table.delete();
        });

        it("multiple updates on {index: 'x'}", async function() {
            var table = perspective.table(data, {index: "x"});
            var view = table.view();
            table.update(data);
            table.update(data);
            table.update(data);
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });

        it("{index: 'x'} with overlap", async function() {
            var table = perspective.table(data, {index: "x"});
            var view = table.view();
            table.update(data);
            table.update(data_2);
            let result = await view.to_json();
            expect(result).toEqual(data.slice(0, 2).concat(data_2));
            view.delete();
            table.delete();
        });

        it("update and index (int)", function(done) {
            var table = perspective.table(meta, {index: "x"});
            var view = table.view();
            table.update(data);
            view.on_update(
                async function(new_data) {
                    expect(data_2).toEqual(new_data);
                    let json = await view.to_json();
                    expect(json).toEqual(data.slice(0, 2).concat(data_2));
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "cell"}
            );
            table.update(data_2);
        });

        it("update and index (string)", function(done) {
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(data);
            view.on_update(
                async function(new_data) {
                    expect(data_2).toEqual(new_data);
                    let json = await view.to_json();
                    expect(json).toEqual(data.slice(0, 2).concat(data_2));
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "cell"}
            );
            table.update(data_2);
        });

        it("update with depth expansion", async function() {
            var table = perspective.table(meta, {index: "y"});
            var view = table.view({
                row_pivots: ["z", "y"],
                columns: []
            });
            table.update(data);

            let result = await view.to_json();

            let expected = [
                {__ROW_PATH__: []},
                {__ROW_PATH__: [false]},
                {__ROW_PATH__: [false, "b"]},
                {__ROW_PATH__: [false, "d"]},
                {__ROW_PATH__: [true]},
                {__ROW_PATH__: [true, "a"]},
                {__ROW_PATH__: [true, "c"]}
            ];
            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("partial update", function(done) {
            var partial = [
                {x: 5, y: "a"},
                {y: "b", z: true}
            ];
            var expected = [
                {x: 5, y: "a", z: true},
                {x: 2, y: "b", z: true},
                {x: 3, y: "c", z: true},
                {x: 4, y: "d", z: false}
            ];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(data);
            view.on_update(
                async function(new_data) {
                    expect(new_data).toEqual(expected.slice(0, 2));
                    let json = await view.to_json();
                    expect(json).toEqual(expected);
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "cell"}
            );
            table.update(partial);
        });

        it("partial column oriented update", function(done) {
            var partial = {
                x: [5, undefined],
                y: ["a", "b"],
                z: [undefined, true]
            };

            var expected = [
                {x: 5, y: "a", z: true},
                {x: 2, y: "b", z: true},
                {x: 3, y: "c", z: true},
                {x: 4, y: "d", z: false}
            ];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(col_data);
            view.on_update(
                async function(new_data) {
                    expect(new_data).toEqual(expected.slice(0, 2));
                    let json = await view.to_json();
                    expect(json).toEqual(expected);
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "cell"}
            );
            table.update(partial);
        });

        it("partial column oriented update with entire columns missing", function(done) {
            var partial = {
                y: ["a", "b"],
                z: [false, true]
            };

            var expected = [
                {x: 1, y: "a", z: false},
                {x: 2, y: "b", z: true},
                {x: 3, y: "c", z: true},
                {x: 4, y: "d", z: false}
            ];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(col_data);
            view.on_update(
                async function(new_data) {
                    expect(new_data).toEqual(expected.slice(0, 2));
                    let json = await view.to_json();
                    expect(json).toEqual(expected);
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "cell"}
            );
            table.update(partial);
        });
    });

    describe("null handling", function() {
        it("recalculates sum aggregates when a null unsets a value", async function() {
            var table = perspective.table(
                [
                    {x: 1, y: 1},
                    {x: 2, y: 1}
                ],
                {index: "x"}
            );
            table.update([{x: 2, y: null}]);
            var view = table.view({
                row_pivots: ["x"],
                columns: ["y"]
            });
            let json = await view.to_json();
            expect(json).toEqual([
                {__ROW_PATH__: [], y: 1},
                {__ROW_PATH__: [1], y: 1},
                {__ROW_PATH__: [2], y: 0}
            ]);
            view.delete();
            table.delete();
        });

        it("can be removed entirely", async function() {
            var table = perspective.table([{x: 1, y: 1}], {index: "x"});
            table.update([{x: 1, y: null}]);
            table.update([{x: 1, y: 1}]);
            var view = table.view();
            let json = await view.to_json();
            expect(json).toEqual([{x: 1, y: 1}]);
            view.delete();
            table.delete();
        });

        it("partial update with null unsets value", async function() {
            var partial = [{x: null, y: "a", z: false}];
            var expected = [
                {x: null, y: "a", z: false},
                {x: 2, y: "b", z: false},
                {x: 3, y: "c", z: true},
                {x: 4, y: "d", z: false}
            ];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(data);
            table.update(partial);
            const json = await view.to_json();
            expect(json).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("update by adding rows (new pkeys) with partials/nulls", async function() {
            var update = [{x: null, y: "e", z: null}];
            var expected = [
                {x: 1, y: "a", z: true},
                {x: 2, y: "b", z: false},
                {x: 3, y: "c", z: true},
                {x: 4, y: "d", z: false},
                {x: null, y: "e", z: null}
            ];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(data);
            table.update(update);
            const json = await view.to_json();
            expect(json).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("partial column oriented update with null unsets value", async function() {
            var partial = {
                x: [null],
                y: ["a"]
            };

            var expected = [
                {x: null, y: "a", z: true},
                {x: 2, y: "b", z: false},
                {x: 3, y: "c", z: true},
                {x: 4, y: "d", z: false}
            ];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(col_data);
            table.update(partial);
            const json = await view.to_json();
            expect(json).toEqual(expected);
            view.delete();
            table.delete();
        });
    });

    describe("Viewport", function() {
        it("`height`", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    height: 2
                }
            });
            let result = await view.to_json();
            expect(result).toEqual(data.slice(0, 2));
            view.delete();
            table.delete();
        });

        it("`top`", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    top: 2
                }
            });
            let result = await view.to_json();
            expect(result).toEqual(data.slice(2));
            view.delete();
            table.delete();
        });

        it("`width`", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    width: 2
                }
            });
            var result2 = _.map(data, x => _.pick(x, "x", "y"));
            let result = await view.to_json();
            expect(result).toEqual(result2);
            view.delete();
            table.delete();
        });

        it("`left`", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    left: 1
                }
            });
            var result = _.map(data, function(x) {
                return _.pick(x, "y", "z");
            });
            let result2 = await view.to_json();
            expect(result).toEqual(result2);
            view.delete();
            table.delete();
        });

        it("All", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    top: 1,
                    left: 1,
                    width: 1,
                    height: 2
                }
            });
            var result = _.map(data, function(x) {
                return _.pick(x, "y");
            });
            let result2 = await view.to_json();
            expect(result2).toEqual(result.slice(1, 3));
            view.delete();
            table.delete();
        });
    });

    describe("computed updates", function() {
        it("partial update on column from schema", async function() {
            let table = perspective.table({x: "integer", y: "integer"});
            let table2 = table.add_computed([
                {
                    column: "multiply",
                    type: "integer",
                    computed_function_name: "*",
                    inputs: ["x", "y"]
                }
            ]);
            table2.update(computed_data);
            table2.update([
                {__INDEX__: 0, x: 10},
                {__INDEX__: 2, x: 10}
            ]);
            let view = table2.view();
            let json = await view.to_json();
            expect(json).toEqual([
                {x: 10, y: 2, multiply: 20},
                {x: 2, y: 4, multiply: 8},
                {x: 10, y: 6, multiply: 60},
                {x: 4, y: 8, multiply: 32}
            ]);
        });

        it("partial update on single computed source column", async function() {
            let table = perspective.table(computed_data);
            let table2 = table.add_computed([
                {
                    column: "multiply",
                    computed_function_name: "*",
                    inputs: ["x", "y"]
                }
            ]);
            table2.update([{__INDEX__: 0, x: 10}]);
            let view = table2.view();
            let json = await view.to_json();
            expect(json).toEqual([
                {x: 10, y: 2, multiply: 20},
                {x: 2, y: 4, multiply: 8},
                {x: 3, y: 6, multiply: 18},
                {x: 4, y: 8, multiply: 32}
            ]);
        });

        it("partial update on non-contiguous computed source columns", async function() {
            let table = perspective.table(computed_data);
            let table2 = table.add_computed([
                {
                    column: "multiply",
                    computed_function_name: "*",
                    inputs: ["x", "y"]
                }
            ]);
            table2.update([
                {__INDEX__: 0, x: 1, y: 10},
                {__INDEX__: 2, x: 3, y: 20}
            ]);
            let view = table2.view();
            let json = await view.to_json();
            expect(json).toEqual([
                {x: 1, y: 10, multiply: 10},
                {x: 2, y: 4, multiply: 8},
                {x: 3, y: 20, multiply: 60},
                {x: 4, y: 8, multiply: 32}
            ]);
        });

        it("partial update on non-contiguous computed source columns, indexed table", async function() {
            let table = perspective.table(computed_data, {index: "x"});
            let table2 = table.add_computed([
                {
                    column: "multiply",
                    computed_function_name: "*",
                    inputs: ["x", "y"]
                }
            ]);
            table2.update([
                {x: 1, y: 10},
                {x: 3, y: 20}
            ]);
            let view = table2.view();
            let json = await view.to_json();
            expect(json).toEqual([
                {x: 1, y: 10, multiply: 10},
                {x: 2, y: 4, multiply: 8},
                {x: 3, y: 20, multiply: 60},
                {x: 4, y: 8, multiply: 32}
            ]);
        });

        it("multiple partial update on single computed source column", async function() {
            let table = perspective.table(computed_data);
            let table2 = table.add_computed([
                {
                    column: "multiply",
                    computed_function_name: "*",
                    inputs: ["x", "y"]
                }
            ]);

            table2.update([
                {__INDEX__: 0, x: 10},
                {__INDEX__: 2, x: 10}
            ]);
            table2.update([
                {__INDEX__: 0, x: 20},
                {__INDEX__: 2, x: 20}
            ]);
            table2.update([
                {__INDEX__: 0, x: 30},
                {__INDEX__: 2, x: 30}
            ]);

            let view = table2.view();
            let json = await view.to_json();
            expect(json).toEqual([
                {x: 30, y: 2, multiply: 60},
                {x: 2, y: 4, multiply: 8},
                {x: 30, y: 6, multiply: 180},
                {x: 4, y: 8, multiply: 32}
            ]);
        });

        it("multiple computed columns with updates on source columns", async function() {
            let table = perspective.table(computed_data);

            let table2 = table.add_computed([
                {
                    column: "multiply",
                    computed_function_name: "*",
                    inputs: ["x", "y"]
                }
            ]);

            let table3 = table2.add_computed([
                {
                    column: "add",
                    computed_function_name: "+",
                    inputs: ["x", "y"]
                }
            ]);

            table3.update([
                {__INDEX__: 0, x: 5},
                {__INDEX__: 2, x: 10}
            ]);

            let view = table2.view({
                columns: ["add", "multiply"]
            });

            let json = await view.to_json();
            expect(json).toEqual([
                {add: 7, multiply: 10},
                {add: 6, multiply: 8},
                {add: 16, multiply: 60},
                {add: 12, multiply: 32}
            ]);
        });

        it("maintain previous computed columns when creating new ones", async function() {
            let table = perspective.table(computed_data);

            let table2 = table.add_computed([
                {
                    column: "multiply",
                    computed_function_name: "*",
                    inputs: ["x", "y"]
                }
            ]);

            let table3 = table2.add_computed([
                {
                    column: "add",
                    computed_function_name: "+",
                    inputs: ["x", "y"]
                }
            ]);

            let table4 = table3.add_computed([
                {
                    column: "subtract",
                    computed_function_name: "-",
                    inputs: ["y", "x"]
                }
            ]);

            let view = table4.view({
                columns: ["add", "subtract", "multiply"]
            });

            let json = await view.to_json();
            expect(json).toEqual([
                {add: 3, subtract: 1, multiply: 2},
                {add: 6, subtract: 2, multiply: 8},
                {add: 9, subtract: 3, multiply: 18},
                {add: 12, subtract: 4, multiply: 32}
            ]);
        });

        it("propagate updates to all computed columns", async function() {
            let table = perspective.table(computed_data, {index: "x"});

            let table2 = table.add_computed([
                {
                    column: "multiply",
                    computed_function_name: "*",
                    inputs: ["x", "y"]
                }
            ]);

            let table3 = table2.add_computed([
                {
                    column: "add",
                    computed_function_name: "+",
                    inputs: ["x", "y"]
                }
            ]);

            let table4 = table3.add_computed([
                {
                    column: "subtract",
                    computed_function_name: "-",
                    inputs: ["y", "x"]
                }
            ]);

            table4.update({x: [1, 2, 3, 4], y: [1, 2, 3, 4]});

            let view = table4.view({
                columns: ["add", "subtract", "multiply"]
            });

            let json = await view.to_json();
            expect(json).toEqual([
                {add: 2, subtract: 0, multiply: 1},
                {add: 4, subtract: 0, multiply: 4},
                {add: 6, subtract: 0, multiply: 9},
                {add: 8, subtract: 0, multiply: 16}
            ]);
        });

        it("propagate appends to all computed columns", async function() {
            let table = perspective.table(computed_data);

            let table2 = table.add_computed([
                {
                    column: "multiply",
                    computed_function_name: "*",
                    inputs: ["x", "y"]
                }
            ]);

            let table3 = table2.add_computed([
                {
                    column: "add",
                    computed_function_name: "+",
                    inputs: ["x", "y"]
                }
            ]);

            let table4 = table3.add_computed([
                {
                    column: "subtract",
                    computed_function_name: "-",
                    inputs: ["y", "x"]
                }
            ]);

            table4.update({x: [1, 2, 3, 4], y: [1, 2, 3, 4]});

            let view = table4.view({
                columns: ["add", "subtract", "multiply"]
            });

            let json = await view.to_json();
            expect(json).toEqual([
                {add: 3, subtract: 1, multiply: 2},
                {add: 6, subtract: 2, multiply: 8},
                {add: 9, subtract: 3, multiply: 18},
                {add: 12, subtract: 4, multiply: 32},
                {add: 2, subtract: 0, multiply: 1},
                {add: 4, subtract: 0, multiply: 4},
                {add: 6, subtract: 0, multiply: 9},
                {add: 8, subtract: 0, multiply: 16}
            ]);
        });
    });

    describe("implicit index", function() {
        it("should apply single partial update on unindexed table using row id from '__INDEX__'", async function() {
            let table = perspective.table(data);
            table.update([
                {
                    __INDEX__: 2,
                    y: "new_string"
                }
            ]);
            let view = table.view();
            let result = await view.to_json();

            let expected = JSON.parse(JSON.stringify(data));
            expected[2]["y"] = "new_string";

            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("should apply single multi-column partial update on unindexed table using row id from '__INDEX__'", async function() {
            let table = perspective.table(data);
            table.update([
                {
                    __INDEX__: 2,
                    y: "new_string",
                    x: 100
                }
            ]);
            let view = table.view();
            let result = await view.to_json();

            let expected = JSON.parse(JSON.stringify(data));
            expected[2]["x"] = 100;
            expected[2]["y"] = "new_string";

            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("should apply updates using '__INDEX__' on a table with explicit index set", async function() {
            let table = perspective.table(data, {index: "x"});
            table.update([
                {
                    __INDEX__: 2,
                    y: "new_string"
                }
            ]);
            let view = table.view();
            let result = await view.to_json();

            let expected = JSON.parse(JSON.stringify(data));
            expected[1]["y"] = "new_string";

            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("should apply multiple sequential updates using '__INDEX__' on a table with explicit index set", async function() {
            let table = perspective.table(data, {index: "x"});
            table.update([
                {
                    __INDEX__: 2,
                    y: "new_string"
                },
                {
                    __INDEX__: 3,
                    y: "new_string"
                }
            ]);
            let view = table.view();
            let result = await view.to_json();

            let expected = JSON.parse(JSON.stringify(data));
            expected[1]["y"] = "new_string";
            expected[2]["y"] = "new_string";

            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("should apply mulitple nonsequential updates using '__INDEX__' on a table with explicit index set", async function() {
            let table = perspective.table(data, {index: "x"});
            table.update([
                {
                    __INDEX__: 2,
                    y: "new_string"
                },
                {
                    __INDEX__: 4,
                    y: "new_string"
                }
            ]);
            let view = table.view();
            let result = await view.to_json();

            let expected = JSON.parse(JSON.stringify(data));
            expected[1]["y"] = "new_string";
            expected[3]["y"] = "new_string";

            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("should apply multiple sequential partial updates on unindexed table using '__INDEX__'", async function() {
            let table = perspective.table(data);
            table.update([
                {
                    __INDEX__: 0,
                    y: "new_string1"
                },
                {
                    __INDEX__: 1,
                    y: "new_string2"
                },
                {
                    __INDEX__: 2,
                    y: "new_string3"
                }
            ]);
            let view = table.view();
            let result = await view.to_json();

            let expected = JSON.parse(JSON.stringify(data));
            expected[0]["y"] = "new_string1";
            expected[1]["y"] = "new_string2";
            expected[2]["y"] = "new_string3";

            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("should correctly apply multiple out-of-sequence partial updates on unindexed table using '__INDEX__'", async function() {
            let table = perspective.table(data);
            table.update([
                {
                    __INDEX__: 0,
                    y: "new_string1"
                },
                {
                    __INDEX__: 2,
                    y: "new_string3"
                },
                {
                    __INDEX__: 3,
                    y: "new_string4"
                },
                {
                    __INDEX__: 1,
                    y: "new_string2"
                }
            ]);
            let view = table.view();
            let result = await view.to_json();

            let expected = JSON.parse(JSON.stringify(data));
            expected[0]["y"] = "new_string1";
            expected[1]["y"] = "new_string2";
            expected[2]["y"] = "new_string3";
            expected[3]["y"] = "new_string4";

            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("should stack multiple partial updates on unindexed table using the same '__INDEX__'", async function() {
            let table = perspective.table(data);
            table.update([
                {
                    __INDEX__: 0,
                    y: "new_string1"
                },
                {
                    __INDEX__: 0,
                    y: "new_string2"
                },
                {
                    __INDEX__: 0,
                    y: "new_string3"
                }
            ]);
            let view = table.view();
            let result = await view.to_json();

            let expected = JSON.parse(JSON.stringify(data));
            expected[0]["y"] = "new_string3";

            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("updates without '__INDEX' should append", async function() {
            let table = perspective.table(data);
            table.update([
                {
                    __INDEX__: 0,
                    y: "new_string"
                }
            ]);
            table.update([
                {
                    y: "new_string"
                }
            ]);
            let view = table.view();
            let result = await view.to_json();

            let expected = JSON.parse(JSON.stringify(data));
            expected[0]["y"] = "new_string";
            expected.push({x: null, y: "new_string", z: null});

            expect(result).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("should partial update on 1-sided views using implicit '__INDEX__'", async function() {
            let table = perspective.table(data);
            let view = table.view({
                row_pivots: ["x"]
            });

            table.update([
                {
                    __INDEX__: 0,
                    x: 100
                }
            ]);

            let result = await view.to_json();
            // update should be applied properly
            expect(result).toEqual([
                {__ROW_PATH__: [], x: 109, y: 4, z: 4},
                {__ROW_PATH__: [2], x: 2, y: 1, z: 1},
                {__ROW_PATH__: [3], x: 3, y: 1, z: 1},
                {__ROW_PATH__: [4], x: 4, y: 1, z: 1},
                {__ROW_PATH__: [100], x: 100, y: 1, z: 1}
            ]);

            // check that un-pivoted view reflects data correctly
            let view2 = table.view();
            let result2 = await view2.to_json();
            let expected = JSON.parse(JSON.stringify(data));
            expected[0]["x"] = 100;

            expect(result2).toEqual(expected);

            view.delete();
            view2.delete();
            table.delete();
        });

        it("should partial update on 2-sided views using implicit '__INDEX__'", async function() {
            let table = perspective.table(data);
            let view = table.view({
                row_pivots: ["x"],
                column_pivots: ["y"]
            });

            table.update([
                {
                    __INDEX__: 0,
                    x: 100
                }
            ]);

            let result = await view.to_json();
            // update should be applied properly
            expect(result).toEqual([
                {__ROW_PATH__: [], "a|x": 100, "a|y": 1, "a|z": 1, "b|x": 2, "b|y": 1, "b|z": 1, "c|x": 3, "c|y": 1, "c|z": 1, "d|x": 4, "d|y": 1, "d|z": 1},
                {__ROW_PATH__: [2], "a|x": null, "a|y": null, "a|z": null, "b|x": 2, "b|y": 1, "b|z": 1, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null},
                {__ROW_PATH__: [3], "a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": 3, "c|y": 1, "c|z": 1, "d|x": null, "d|y": null, "d|z": null},
                {__ROW_PATH__: [4], "a|x": null, "a|y": null, "a|z": null, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": 4, "d|y": 1, "d|z": 1},
                {__ROW_PATH__: [100], "a|x": 100, "a|y": 1, "a|z": 1, "b|x": null, "b|y": null, "b|z": null, "c|x": null, "c|y": null, "c|z": null, "d|x": null, "d|y": null, "d|z": null}
            ]);

            // check that un-pivoted view reflects data correctly
            let view2 = table.view();
            let result2 = await view2.to_json();
            let expected = JSON.parse(JSON.stringify(data));
            expected[0]["x"] = 100;

            expect(result2).toEqual(expected);

            view.delete();
            view2.delete();
            table.delete();
        });
    });

    describe("Remove update", function() {
        it("Should remove a single update", function(done) {
            const cb1 = jest.fn();
            const cb2 = () => {
                expect(cb1).toBeCalledTimes(0);
                setTimeout(() => {
                    view.delete();
                    table.delete();
                    done();
                }, 0);
            };
            const table = perspective.table(meta);
            const view = table.view();
            view.on_update(cb1);
            view.on_update(cb2);
            view.remove_update(cb1);
            table.update(data);
        });

        it("Should remove multiple updates", function(done) {
            const cb1 = jest.fn();
            const cb2 = jest.fn();
            const cb3 = function() {
                // cb2 should have been called
                expect(cb1).toBeCalledTimes(0);
                expect(cb2).toBeCalledTimes(0);
                setTimeout(() => {
                    view.delete();
                    table.delete();
                    done();
                }, 0);
            };

            const table = perspective.table(meta);
            const view = table.view();
            view.on_update(cb1);
            view.on_update(cb2);
            view.on_update(cb3);
            view.remove_update(cb1);
            view.remove_update(cb2);
            table.update(data);
        });
    });
};
