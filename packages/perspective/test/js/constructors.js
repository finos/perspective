/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const papaparse = require("papaparse");
const moment = require("moment");
const arrow = require("../arrow/test-null.arrow");
const chunked = require("../arrow/chunked.arrow");

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

var dt = new Date();
dt.setHours(4);
dt.setMinutes(12);
var data_4 = [{v: dt}];

var data_5 = [{v: "11-09-2017"}];

var meta_4 = {v: "datetime"};

var csv = "x,y,z\n1,a,true\n2,b,false\n3,c,true\n4,d,false";

var data_6 = [{x: "š"}];

var int_float_data = [{int: 1, float: 2.25}, {int: 2, float: 3.5}, {int: 3, float: 4.75}, {int: 4, float: 5.25}];
var int_float_string_data = [{int: 1, float: 2.25, string: "a"}, {int: 2, float: 3.5, string: "b"}, {int: 3, float: 4.75, string: "c"}, {int: 4, float: 5.25, string: "d"}];
var datetime_data = [{datetime: +new Date(), int: 1}, {datetime: +new Date(), int: 1}, {datetime: +new Date(), int: 2}, {datetime: +new Date(), int: 2}];

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

    describe("Typed Arrays", function() {
        it("Int, 0-sided view", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view();
            const result = await view.col_to_js_typed_array("int");
            expect(result.byteLength).toEqual(16);
            view.delete();
            table.delete();
        });

        it("Float, 0-sided view", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view();
            const result = await view.col_to_js_typed_array("float");
            expect(result.byteLength).toEqual(32);
            view.delete();
            table.delete();
        });

        it("Datetime, 0-sided view", async function() {
            var table = perspective.table(datetime_data);
            var view = table.view();
            const result = await view.col_to_js_typed_array("datetime");
            expect(result.byteLength).toEqual(32);
            view.delete();
            table.delete();
        });

        it("Int, 1-sided view", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({
                row_pivot: ["int"],
                aggregate: [{op: "sum", column: "int"}, {op: "sum", column: "float"}]
            });
            const result = await view.col_to_js_typed_array("int");
            // should include aggregate row
            expect(result.byteLength).toEqual(20);
            view.delete();
            table.delete();
        });

        it("Float, 1-sided view", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({
                row_pivot: ["int"],
                aggregate: [{op: "sum", column: "int"}, {op: "sum", column: "float"}]
            });
            const result = await view.col_to_js_typed_array("float");
            expect(result.byteLength).toEqual(40);
            view.delete();
            table.delete();
        });

        it("Datetime, 1-sided view", async function() {
            var table = perspective.table(datetime_data);
            var view = table.view({
                row_pivot: ["int"],
                aggregate: [{op: "high", column: "datetime"}]
            });
            const result = await view.col_to_js_typed_array("datetime");
            expect(result.byteLength).toEqual(24);
            view.delete();
            table.delete();
        });

        it("Int, 2-sided view with row pivot", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({
                column_pivot: ["float"],
                row_pivot: ["int"],
                aggregate: [{op: "sum", column: "int"}, {op: "sum", column: "float"}]
            });
            const result = await view.col_to_js_typed_array("3.5|int");
            expect(result.byteLength).toEqual(20);
            view.delete();
            table.delete();
        });

        it("Float, 2-sided view with row pivot", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({
                column_pivot: ["float"],
                row_pivot: ["int"],
                aggregate: [{op: "sum", column: "int"}, {op: "sum", column: "float"}]
            });
            const result = await view.col_to_js_typed_array("3.5|float");
            expect(result.byteLength).toEqual(40);
            view.delete();
            table.delete();
        });

        it("Int, 2-sided view, no row pivot", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({column_pivot: ["float"]});
            const result = await view.col_to_js_typed_array("3.5|int");
            // bytelength should not include the aggregate row
            expect(result.byteLength).toEqual(16);
            view.delete();
            table.delete();
        });

        it("Float, 2-sided view, no row pivot", async function() {
            var table = perspective.table(int_float_data);
            var view = table.view({column_pivot: ["float"]});
            const result = await view.col_to_js_typed_array("3.5|float");
            expect(result.byteLength).toEqual(32);
            view.delete();
            table.delete();
        });

        it("Undefined for non-int/float columns", async function() {
            var table = perspective.table(int_float_string_data);
            var view = table.view();
            const result = await view.col_to_js_typed_array("string");
            expect(result).toBeUndefined();
            view.delete();
            table.delete();
        });

        it("Symmetric output with to_columns, 0-sided", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view();
            let cols = await view.to_columns();

            for (let col in cols) {
                let ta = await view.col_to_js_typed_array(col);
                let column = cols[col];
                if (ta !== undefined && column !== undefined) {
                    expect(ta.length).toEqual(cols[col].length);
                    expect(validate_typed_array(ta, cols[col])).toEqual(true);
                }
            }
            view.delete();
            table.delete();
        });

        it("Symmetric output with to_columns, 1-sided", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                row_pivot: ["int"],
                aggregate: [{op: "sum", column: "int"}, {op: "sum", column: "float"}]
            });
            let cols = await view.to_columns();

            for (let col in cols) {
                let ta = await view.col_to_js_typed_array(col);
                let column = cols[col];
                if (ta !== undefined && column !== undefined) {
                    expect(ta.length).toEqual(cols[col].length);
                    expect(validate_typed_array(ta, cols[col])).toEqual(true);
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
            let result2 = await view.to_csv();
            expect(answer).toEqual(result2);
            view.delete();
            table.delete();
        });

        it("Serializes 1 sided view to CSV", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["z"],
                aggregate: [{op: "sum", column: "x"}]
            });
            var answer = `__ROW_PATH__,x\r\n,10\r\nfalse,6\r\ntrue,4`;
            let result2 = await view.to_csv();
            expect(answer).toEqual(result2);
            view.delete();
            table.delete();
        });

        it("Serializes a 2 sided view to CSV", async function() {
            var table = perspective.table(data);
            var view = table.view({
                row_pivot: ["z"],
                column_pivot: ["y"],
                aggregate: [{op: "sum", column: "x"}]
            });
            var answer = `__ROW_PATH__,\"a,x\",\"b,x\",\"c,x\",\"d,x\"\r\n,1,2,3,4\r\nfalse,,2,,4\r\ntrue,1,,3,`;
            let result2 = await view.to_csv();
            expect(answer).toEqual(result2);
            view.delete();
            table.delete();
        });

        it("Serializes a simple view to column-oriented JSON", async function() {
            var table = perspective.table(data_3);
            var view = table.view({});
            let result2 = await view.to_columns();
            expect(data_7).toEqual(result2);
            view.delete();
            table.delete();
        });
    });

    describe("Constructors", function() {
        it("JSON constructor", async function() {
            var table = perspective.table(data);
            var view = table.view();
            let result = await view.to_json();
            expect(data).toEqual(result);
            view.delete();
            table.delete();
        });

        it("JSON column oriented constructor", async function() {
            var table = perspective.table(col_data);
            var view = table.view();
            let result = await view.to_json();
            expect(data).toEqual(result);
            view.delete();
            table.delete();
        });

        it("Arrow constructor", async function() {
            var table = perspective.table(arrow.slice());
            var view = table.view();
            let result = await view.to_json();
            expect(arrow_result).toEqual(result);
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
            expect(papaparse.parse(csv, {header: true, dynamicTyping: true}).data).toEqual(result);
            view.delete();
            table.delete();
        });

        it("Meta constructor", async function() {
            var table = perspective.table(meta);
            var view = table.view();
            let result = await view.to_json();
            expect([]).toEqual(result);
            view.delete();
            table.delete();
        });

        it("Handles floats", async function() {
            var table = perspective.table(data_3);
            var view = table.view();
            let result = await view.to_json();
            expect(data_3).toEqual(result);
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
            expect(meta_3).toEqual(result);
            table.delete();
        });

        it("Generates correct date schemas", async function() {
            var table = perspective.table(data_4);
            let result = await table.schema();
            expect(meta_4).toEqual(result);
            table.delete();
        });

        it("Handles date updates when constructed from a schema", async function() {
            var table = perspective.table(meta_4);
            table.update(data_4);
            let view = table.view();
            let result = await view.to_json();
            expect([{v: +data_4[0]["v"]}]).toEqual(result);
            view.delete();
            table.delete();
        });

        it("Handles datetime values", async function() {
            var table = perspective.table(data_4);
            let view = table.view();
            let result2 = await view.to_json();
            expect([{v: +data_4[0]["v"]}]).toEqual(result2);
            view.delete();
            table.delete();
        });

        it("Handles datetime strings", async function() {
            var table = perspective.table(data_5);
            let view = table.view();
            let result2 = await view.to_json();
            expect([{v: +moment(data_5[0]["v"], "MM-DD-YYYY")}]).toEqual(result2);
            view.delete();
            table.delete();
        });

        it("Handles date values", async function() {
            var table = perspective.table({v: "date"});
            table.update(data_4);
            let view = table.view();
            let result2 = await view.to_json();
            let d = new Date(data_4[0]["v"]);
            d.setHours(0);
            d.setMinutes(0);
            d.setSeconds(0);
            d.setMilliseconds(0);
            expect([{v: +d}]).toEqual(result2);
            view.delete();
            table.delete();
        });

        it("Handles utf16", async function() {
            var table = perspective.table(data_6);
            let view = table.view({});
            let result = await view.to_json();
            expect(data_6).toEqual(result);
            view.delete();
            table.delete();
        });

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
            let view = table2.view({aggregate: [{op: "count", column: "const"}]});
            let result = await view.to_json();
            let expected = [{const: 1}, {const: 1}, {const: 1}, {const: 1}];
            expect(expected).toEqual(result);
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
            let view = table2.view({aggregate: [{op: "count", column: "ratio"}]});
            let result = await view.to_json();
            let expected = [{ratio: 1.5}, {ratio: 1.25}, {ratio: 1.1666666666666667}, {ratio: 1.125}];
            expect(expected).toEqual(result);
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
            let view = table2.view({aggregate: [{op: "count", column: "y"}, {op: "count", column: "ratio"}]});
            let result = await view.to_json();
            let expected = [{y: "a", ratio: 1.5}, {y: "b", ratio: 1.25}, {y: "c", ratio: 1.1666666666666667}, {y: "d", ratio: 1.125}];
            expect(expected).toEqual(result);
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
            let view = table2.view({aggregate: [{op: "count", column: "yes/no"}]});
            let result = await view.to_json();
            let expected = [{"yes/no": "yes"}, {"yes/no": "no"}, {"yes/no": "yes"}, {"yes/no": "no"}];
            expect(expected).toEqual(result);
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

            expect(expected).toEqual(result);
            table2.delete();
            table.delete();
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
