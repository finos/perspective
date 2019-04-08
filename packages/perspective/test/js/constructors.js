/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const fs = require("fs");
const path = require("path");
const papaparse = require("papaparse");
const moment = require("moment");
const arrow = fs.readFileSync(path.join(__dirname, "..", "arrow", "test-null.arrow")).buffer;
const chunked = fs.readFileSync(path.join(__dirname, "..", "arrow", "chunked.arrow")).buffer;

var data = [{x: 1, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];

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

var data_3 = [{w: 1.5, x: 1, y: "a", z: true}, {w: 2.5, x: 2, y: "b", z: false}, {w: 3.5, x: 3, y: "c", z: true}, {w: 4.5, x: 4, y: "d", z: false}];

var data_7 = {
    w: [1.5, 2.5, 3.5, 4.5],
    x: [1, 2, 3, 4],
    y: ["a", "b", "c", "d"],
    z: [true, false, true, false]
};

var int_in_string = [{a: "1"}, {a: "2"}, {a: "12345"}];

var float_in_string = [{a: "1.5"}, {a: "2.5"}, {a: "12345.56789"}];

var meta_3 = {
    w: "float",
    x: "integer",
    y: "string",
    z: "boolean"
};

let column_meta = [{name: "x", type: "integer", computed: undefined}, {name: "y", type: "string", computed: undefined}, {name: "z", type: "boolean", computed: undefined}];

var arrow_result = [
    {
        f32: 1.5,
        f64: 1.5,
        i64: 1,
        i32: 1,
        i16: 1,
        i8: 1,
        bool: true,
        char: "a",
        dict: "a",
        "datetime(ms)": +new Date("2018-01-25"),
        "datetime(us)": +new Date("2018-01-25"),
        "datetime(ns)": +new Date("2018-01-25")
    },
    {
        f32: 2.5,
        f64: 2.5,
        i64: 2,
        i32: 2,
        i16: 2,
        i8: 2,
        bool: false,
        char: "b",
        dict: "b",
        "datetime(ms)": +new Date("2018-01-26"),
        "datetime(us)": +new Date("2018-01-26"),
        "datetime(ns)": +new Date("2018-01-26")
    },
    {
        f32: 3.5,
        f64: 3.5,
        i64: 3,
        i32: 3,
        i16: 3,
        i8: 3,
        bool: true,
        char: "c",
        dict: "c",
        "datetime(ms)": +new Date("2018-01-27"),
        "datetime(us)": +new Date("2018-01-27"),
        "datetime(ns)": +new Date("2018-01-27")
    },
    {
        f32: 4.5,
        f64: 4.5,
        i64: 4,
        i32: 4,
        i16: 4,
        i8: 4,
        bool: false,
        char: "",
        dict: "",
        "datetime(ms)": +new Date("2018-01-28"),
        "datetime(us)": +new Date("2018-01-28"),
        "datetime(ns)": +new Date("2018-01-28")
    },
    {
        f32: null,
        f64: null,
        i64: null,
        i32: null,
        i16: null,
        i8: null,
        bool: null,
        char: null,
        dict: null,
        "datetime(ms)": null,
        "datetime(us)": null,
        "datetime(ns)": null
    }
];

var dt = () => {
    let dt = new Date();
    dt.setHours(4);
    dt.setMinutes(12);
    return dt;
};

var data_4 = [{v: dt()}];

var data_5 = [{v: "11-09-2017"}];

var meta_4 = {v: "datetime"};

var csv = "x,y,z\n1,a,true\n2,b,false\n3,c,true\n4,d,false";

var data_6 = [{x: "š"}];

var int_float_data = [{int: 1, float: 2.25}, {int: 2, float: 3.5}, {int: 3, float: 4.75}, {int: 4, float: 5.25}];
var int_float_string_data = [{int: 1, float: 2.25, string: "a"}, {int: 2, float: 3.5, string: "b"}, {int: 3, float: 4.75, string: "c"}, {int: 4, float: 5.25, string: "d"}];
var datetime_data = [{datetime: new Date(), int: 1}, {datetime: new Date(), int: 1}, {datetime: new Date(), int: 2}, {datetime: new Date(), int: 2}];

// utility for checking typed arrays
function validate_typed_array(typed_array, column_data) {
    let is_valid = true;
    for (let i = 0; i < typed_array.length; i++) {
        if (column_data[i] !== null) {
            if (typed_array[i] !== column_data[i]) {
                is_valid = false;
                break;
            }
        }
    }
    return is_valid;
}

module.exports = perspective => {
    describe("Execute", function() {
        it("serialized functions in a worker", async function() {
            var table = perspective.table({
                x: "integer",
                y: "string",
                z: "boolean"
            });
            table.execute(t => {
                t.update([{x: 1, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}]);
            });
            let view = table.view({});
            let js = await view.to_json();
            expect(js).toEqual([{x: 1, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}]);
            view.delete();
            table.delete();
        });
    });

    describe("Destructors", function() {
        it("calls delete() on table with no views", async function() {
            let table = perspective.table(data);
            await table.delete();
            expect(true).toEqual(true);
        });

        it("calls delete on a view, then a table", async function() {
            var table = perspective.table(data);
            var view = table.view();
            await view.delete();
            await table.delete();
            expect(true).toEqual(true);
        });

        it("calls delete on multiple views, then a table", async function() {
            var table = perspective.table(data);
            var view1 = table.view();
            var view2 = table.view();
            await view1.delete();
            await view2.delete();
            await table.delete();
            expect(true).toEqual(true);
        });
    });

    describe("Schema", function() {
        it("0-sided view", async function() {
            const table = perspective.table(int_float_string_data);
            const view = table.view();
            const schema = await view.schema();
            expect(schema).toEqual({int: "integer", float: "float", string: "string"});
            view.delete();
            table.delete();
        });

        it("0-sided view with columns selection", async function() {
            const table = perspective.table(int_float_string_data);
            const view = table.view({columns: ["float", "string"]});
            const schema = await view.schema();
            expect(schema).toEqual({float: "float", string: "string"});
            view.delete();
            table.delete();
        });
    });

    describe("Typed Arrays", function() {
        it("Int, 0-sided view", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view();
            const result = await view.col_to_js_typed_array("int");
            expect(result[0].byteLength).toEqual(16);
            view.delete();
            table.delete();
        });

        it("Float, 0-sided view", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view();
            const result = await view.col_to_js_typed_array("float");
            expect(result[0].byteLength).toEqual(32);
            view.delete();
            table.delete();
        });

        it("Datetime, 0-sided view", async function() {
            var table = perspective.table(datetime_data);
            var view = table.view();
            var schema = await view.schema();
            expect(schema).toEqual({datetime: "datetime", int: "integer"});
            const result = await view.col_to_js_typed_array("datetime");
            expect(result[0].byteLength).toEqual(32);
            view.delete();
            table.delete();
        });

        it("Int, 1-sided view", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({
                row_pivots: ["int"],
                columns: ["int", "float"]
            });
            const result = await view.col_to_js_typed_array("int");
            // should include aggregate row
            expect(result[0].byteLength).toEqual(20);
            view.delete();
            table.delete();
        });

        it("Float, 1-sided view", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({
                row_pivots: ["int"],
                columns: ["int", "float"]
            });
            const result = await view.col_to_js_typed_array("float");
            expect(result[0].byteLength).toEqual(40);
            view.delete();
            table.delete();
        });

        it("Datetime, 1-sided view", async function() {
            var table = perspective.table(datetime_data);
            var view = table.view({
                row_pivots: ["int"],
                columns: ["datetime"],
                aggregates: {datetime: "high"}
            });
            const result = await view.col_to_js_typed_array("datetime");
            expect(result[0].byteLength).toEqual(24);
            view.delete();
            table.delete();
        });

        it("Int, 2-sided view with row pivot", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({
                column_pivots: ["float"],
                row_pivots: ["int"],
                columns: ["int", "float"]
            });
            const result = await view.col_to_js_typed_array("3.5|int");
            expect(result[0].byteLength).toEqual(20);
            view.delete();
            table.delete();
        });

        it("Float, 2-sided view with row pivot", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({
                column_pivots: ["float"],
                row_pivots: ["int"],
                columns: ["int", "float"]
            });
            const result = await view.col_to_js_typed_array("3.5|float");
            expect(result[0].byteLength).toEqual(40);
            view.delete();
            table.delete();
        });

        it("Int, 2-sided view, no row pivot", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({column_pivots: ["float"]});
            const result = await view.col_to_js_typed_array("3.5|int");
            // bytelength should not include the aggregate row
            expect(result[0].byteLength).toEqual(16);
            view.delete();
            table.delete();
        });

        it("Float, 2-sided view, no row pivot", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({column_pivots: ["float"]});
            const result = await view.col_to_js_typed_array("3.5|float");
            expect(result[0].byteLength).toEqual(32);
            view.delete();
            table.delete();
        });

        it("Symmetric output with to_columns, 0-sided", async function() {
            let table = perspective.table(int_float_data);
            let view = table.view();
            let cols = await view.to_columns();

            for (let col in cols) {
                let ta = await view.col_to_js_typed_array(col);
                let column = cols[col];
                if (ta !== undefined && column !== undefined) {
                    expect(ta[0].length).toEqual(cols[col].length);
                    expect(validate_typed_array(ta[0], cols[col])).toEqual(true);
                }
            }
            view.delete();
            table.delete();
        });

        it("Symmetric output with to_columns, 1-sided", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                row_pivots: ["int"],
                columns: ["int", "float"]
            });
            let cols = await view.to_columns();

            for (let col in cols) {
                let ta = await view.col_to_js_typed_array(col);
                let column = cols[col];
                if (ta !== undefined && column !== undefined) {
                    expect(ta[0].length).toEqual(cols[col].length);
                    expect(validate_typed_array(ta[0], cols[col])).toEqual(true);
                }
            }
            view.delete();
            table.delete();
        });
    });

    describe("Formatters", function() {
        it("Serializes a simple view to CSV", async function() {
            var table = perspective.table(data);
            var view = table.view({});
            var answer = `x,y,z\r\n1,a,true\r\n2,b,false\r\n3,c,true\r\n4,d,false`;
            let result = await view.to_csv();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("Serializes 1 sided view to CSV", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivots: ["z"],
                columns: ["x"]
            });
            var answer = `__ROW_PATH__,x\r\n,10\r\nfalse,6\r\ntrue,4`;
            let result = await view.to_csv();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("Serializes a 2 sided view to CSV", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivots: ["z"],
                column_pivots: ["y"],
                columns: ["x"]
            });
            var answer = `__ROW_PATH__,\"a,x\",\"b,x\",\"c,x\",\"d,x\"\r\n,1,2,3,4\r\nfalse,,2,,4\r\ntrue,1,,3,`;
            let result = await view.to_csv();
            expect(result).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("Serializes a simple view to column-oriented JSON", async function() {
            var table = perspective.table(data_3);
            var view = table.view({});
            let result = await view.to_columns();
            expect(result).toEqual(data_7);
            view.delete();
            table.delete();
        });
    });

    describe("CSV parsing", function() {
        it("Does not lose leading 0's when a CSV column is declared as a string", async function() {
            let table = perspective.table({x: "string", y: "integer"});
            table.update("x,y\n000123,000123");
            let view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([{x: "000123", y: 123}]);
            view.delete();
            table.delete();
        });
    });

    describe("Constructors", function() {
        it("JSON constructor", async function() {
            var table = perspective.table(data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });

        it("JSON column oriented constructor", async function() {
            var table = perspective.table(col_data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data);
            view.delete();
            table.delete();
        });

        it("Arrow constructor", async function() {
            var table = perspective.table(arrow.slice());
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(arrow_result);
            view.delete();
            table.delete();
        });

        it("Arrow (chunked) constructor", async function() {
            var table = perspective.table(chunked.slice());
            var view = table.view();
            let result = await view.to_json();
            expect(result.length).toEqual(10);
            view.delete();
            table.delete();
        });

        it("CSV constructor", async function() {
            var table = perspective.table(csv);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(papaparse.parse(csv, {header: true, dynamicTyping: true}).data);
            view.delete();
            table.delete();
        });

        it("Meta constructor", async function() {
            var table = perspective.table(meta);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([]);
            view.delete();
            table.delete();
        });

        it("Handles floats", async function() {
            var table = perspective.table(data_3);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data_3);
            view.delete();
            table.delete();
        });

        it("Infers ints wrapped in strings", async function() {
            var table = perspective.table(int_in_string);
            var view = table.view();
            let result = await view.schema();
            expect(result).toEqual({a: "integer"});
            view.delete();
            table.delete();
        });

        it("Infers floats wrapped in strings", async function() {
            var table = perspective.table(float_in_string);
            var view = table.view();
            let result = await view.schema();
            expect(result).toEqual({a: "float"});
            view.delete();
            table.delete();
        });

        it("Infers correct type for empty string columns", async function() {
            var table = perspective.table([{x: "", y: 1}, {x: "", y: 2}, {x: "", y: 3}, {x: "", y: 4}]);
            var view = table.view();
            let result = await view.schema();
            expect(result).toEqual({x: "string", y: "integer"});
            view.delete();
            table.delete();
        });

        it("Returns the correct number of rows for column-only views", async function() {
            var table = perspective.table(data);
            var view = table.view();
            var num_rows = await view.num_rows();
            var view2 = table.view({
                column_pivots: ["x"]
            });
            var num_rows_col_only = await view2.num_rows();
            expect(num_rows_col_only).toEqual(num_rows);
            view.delete();
            view2.delete();
            table.delete();
        });

        it.skip("Handles inconsistent rows with same width", async function() {
            const int_to_float = [{x: 1, y: 2}, {y: 2, z: 3}];
            var table = perspective.table(int_to_float);
            var view = table.view();
            var json = await view.to_json();
            expect(json).toEqual([{x: 1, y: 2, z: null}, {x: null, y: 2, z: 3}]);
            view.delete();
            table.delete();
        });

        it.skip("Handles inconsistent rows", async function() {
            const int_to_float = [{x: 1}, {y: 2, z: 3}];
            var table = perspective.table(int_to_float);
            var schema = await table.schema();
            expect(schema).toEqual({x: "integer", y: "integer", z: "integer"});
            var view = table.view();
            var json = await view.to_json();
            expect(json).toEqual([{x: 1, y: null, z: null}, {x: null, y: 2, z: 3}]);
            view.delete();
            table.delete();
        });

        it("Upgrades integer columns to strings", async function() {
            const int_to_float = {
                a: [1, 2, 3, "x", "y"]
            };

            var table = perspective.table(int_to_float);
            var schema_1 = await table.schema();
            expect(schema_1["a"]).toEqual("string");
            var view = table.view();
            var json = await view.to_json();
            expect(json).toEqual([{a: "1"}, {a: "2"}, {a: "3"}, {a: "x"}, {a: "y"}]);
            view.delete();
            table.delete();
        });

        it("Upgrades integer columns with values beyond max/min_int to float", async function() {
            const int_to_float = {
                a: [1, 2, 3, 2147483667, 5]
            };

            var table = perspective.table(int_to_float);
            var view = table.view();
            var json = await view.to_columns();
            expect(json).toEqual(int_to_float);
            var schema_2 = await table.schema();
            expect(schema_2["a"]).toEqual("float");
            view.delete();
            table.delete();
        });

        // This currently won't work, and I'm unclear we want it to - upgrading
        // ths column in place is easy, but once the gnode and potentially
        // contexts have been created, this becomes much more difficult.
        it.skip("Upgrades integer columns with values beyond max/min_int to float", async function() {
            const schema = {
                a: "integer"
            };

            const int_to_float = {
                a: [1, 2, 3, 2147483667, 5]
            };

            var table = perspective.table(schema);
            var schema_1 = await table.schema();
            expect(schema_1["a"]).toEqual("integer");

            table.update(int_to_float);

            var schema_2 = await table.schema();
            expect(schema_2["a"]).toEqual("float");
            table.delete();
        });

        it("Does not infer float column as integers", async function() {
            const int_to_float = [];
            for (let x = 0; x < 200; x++) {
                int_to_float.push({a: 1});
            }
            int_to_float.push({a: 2147483667});

            var table = perspective.table(int_to_float);
            var schema_1 = await table.schema();
            expect(schema_1["a"]).toEqual("float");
            let view = table.view();
            var data = await view.to_json();
            expect(data).toEqual(int_to_float);

            view.delete();
            table.delete();
        });

        it("has correct size", async function() {
            var table = perspective.table(data);
            let result = await table.size();
            expect(result).toEqual(4);
            table.delete();
        });

        it("has a schema", async function() {
            var table = perspective.table(data);
            let result = await table.schema();
            expect(result).toEqual(meta);
            table.delete();
        });

        it("has columns", async function() {
            var table = perspective.table(data);
            let result = await table.columns();
            expect(result).toEqual(["x", "y", "z"]);
            table.delete();
        });

        it("Handles floats schemas", async function() {
            var table = perspective.table(data_3);
            let result = await table.schema();
            expect(result).toEqual(meta_3);
            table.delete();
        });

        it("Generates correct date schemas", async function() {
            var table = perspective.table(data_4);
            let result = await table.schema();
            expect(result).toEqual(meta_4);
            table.delete();
        });

        it("Handles date updates when constructed from a schema", async function() {
            var table = perspective.table(meta_4);
            table.update(data_4);
            let view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([{v: +data_4[0]["v"]}]);
            view.delete();
            table.delete();
        });

        it("Handles datetime values", async function() {
            var table = perspective.table(data_4);
            let view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([{v: +data_4[0]["v"]}]);
            view.delete();
            table.delete();
        });

        it("Handles datetime strings", async function() {
            var table = perspective.table(data_5);
            let view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([{v: +moment(data_5[0]["v"], "MM-DD-YYYY")}]);
            view.delete();
            table.delete();
        });

        it("Handles datetime values with mixed formats", async function() {
            var table = perspective.table({datetime: "datetime"});
            table.update([{datetime: new Date(1549257586108)}, {datetime: "2019-01-30"}, {datetime: 11}]);
            let view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([{datetime: 1549257586108}, {datetime: 1548806400000}, {datetime: 11}]);
            view.delete();
            table.delete();
        });

        it("Handles date values", async function() {
            var table = perspective.table({v: "date"});
            table.update(data_4);
            let view = table.view();
            let result = await view.to_json();
            let d = new Date(data_4[0]["v"]);
            d.setHours(0);
            d.setMinutes(0);
            d.setSeconds(0);
            d.setMilliseconds(0);
            expect(result).toEqual([{v: +d}]);
            view.delete();
            table.delete();
        });

        it("Handles utf16 column names", async function() {
            var table = perspective.table({š: [1, 2, 3]});
            let view = table.view({});
            let result = await view.schema();
            expect(result).toEqual({š: "integer"});
            view.delete();
            table.delete();
        });

        it("Handles utf16", async function() {
            var table = perspective.table(data_6);
            let view = table.view({});
            let result = await view.to_json();
            expect(result).toEqual(data_6);
            view.delete();
            table.delete();
        });

        describe("Datetime constructors", function() {
            it("Correctly parses an ISO-8601 formatted string", async function() {
                let table = perspective.table({d: ["2011-10-05T14:48:00.000Z"]});
                let view = table.view({});
                let result = await view.schema();
                expect(result["d"]).toEqual("datetime");
            });

            it("Correctly parses an ISO-8601 formatted string with timezone", async function() {
                let table = perspective.table({d: ["2008-09-15T15:53:00+05:00"]});
                let view = table.view({});
                let result = await view.schema();
                expect(result["d"]).toEqual("datetime");
            });

            it("Correctly parses an RFC 2822 formatted string", async function() {
                let table = perspective.table({d: ["Wed, 05 Oct 2011 22:26:12 -0400"]});
                let view = table.view({});
                let result = await view.schema();
                expect(result["d"]).toEqual("datetime");
            });

            // Not all formats covered by JS parser, test intended for C++ parser
            it.skip("Correctly parses all m-d-y formatted strings", async function() {
                let datestrings = ["08-15-2009", "08/15/2009", "08-15-2009", "02 28 2009", "08/15/10", "31 08 2009"];
                for (let str of datestrings) {
                    let table = perspective.table({d: [str]});
                    let view = table.view({});
                    let result = await view.schema();
                    expect(result["d"]).toEqual("datetime");
                }
            });

            // Only implemented in the C++ date parser - skip
            it.skip("Correctly parses a 'dd mm yyyy' formatted string", async function() {
                let table = perspective.table({d: ["15 08 08"]});
                let view = table.view({});
                let result = await view.schema();
                expect(result["d"]).toEqual("datetime");
            });

            it("Does not (for now) parse a date string in non-US formatting", async function() {
                let table = perspective.table({d: ["2018/07/30"]});
                let view = table.view({});
                let result = await view.schema();
                expect(result["d"]).toEqual("string");
            });

            it("Does not mistakenly parse a date-like string", async function() {
                let table = perspective.table({d: ["Jan 14, 14"]});
                let view = table.view({});
                let result = await view.schema();
                expect(result["d"]).toEqual("string");
            });
        });

        describe("Computed constructors", function() {
            it("Computed column of arity 0", async function() {
                var table = perspective.table(data);

                let table2 = table.add_computed([
                    {
                        column: "const",
                        type: "integer",
                        func: () => 1,
                        inputs: []
                    }
                ]);
                let view = table2.view({columns: ["const"], aggregates: {const: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{const: 1}, {const: 1}, {const: 1}, {const: 1}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2", async function() {
                var table = perspective.table(data_3);

                let table2 = table.add_computed([
                    {
                        column: "ratio",
                        type: "float",
                        func: (w, x) => w / x,
                        inputs: ["w", "x"]
                    }
                ]);
                let view = table2.view({columns: ["ratio"], aggregates: {ratio: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{ratio: 1.5}, {ratio: 1.25}, {ratio: 1.1666666666666667}, {ratio: 1.125}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2 with updates on non-dependent columns", async function() {
                var meta = {
                    w: "float",
                    x: "float",
                    y: "string",
                    z: "boolean"
                };
                var table = perspective.table(meta, {index: "y"});
                let table2 = table.add_computed([
                    {
                        column: "ratio",
                        type: "float",
                        func: (w, x) => w / x,
                        inputs: ["w", "x"]
                    }
                ]);

                table2.update(data_3);

                let delta_upd = [{y: "a", z: false}, {y: "b", z: true}, {y: "c", z: false}, {y: "d", z: true}];
                table2.update(delta_upd);
                let view = table2.view({columns: ["y", "ratio"], aggregates: {y: "count", ratio: "count"}});
                let result = await view.to_json();
                let expected = [{y: "a", ratio: 1.5}, {y: "b", ratio: 1.25}, {y: "c", ratio: 1.1666666666666667}, {y: "d", ratio: 1.125}];
                expect(result).toEqual(expected);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("String computed column of arity 1", async function() {
                var table = perspective.table(data);

                let table2 = table.add_computed([
                    {
                        column: "yes/no",
                        type: "string",
                        func: z => (z === true ? "yes" : "no"),
                        inputs: ["z"]
                    }
                ]);
                let view = table2.view({columns: ["yes/no"], aggregates: {"yes/no": "count"}});
                let result = await view.to_json();
                let expected = [{"yes/no": "yes"}, {"yes/no": "no"}, {"yes/no": "yes"}, {"yes/no": "no"}];
                expect(result).toEqual(expected);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed schema returns names and metadata", async function() {
                const func = i => i + 2;

                const computation = {
                    name: "+2",
                    input_type: "integer",
                    return_type: "integer",
                    func: func.toString()
                };

                const table = perspective.table(data);

                const table2 = table.add_computed([
                    {
                        computation: computation,
                        column: "plus2",
                        type: "integer",
                        inputs: ["x"],
                        input_type: "integer",
                        func: func
                    }
                ]);

                const result = await table2.computed_schema();
                const expected = {
                    plus2: {
                        input_columns: ["x"],
                        input_type: "integer",
                        computation: computation,
                        type: "integer"
                    }
                };

                expect(result).toEqual(expected);
                table2.delete();
                table.delete();
            });
        });

        it("Column metadata returns names and type", async function() {
            let table = perspective.table(data);
            let result = await table.column_metadata();
            expect(result).toEqual(column_meta);
            table.delete();
        });

        it("allocates a large tables", async function() {
            function makeid() {
                var text = "";
                var possible = Array.from(Array(26).keys()).map(x => String.fromCharCode(x + 65));
                for (var i = 0; i < 15; i++) text += possible[Math.floor(Math.random() * possible.length)];
                return text;
            }
            let data = [];
            for (let i = 0; i < 35000; i++) {
                data.push([{a: makeid(), b: makeid(), c: makeid(), d: makeid(), w: i + 0.5, x: i, y: makeid()}]);
            }
            let table = perspective.table(data);
            let view = table.view();
            let result = await view.to_json();
            expect(result.length).toEqual(35000);
            view.delete();
            table.delete();
        }, 3000);
    });
};
