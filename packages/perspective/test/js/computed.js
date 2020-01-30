/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const data = [
    {x: 1, y: "a", z: true},
    {x: 2, y: "b", z: false},
    {x: 3, y: "c", z: true},
    {x: 4, y: "d", z: false}
];

const int_float_data = [
    {w: 1.5, x: 1, y: "a", z: true},
    {w: 2.5, x: 2, y: "b", z: false},
    {w: 3.5, x: 3, y: "c", z: true},
    {w: 4.5, x: 4, y: "d", z: false}
];

const int_float_subtract_data = [
    {u: 2.5, v: 2, w: 1.5, x: 1, y: "a", z: true},
    {u: 3.5, v: 3, w: 2.5, x: 2, y: "b", z: false},
    {u: 4.5, v: 4, w: 3.5, x: 3, y: "c", z: true},
    {u: 5.5, v: 5, w: 4.5, x: 4, y: "d", z: false}
];

const cols = ["i8", "ui8", "i16", "ui16", "i32", "ui32", "i64", "ui64", "f32", "f64"];

const arrows = require("./test_arrows.js");
const arrow = arrows.numbers_arrow;

const days_of_week = ["1 Sunday", "2 Monday", "3 Tuesday", "4 Wednesday", "5 Thursday", "6 Friday", "7 Saturday"];
const months_of_year = ["01 January", "02 February", "03 March", "04 April", "05 May", "06 June", "07 July", "08 August", "09 September", "10 October", "11 November", "12 December"];

const second_bucket = function(val) {
    return new Date(Math.floor(new Date(val).getTime() / 1000) * 1000);
};

const minute_bucket = function(val) {
    let date = new Date(val);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

const hour_bucket = function(val) {
    let date = new Date(val);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

const day_bucket = function(val) {
    let date = new Date(val);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

const week_bucket = function(val) {
    let date = new Date(val);
    let day = date.getDay();
    let diff = date.getDate() - day + (day == 0 ? -6 : 1);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setDate(diff);
    return date;
};

const month_bucket = function(val) {
    let date = new Date(val);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setDate(1);
    return date;
};

const year_bucket = function(val) {
    let date = new Date(val);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setDate(1);
    date.setMonth(0);
    return date;
};

module.exports = perspective => {
    describe("computed columns", function() {
        describe("Numeric, arity 1", function() {
            it("Square root of int", async function() {
                const table = perspective
                    .table({
                        a: [4, 9, 16, 20, 81, 1000]
                    })
                    .add_computed([
                        {
                            column: "sqrt",
                            computed_function_name: "sqrt",
                            inputs: ["a"]
                        }
                    ]);
                let view = table.view({columns: ["sqrt"]});
                let result = await view.to_columns();
                expect(result.sqrt).toEqual([2, 3, 4, 4.47213595499958, 9, 31.622776601683793]);
                view.delete();
                table.delete();
            });

            it("Square root of int, nulls", async function() {
                const table = perspective
                    .table({
                        a: [4, 9, null, undefined, 16]
                    })
                    .add_computed([
                        {
                            column: "sqrt",
                            computed_function_name: "sqrt",
                            inputs: ["a"]
                        }
                    ]);
                let view = table.view({columns: ["sqrt"]});
                let result = await view.to_columns();
                expect(result.sqrt).toEqual([2, 3, null, null, 4]);
                view.delete();
                table.delete();
            });

            it("Square root of float", async function() {
                var table = perspective.table({
                    a: [4.5, 9.5, 16.5, 20.5, 81.5, 1000.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "sqrt",
                        computed_function_name: "sqrt",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["sqrt"]});
                let result = await view.to_columns();
                expect(result.sqrt).toEqual([2.1213203435596424, 3.082207001484488, 4.06201920231798, 4.527692569068709, 9.027735042633894, 31.63068130786942]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Square root of float, null", async function() {
                var table = perspective.table({
                    a: [4.5, 9.5, null, undefined, 16.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "sqrt",
                        computed_function_name: "sqrt",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["sqrt"]});
                let result = await view.to_columns();
                expect(result.sqrt).toEqual([2.1213203435596424, 3.082207001484488, null, null, 4.06201920231798]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Pow^2 of int", async function() {
                var table = perspective.table({
                    a: [2, 4, 6, 8, 10]
                });

                let table2 = table.add_computed([
                    {
                        column: "pow2",
                        computed_function_name: "x^2",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["pow2"]});
                let result = await view.to_columns();
                expect(result.pow2).toEqual([4, 16, 36, 64, 100]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Pow^2 of int, nulls", async function() {
                var table = perspective.table({
                    a: [2, 4, null, undefined, 10]
                });

                let table2 = table.add_computed([
                    {
                        column: "pow2",
                        computed_function_name: "x^2",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["pow2"]});
                let result = await view.to_columns();
                expect(result.pow2).toEqual([4, 16, null, null, 100]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Pow^2 of float", async function() {
                var table = perspective.table({
                    a: [2.5, 4.5, 6.5, 8.5, 10.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "pow2",
                        computed_function_name: "x^2",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["pow2"]});
                let result = await view.to_columns();
                expect(result.pow2).toEqual([6.25, 20.25, 42.25, 72.25, 110.25]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Pow^2 of float, nulls", async function() {
                var table = perspective.table({
                    a: [2.5, 4.5, null, undefined, 10.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "pow2",
                        computed_function_name: "x^2",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["pow2"]});
                let result = await view.to_columns();
                expect(result.pow2).toEqual([6.25, 20.25, null, null, 110.25]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Invert int", async function() {
                var table = perspective.table({
                    a: [2, 4, 6, 8, 10]
                });

                let table2 = table.add_computed([
                    {
                        column: "invert",
                        computed_function_name: "1/x",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["invert"]});
                let result = await view.to_columns();
                expect(result.invert).toEqual([0.5, 0.25, 0.16666666666666666, 0.125, 0.1]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Invert int, nulls", async function() {
                var table = perspective.table({
                    a: [2, 4, null, undefined, 10]
                });

                let table2 = table.add_computed([
                    {
                        column: "invert",
                        computed_function_name: "1/x",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["invert"]});
                let result = await view.to_columns();
                expect(result.invert).toEqual([0.5, 0.25, null, null, 0.1]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Invert float", async function() {
                var table = perspective.table({
                    a: [2.5, 4.5, 6.5, 8.5, 10.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "invert",
                        computed_function_name: "1/x",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["invert"]});
                let result = await view.to_columns();
                expect(result.invert).toEqual([0.4, 0.2222222222222222, 0.15384615384615385, 0.11764705882352941, 0.09523809523809523]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Invert float, nulls", async function() {
                var table = perspective.table({
                    a: [2.5, 4.5, null, undefined, 10.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "invert",
                        computed_function_name: "1/x",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view({columns: ["invert"]});
                let result = await view.to_columns();
                expect(result.invert).toEqual([0.4, 0.2222222222222222, null, null, 0.09523809523809523]);
                view.delete();
                table2.delete();
                table.delete();
            });
        });

        describe("Numeric, arity 2", function() {
            it("Computed column of arity 2, add ints", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "sum",
                        type: "int",
                        computed_function_name: "+",
                        inputs: ["x", "x"]
                    }
                ]);
                let view = table2.view({columns: ["sum"], aggregates: {sum: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{sum: 2}, {sum: 4}, {sum: 6}, {sum: 8}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, add floats", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "sum",
                        type: "float",
                        computed_function_name: "+",
                        inputs: ["w", "w"]
                    }
                ]);
                let view = table2.view({columns: ["sum"], aggregates: {sum: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{sum: 3}, {sum: 5}, {sum: 7}, {sum: 9}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, add mixed", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "sum",
                        type: "float",
                        computed_function_name: "+",
                        inputs: ["w", "x"]
                    }
                ]);
                let view = table2.view({columns: ["sum"]});
                let result = await view.to_json();
                expect(result).toEqual([{sum: 2.5}, {sum: 4.5}, {sum: 6.5}, {sum: 8.5}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, add with null", async function() {
                var table = perspective.table({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, undefined, 2.5, 3.5, 4.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "sum",
                        type: "float",
                        computed_function_name: "+",
                        inputs: ["a", "b"]
                    }
                ]);
                let view = table2.view({columns: ["sum"]});
                let result = await view.to_columns();
                expect(result["sum"]).toEqual([2.5, null, null, 6.5, 8.5]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, subtract ints", async function() {
                var table = perspective.table(int_float_subtract_data);

                let table2 = table.add_computed([
                    {
                        column: "difference",
                        type: "int",
                        computed_function_name: "-",
                        inputs: ["v", "x"]
                    }
                ]);
                let view = table2.view({columns: ["difference"]});
                let result = await view.to_json();
                expect(result).toEqual([{difference: 1}, {difference: 1}, {difference: 1}, {difference: 1}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, subtract floats", async function() {
                var table = perspective.table(int_float_subtract_data);

                let table2 = table.add_computed([
                    {
                        column: "difference",
                        type: "float",
                        computed_function_name: "-",
                        inputs: ["u", "w"]
                    }
                ]);
                let view = table2.view({columns: ["difference"], aggregates: {difference: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{difference: 1}, {difference: 1}, {difference: 1}, {difference: 1}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, subtract mixed", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "difference",
                        type: "float",
                        computed_function_name: "-",
                        inputs: ["w", "x"]
                    }
                ]);
                let view = table2.view({columns: ["difference"], aggregates: {difference: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{difference: 0.5}, {difference: 0.5}, {difference: 0.5}, {difference: 0.5}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, subtract with null", async function() {
                var table = perspective.table({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, undefined, 2.5, 3.5, 4.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "difference",
                        type: "float",
                        computed_function_name: "-",
                        inputs: ["a", "b"]
                    }
                ]);
                let view = table2.view({columns: ["difference"]});
                let result = await view.to_columns();
                expect(result["difference"]).toEqual([-0.5, null, null, -0.5, -0.5]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, multiply ints", async function() {
                var table = perspective.table(int_float_subtract_data);

                let table2 = table.add_computed([
                    {
                        column: "multiply",
                        type: "float",
                        computed_function_name: "*",
                        inputs: ["v", "x"]
                    }
                ]);
                let view = table2.view({columns: ["multiply"], aggregates: {multiply: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{multiply: 2}, {multiply: 6}, {multiply: 12}, {multiply: 20}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, multiply floats", async function() {
                var table = perspective.table(int_float_subtract_data);

                let table2 = table.add_computed([
                    {
                        column: "multiply",
                        type: "float",
                        computed_function_name: "*",
                        inputs: ["u", "w"]
                    }
                ]);
                let view = table2.view({columns: ["multiply"], aggregates: {multiply: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{multiply: 3.75}, {multiply: 8.75}, {multiply: 15.75}, {multiply: 24.75}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, multiply mixed", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "multiply",
                        type: "float",
                        computed_function_name: "*",
                        inputs: ["w", "x"]
                    }
                ]);
                let view = table2.view({columns: ["multiply"], aggregates: {multiply: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{multiply: 1.5}, {multiply: 5}, {multiply: 10.5}, {multiply: 18}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, multiply with null", async function() {
                var table = perspective.table({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, undefined, 2.5, 3.5, 4.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "product",
                        type: "float",
                        computed_function_name: "*",
                        inputs: ["a", "b"]
                    }
                ]);
                let view = table2.view({columns: ["product"]});
                let result = await view.to_columns();
                expect(result["product"]).toEqual([1.5, null, null, 10.5, 18]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, divide ints", async function() {
                var table = perspective.table(int_float_subtract_data);

                let table2 = table.add_computed([
                    {
                        column: "divide",
                        type: "int",
                        computed_function_name: "/",
                        inputs: ["v", "x"]
                    }
                ]);
                let view = table2.view({columns: ["divide"], aggregates: {divide: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{divide: 2}, {divide: 1.5}, {divide: 1.3333333333333333}, {divide: 1.25}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, divide floats", async function() {
                var table = perspective.table(int_float_subtract_data);

                let table2 = table.add_computed([
                    {
                        column: "divide",
                        type: "int",
                        computed_function_name: "/",
                        inputs: ["u", "w"]
                    }
                ]);
                let view = table2.view({columns: ["divide"], aggregates: {divide: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{divide: 1.6666666666666667}, {divide: 1.4}, {divide: 1.2857142857142858}, {divide: 1.2222222222222223}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, divide mixed", async function() {
                var table = perspective.table(int_float_data);

                let table2 = table.add_computed([
                    {
                        column: "divide",
                        type: "int",
                        computed_function_name: "/",
                        inputs: ["w", "x"]
                    }
                ]);
                let view = table2.view({columns: ["divide"], aggregates: {divide: "count"}});
                let result = await view.to_json();
                expect(result).toEqual([{divide: 1.5}, {divide: 1.25}, {divide: 1.1666666666666667}, {divide: 1.125}]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, divide with null", async function() {
                var table = perspective.table({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, undefined, 2.5, 3.5, 4.5]
                });

                let table2 = table.add_computed([
                    {
                        column: "divide",
                        type: "float",
                        computed_function_name: "/",
                        inputs: ["a", "b"]
                    }
                ]);
                let view = table2.view({columns: ["divide"]});
                let result = await view.to_columns();
                expect(result["divide"]).toEqual([0.6666666666666666, null, null, 0.8571428571428571, 0.8888888888888888]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed column of arity 2, percent a of b, ints", async function() {
                const table = perspective
                    .table({
                        a: [100, 75, 50, 25, 10, 1],
                        b: [100, 100, 100, 100, 100, 100]
                    })
                    .add_computed([
                        {
                            column: "%",
                            computed_function_name: "%",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["%"]).toEqual([100, 75, 50, 25, 10, 1]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, percent a of b, floats", async function() {
                const table = perspective
                    .table({
                        a: [7.5, 5.5, 2.5, 1.5, 0.5],
                        b: [22.5, 16.5, 7.5, 4.5, 1.5]
                    })
                    .add_computed([
                        {
                            column: "%",
                            computed_function_name: "%",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["%"]).toEqual([33.33333333333333, 33.33333333333333, 33.33333333333333, 33.33333333333333, 33.33333333333333]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, percent a of b, mixed", async function() {
                const table = perspective
                    .table({
                        a: [55.5, 65.5, 75.5, 85.5, 95.5],
                        b: [100, 100, 100, 100, 100]
                    })
                    .add_computed([
                        {
                            column: "%",
                            computed_function_name: "%",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["%"]).toEqual([55.50000000000001, 65.5, 75.5, 85.5, 95.5]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, percent a of b, with null", async function() {
                const table = perspective
                    .table({
                        a: [100, null, 50, 25, 10, 1],
                        b: [100, 100, 100, 100, undefined, 100]
                    })
                    .add_computed([
                        {
                            column: "%",
                            computed_function_name: "%",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["%"]).toEqual([100, null, 50, 25, null, 1]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, equals, ints", async function() {
                const table = perspective
                    .table({
                        a: [100, 75, 50, 25, 10, 1],
                        b: [100, 100, 100, 100, 100, 100]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "==",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, false, false, false, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, equals, floats", async function() {
                const table = perspective
                    .table({
                        a: [1.2222222222, 5.5, 7.55555555555, 9.5],
                        b: [1.22222222222, 5.5, 7.55555555555, 4.5]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "==",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, true, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, equals, mixed", async function() {
                const table = perspective
                    .table({
                        a: [100.0, 65.5, 100.0, 85.5, 95.5],
                        b: [100, 100, 100, 100, 100]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "==",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, true, false, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, equals, with null", async function() {
                const table = perspective
                    .table({
                        a: [100, null, 50.0, 25, 10, 1],
                        b: [100, undefined, 50, 100, undefined, 100]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "==",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([true, null, true, false, null, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, not equals, ints", async function() {
                const table = perspective
                    .table({
                        a: [100, 75, 50, 25, 10, 1],
                        b: [100, 100, 100, 100, 100, 100]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "!=",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, true, true, true, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, not equals, floats", async function() {
                const table = perspective
                    .table({
                        a: [1.2222222222, 5.5, 7.55555555555, 9.5],
                        b: [1.22222222222, 5.5, 7.55555555555, 4.5]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "!=",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, false, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, not equals, mixed", async function() {
                const table = perspective
                    .table({
                        a: [100.0, 65.5, 100.0, 85.5, 95.5],
                        b: [100, 100, 100, 100, 100]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "!=",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, false, true, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, not equals, with null", async function() {
                const table = perspective
                    .table({
                        a: [100, null, 50.0, 25, 10, 1],
                        b: [100, undefined, 50, 100, undefined, 100]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "!=",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([false, null, false, true, null, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, greater than, ints", async function() {
                const table = perspective
                    .table({
                        a: [100, 75, 50, 25, 10, 1],
                        b: [100, 100, 100, 100, 100, 0]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: ">",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([false, false, false, false, false, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, greater than, floats", async function() {
                const table = perspective
                    .table({
                        a: [1.22222222223, 5.5, 7.55555555555, 0.555555556],
                        b: [1.22222222222, 5.5, 7.55555555555, 0.555555555]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: ">",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, false, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, greater than, mixed", async function() {
                const table = perspective
                    .table({
                        a: [100.0, 65.5, 100.0, 85.5, 95.5],
                        b: [100, 100, 100, 100, 5]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: ">",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([false, false, false, false, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, greater than, with null", async function() {
                const table = perspective
                    .table({
                        a: [100, null, 50.0, 25, 10, 10000],
                        b: [100, undefined, 50, 100, undefined, 100]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: ">",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([false, null, false, false, null, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, less than, ints", async function() {
                const table = perspective
                    .table({
                        a: [100, 75, 50, 25, 10, 1],
                        b: [100, 100, 100, 100, 100, 0]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "<",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, true, true, true, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, less than, floats", async function() {
                const table = perspective
                    .table({
                        a: [1.2222222222, 5.5, 7.1, 9.5],
                        b: [1.22222222222, 5.5, 7.55555555555, 4.5]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "<",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, true, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, less than, mixed", async function() {
                const table = perspective
                    .table({
                        a: [100.0, 65.5, 100.0, 85.5, 95.5],
                        b: [100, 100, 100, 100, 5]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "<",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, false, true, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, less than, with null", async function() {
                const table = perspective
                    .table({
                        a: [10, null, 50.0, 25, 10, 10000],
                        b: [100, undefined, 50, 100, undefined, 100]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "<",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result["result"]).toEqual([true, null, false, true, null, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2 with updates on non-dependent columns, construct from schema", async function() {
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
                        computed_function_name: "/",
                        inputs: ["w", "x"]
                    }
                ]);

                table2.update(int_float_data);

                let delta_upd = [
                    {y: "a", z: false},
                    {y: "b", z: true},
                    {y: "c", z: false},
                    {y: "d", z: true}
                ];
                table2.update(delta_upd);
                let view = table2.view({columns: ["y", "ratio"], aggregates: {y: "count", ratio: "count"}});
                let result = await view.to_json();
                let expected = [
                    {y: "a", ratio: 1.5},
                    {y: "b", ratio: 1.25},
                    {y: "c", ratio: 1.1666666666666667},
                    {y: "d", ratio: 1.125}
                ];
                expect(result).toEqual(expected);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Computed schema returns names and metadata", async function() {
                const table = perspective.table(data);

                // `column` is column name
                const table2 = table.add_computed([
                    {
                        computation: {
                            computed_function_name: "+",
                            input_type: "integer",
                            type: "integer"
                        },
                        computed_function_name: "+",
                        column: "plus2",
                        inputs: ["x", "x"],
                        input_type: "integer",
                        type: "integer"
                    }
                ]);

                const result = await table2.computed_schema();
                const expected = {
                    plus2: {
                        computation: {
                            computed_function_name: "+",
                            input_type: "integer",
                            type: "integer"
                        },
                        input_columns: ["x", "x"],
                        input_type: "integer",
                        type: "integer"
                    }
                };

                expect(result).toEqual(expected);
                table2.delete();
                table.delete();
            });
        });

        describe("String, arity 1", function() {
            it("Length", async function() {
                const table = perspective
                    .table({
                        a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"]
                    })
                    .add_computed([
                        {
                            column: "length",
                            computed_function_name: "length",
                            inputs: ["a"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.length).toEqual(result.a.map(x => x.length));
                view.delete();
                table.delete();
            });

            it("Length with null", async function() {
                const table = perspective
                    .table({
                        a: ["abc", "deeeeef", null, undefined, "abcdefghijk"]
                    })
                    .add_computed([
                        {
                            column: "length",
                            computed_function_name: "length",
                            inputs: ["a"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.length).toEqual(result.a.map(x => (x ? x.length : null)));
                view.delete();
                table.delete();
            });

            it("Uppercase", async function() {
                const table = perspective
                    .table({
                        a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"]
                    })
                    .add_computed([
                        {
                            column: "upper",
                            computed_function_name: "Uppercase",
                            inputs: ["a"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.upper).toEqual(result.a.map(x => x.toUpperCase()));
                view.delete();
                table.delete();
            });

            it("Uppercase with null", async function() {
                const table = perspective
                    .table({
                        a: ["abc", "deeeeef", null, undefined, "abcdefghijk"]
                    })
                    .add_computed([
                        {
                            column: "upper",
                            computed_function_name: "Uppercase",
                            inputs: ["a"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.upper).toEqual(result.a.map(x => (x ? x.toUpperCase() : null)));
                view.delete();
                table.delete();
            });

            it("Lowercase", async function() {
                const table = perspective
                    .table({
                        a: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "lower",
                            computed_function_name: "Lowercase",
                            inputs: ["a"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.lower).toEqual(result.a.map(x => x.toLowerCase()));
                view.delete();
                table.delete();
            });

            it("Lowercase with null", async function() {
                const table = perspective
                    .table({
                        a: ["ABC", "DEF", null, undefined, "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "lower",
                            computed_function_name: "Lowercase",
                            inputs: ["a"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.lower).toEqual(result.a.map(x => (x ? x.toLowerCase() : null)));
                view.delete();
                table.delete();
            });
        });

        describe("String, arity 2", function() {
            it("Concat with space", async function() {
                const table = perspective
                    .table({
                        a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                        b: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "length",
                            computed_function_name: "concat_space",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.length).toEqual(result.a.map((x, idx) => x + " " + result.b[idx]));
                view.delete();
                table.delete();
            });

            it("Concat with comma", async function() {
                const table = perspective
                    .table({
                        a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                        b: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "upper",
                            computed_function_name: "concat_comma",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.upper).toEqual(result.a.map((x, idx) => x + ", " + result.b[idx]));
                view.delete();
                table.delete();
            });

            it("Concats with space, nulls", async function() {
                const table = perspective
                    .table({
                        a: ["ABC", "DEF", null, "HIjK", "lMNoP"],
                        b: ["ABC", undefined, "EfG", "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "length",
                            computed_function_name: "concat_space",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                let expected = result.a.map((x, idx) => x + " " + result.b[idx]);
                expected[1] = null;
                expected[2] = null;
                expect(result.length).toEqual(expected);
                view.delete();
                table.delete();
            });

            it("Concats with comma, nulls", async function() {
                const table = perspective
                    .table({
                        a: ["ABC", "DEF", undefined, "HIjK", "lMNoP"],
                        b: ["ABC", null, "EfG", "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "length",
                            computed_function_name: "concat_comma",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                let expected = result.a.map((x, idx) => x + ", " + result.b[idx]);
                expected[1] = null;
                expected[2] = null;
                expect(result.length).toEqual(expected);
                view.delete();
                table.delete();
            });

            it("Concats with space, extra long", async function() {
                const table = perspective
                    .table({
                        a: ["ABC".repeat(10), "DEF".repeat(10), null, "HIjK".repeat(10), "lMNoP".repeat(10)],
                        b: ["ABC", undefined, "EfG", "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "length",
                            computed_function_name: "concat_space",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                let expected = result.a.map((x, idx) => x + " " + result.b[idx]);
                expected[1] = null;
                expected[2] = null;
                expect(result.length).toEqual(expected);
                view.delete();
                table.delete();
            });

            it("Concats with comma, extra long", async function() {
                const table = perspective
                    .table({
                        a: ["ABC".repeat(10), "DEF".repeat(10), undefined, "HIjK".repeat(10), "lMNoP".repeat(10)],
                        b: ["ABC", null, "EfG", "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "length",
                            computed_function_name: "concat_comma",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                let expected = result.a.map((x, idx) => x + ", " + result.b[idx]);
                expected[1] = null;
                expected[2] = null;
                expect(result.length).toEqual(expected);
                view.delete();
                table.delete();
            });

            it("is", async function() {
                const table = perspective
                    .table({
                        a: ["ABC", "DEF", null, "HIjK", "lMNoP"],
                        b: ["ABC", undefined, null, "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "is",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.result).toEqual([true, false, false, true, true]);
                view.delete();
                table.delete();
            });

            it("is, nulls", async function() {
                const table = perspective
                    .table({
                        a: ["ABC", "DEF", undefined, null, null],
                        b: ["ABC", "not", "EfG", "HIjK", null]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "is",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.result).toEqual([true, false, false, false, false]);
                view.delete();
                table.delete();
            });

            it("is, extra long", async function() {
                const table = perspective
                    .table({
                        a: ["ABC".repeat(10), "DEF".repeat(10), null, "HIjK".repeat(10), "lMNoP"],
                        b: ["ABC".repeat(10), "DEF".repeat(10), undefined, "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "is",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.result).toEqual([true, true, false, false, true]);
                view.delete();
                table.delete();
            });

            it("is, short", async function() {
                const table = perspective
                    .table({
                        a: ["A", "E", null, "h", "l"],
                        b: ["a", "E", undefined, "h", "l"]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "is",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.result).toEqual([false, true, false, true, true]);
                view.delete();
                table.delete();
            });

            it("is, mixed length", async function() {
                const table = perspective
                    .table({
                        a: ["ABC".repeat(100), "DEF".repeat(10), null, "hijk".repeat(10), "lm"],
                        b: ["arc".repeat(50), "DEf".repeat(10), undefined, "HIjK", "lMNoP"]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "is",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.result).toEqual([false, false, false, false, false]);
                view.delete();
                table.delete();
            });

            it("is, UTF-8", async function() {
                const table = perspective
                    .table({
                        a: [
                            ">ﺐ{׆Meڱ㒕宾ⷭ̽쉱L𞔚Ո拏۴ګPظǭ�PۋV|팺㺞㷾墁鴦򒲹|ۿ򧊊䭪񪩛𬦢񺣠񦋳򵾳蛲񖑐iM񊪝񆷯",
                            "灙𬡍瀳։󷿙񅈕ǐ-kʂiJ!�P񙺍󵝳̃੝w𬾐򕕉耨󉋦o򰵏詂3򒤹J<ꑭ񃕱Ӏ𛤦4u򉠚UPf􂢳P#�#Q񪂈",
                            "ĈᔞZ񇌖Qఋ?x?#$12ボլ㕢ﺧ𷛘󽙮[񲸧I񟭝򋨰魏ճ�כ󽺴ۏ󫨫䆐'㓔ǃ[ְ੬䎕寽𤩚ߨ袧򲕊򓰷|%",
                            "ęԛ򓍯󍩁𨞟㰢󇂣õ􌁇΍Ԥ⥯۷˝㿙צּ񬆩򤿭顂ݦۍ式+=�ԋ帋񃴕譋ⴏ0l􅏎߳cί򇈊iȞڈU򆐹񍖮򷡦̥𩮏Ǳ",
                            "0ой3֝󻙋򑨮꾪߫0󏜬󆑝w󊭟񑓫򾷄𶳿o󏉃纊ʫ􅋶聍𾋊ô򓨼쀨ˆ퍨׽ȿKOŕ􅽾󙸹Ѩ󶭆j񽪌򸢐p򊘏׷򿣂dｇD쩖"
                        ],
                        b: [
                            ">ﺐ{׆Meڱ㒕宾ⷭ̽쉱L𞔚Ո拏۴ګPظǭ�PۋV|팺㺞㷾墁鴦򒲹|ۿ򧊊䭪񪩛𬦢񺣠񦋳򵾳蛲񖑐iM񊪝񆷯",
                            "灙𬡍瀳։󷿙񅈕ǐ-kʂiJ!�P񙺍󵝳̃੝w𬾐򕕉耨󉋦o򰵏詂3򒤹J<ꑭ񃕱Ӏ𛤦4u򉠚UPf􂢳P#�#Q񪂈",
                            "ĈᔞZ񇌖Qఋ?x?#$12ボլ㕢ﺧ𷛘󽙮[񲸧I񟭝򋨰魏ճ�כ󽺴ۏ󫨫䆐'㓔ǃ[ְ੬䎕寽𤩚ߨ袧򲕊򓰷|%",
                            "ęԛ򓍯󍩁𨞟㰢󇂣õ􌁇΍Ԥ⥯۷˝㿙צּ񬆩򤿭顂ݦۍ式+=�ԋ帋񃴕譋ⴏ0l􅏎߳cί򇈊iȞڈU򆐹񍖮򷡦̥𩮏Ǳ",
                            "0ой3֝󻙋򑨮꾪߫0󏜬󆑝w󊭟񑓫򾷄𶳿o󏉃纊ʫ􅋶聍𾋊ô򓨼쀨ˆ퍨׽ȿKOŕ􅽾󙸹Ѩ󶭆j񽪌򸢐p򊘏׷򿣂dｇD쩖2"
                        ]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "is",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.result).toEqual([true, true, true, true, false]);
                view.delete();
                table.delete();
            });

            it("is, UTF-8 converted to Unicode", async function() {
                const table = perspective
                    .table({
                        a: [">{MeLPPV||iM", "-kiJ!Pwo3J<4uUPfP##Q", "ZQ?x?#$12[I'[|%", "ܦf+=0lciU", "030wo􎼨KOjpdD"],
                        b: [">{MeLPPV||iM", "-kiJ!Pwo3J<4uUPfP##Q", "ZQ?x?#$12[I'[|%", "ܦf+=0lciU", "030wo􎼨KOjpdD2"]
                    })
                    .add_computed([
                        {
                            column: "result",
                            computed_function_name: "is",
                            inputs: ["a", "b"]
                        }
                    ]);
                let view = table.view();
                let result = await view.to_columns();
                expect(result.result).toEqual([true, true, true, true, false]);
                view.delete();
                table.delete();
            });
        });

        describe("Date, Arity 1", function() {
            it("Hour of day, date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "hour",
                        computed_function_name: "Hour of Day",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    hour: "integer"
                });

                table2.update({
                    a: [new Date(), new Date(), new Date()]
                });

                let result = await view.to_columns();
                expect(result.hour).toEqual([0, 0, 0]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Hour of day, date with null", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "hour",
                        computed_function_name: "Hour of Day",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    hour: "integer"
                });

                table2.update({
                    a: [new Date(), null, undefined, new Date()]
                });

                let result = await view.to_columns();
                expect(result.hour).toEqual([0, null, null, 0]);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Day of week, date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "day",
                        computed_function_name: "Day of Week",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    day: "string"
                });

                table2.update({
                    a: [new Date(2020, 0, 26), new Date(2020, 0, 27), new Date(2020, 0, 28), new Date(2020, 0, 29), new Date(2020, 0, 30)]
                });

                let result = await view.to_columns();
                console.error(result);
                expect(result.day).toEqual(result.a.map(x => days_of_week[new Date(x).getDay()]));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Day of week, date with null", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "day",
                        computed_function_name: "Day of Week",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    day: "string"
                });

                table2.update({
                    a: [new Date(2020, 0, 26), null, undefined, new Date(2020, 0, 29), new Date(2020, 0, 30)]
                });

                let result = await view.to_columns();
                console.error(result);
                expect(result.day).toEqual(result.a.map(x => (x ? days_of_week[new Date(x).getDay()] : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Month of year, date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "month",
                        computed_function_name: "Month of Year",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    month: "string"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.month).toEqual(result.a.map(x => months_of_year[new Date(x).getMonth()]));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Month of year, date with null", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "month",
                        computed_function_name: "Month of Year",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    month: "string"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.month).toEqual(result.a.map(x => (x ? months_of_year[new Date(x).getMonth()] : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (s), date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (s)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.bucket).toEqual(result.a);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (s), date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (s)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.bucket).toEqual(result.a.map(x => (x ? x : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (W), date shouldn't ever overflow at beginning of year", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2015, 0, 3, 15), new Date(2015, 0, 4)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => new Date(x))).toEqual(result.a.map(x => week_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (M), date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (m)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.bucket).toEqual(result.a);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (m), date with nulls", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (m)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.bucket).toEqual(result.a.map(x => (x ? x : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (h), date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (h)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });
                table2.update({
                    a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.bucket).toEqual(result.a);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (h), date with nulls", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (h)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });
                table2.update({
                    a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.bucket).toEqual(result.a.map(x => (x ? x : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (D), date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (D)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.bucket).toEqual(result.a);
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (D), date null", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (D)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.bucket).toEqual(result.a.map(x => (x ? x : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (W), date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 0, 17), new Date(2020, 0, 18), new Date(2020, 0, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => week_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (W), date with null", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 0, 17), new Date(2020, 0, 18), new Date(2020, 0, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? week_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (M), date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (M)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 1, 17), new Date(2020, 2, 18), new Date(2020, 2, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => month_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (M), date with null", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (M)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), null, undefined, new Date(2020, 2, 18), new Date(2020, 2, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? month_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (Y), date", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (Y)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2021, 1, 17), new Date(2019, 2, 18), new Date(2019, 2, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => year_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (Y), date with null", async function() {
                const table = perspective.table({
                    a: "date"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (Y)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "date",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), null, undefined, new Date(2019, 2, 18), new Date(2019, 2, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? year_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });
        });

        describe("Datetime, Arity 1", function() {
            it("Hour of day, datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "hour",
                        computed_function_name: "Hour of Day",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    hour: "integer"
                });

                table2.update({
                    a: [new Date(), new Date(), new Date()]
                });

                let result = await view.to_columns();
                expect(result.hour).toEqual(result.a.map(x => new Date(x).getUTCHours()));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Hour of day, datetime with null", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "hour",
                        computed_function_name: "Hour of Day",
                        inputs: ["a"]
                    }
                ]);
                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    hour: "integer"
                });

                table2.update({
                    a: [new Date(), null, undefined, new Date()]
                });

                let result = await view.to_columns();
                expect(result.hour).toEqual(result.a.map(x => (x ? new Date(x).getUTCHours() : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Day of week, datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "day",
                        computed_function_name: "Day of Week",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    day: "string"
                });

                table2.update({
                    a: [new Date(2020, 0, 26, 1), new Date(2020, 0, 27, 2), new Date(2020, 0, 28, 3), new Date(2020, 0, 29, 4), new Date(2020, 0, 30, 5)]
                });

                let result = await view.to_columns();
                console.error(result);
                expect(result.day).toEqual(result.a.map(x => days_of_week[new Date(x).getUTCDay()]));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Day of week, datetime with null", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "day",
                        computed_function_name: "Day of Week",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    day: "string"
                });

                table2.update({
                    a: [new Date(2020, 0, 26, 1), null, undefined, new Date(2020, 0, 29, 4), new Date(2020, 0, 30, 5)]
                });

                let result = await view.to_columns();
                console.error(result);
                expect(result.day).toEqual(result.a.map(x => (x ? days_of_week[new Date(x).getUTCDay()] : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Month of year, datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "month",
                        computed_function_name: "Month of Year",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    month: "string"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.month).toEqual(result.a.map(x => months_of_year[new Date(x).getUTCMonth()]));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Month of year, datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "month",
                        computed_function_name: "Month of Year",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    month: "string"
                });

                table2.update({
                    a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
                });

                let result = await view.to_columns();
                expect(result.month).toEqual(result.a.map(x => (x ? months_of_year[new Date(x).getUTCMonth()] : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (s), datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (s)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                table2.update({
                    a: [new Date(2020, 0, 15, 1, 30, 15), new Date(2020, 1, 27, 1, 30, 30), new Date(2020, 2, 28, 1, 30, 45), new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
                });

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "datetime"
                });

                let result = await view.to_columns();
                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => second_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (s), datetime with null", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (s)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                table2.update({
                    a: [new Date(2020, 0, 15, 1, 30, 15), null, undefined, new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
                });

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "datetime"
                });

                let result = await view.to_columns();
                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? second_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (m), datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (m)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "datetime"
                });

                table2.update({
                    a: [new Date(2020, 0, 15, 1, 30, 15), new Date(2020, 1, 27, 1, 30, 30), new Date(2020, 2, 28, 1, 30, 45), new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
                });

                let result = await view.to_columns();
                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => minute_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (m), datetime with null", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (m)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "datetime"
                });

                table2.update({
                    a: [new Date(2020, 0, 15, 1, 30, 15), null, undefined, new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
                });

                let result = await view.to_columns();
                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? minute_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (h), datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (h)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "datetime"
                });

                table2.update({
                    a: [new Date(2020, 0, 15, 1, 30, 15), new Date(2020, 1, 27, 1, 30, 30), new Date(2020, 2, 28, 1, 30, 45), new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
                });

                let result = await view.to_columns();
                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => hour_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (h), datetime with null", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (h)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "datetime"
                });

                table2.update({
                    a: [new Date(2020, 0, 15, 1, 30, 15), null, undefined, new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
                });

                let result = await view.to_columns();
                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? hour_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (D), datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (D)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 15, 1, 30, 15), new Date(2020, 1, 27, 1, 30, 30), new Date(2020, 2, 28, 1, 30, 45), new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
                });

                let result = await view.to_columns();
                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => day_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (D), datetime with null", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (D)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 15, 1, 30, 15), null, undefined, new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
                });

                let result = await view.to_columns();
                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? day_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (W), datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 0, 17), new Date(2020, 0, 18), new Date(2020, 0, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => week_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (W), datetime with null", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), null, undefined, new Date(2020, 0, 18), new Date(2020, 0, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? week_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (W), datetime shouldn't ever overflow at beginning of year", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2015, 0, 3, 15), new Date(2015, 0, 4)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => new Date(x))).toEqual(result.a.map(x => week_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (M), datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (M)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 1, 17), new Date(2020, 2, 18), new Date(2020, 2, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => month_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (M), datetime with nulls", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (M)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), null, undefined, new Date(2020, 2, 18), new Date(2020, 2, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? month_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (Y), datetime", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (Y)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2021, 11, 17), new Date(2019, 2, 18), new Date(2019, 2, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => year_bucket(x)));
                view.delete();
                table2.delete();
                table.delete();
            });

            it("Bucket (Y), datetime with nulls", async function() {
                const table = perspective.table({
                    a: "datetime"
                });

                const table2 = table.add_computed([
                    {
                        column: "bucket",
                        computed_function_name: "Bucket (Y)",
                        inputs: ["a"]
                    }
                ]);

                let view = table2.view();

                const schema = await table2.schema();
                expect(schema).toEqual({
                    a: "datetime",
                    bucket: "date"
                });

                table2.update({
                    a: [new Date(2020, 0, 12), null, undefined, new Date(2019, 2, 18), new Date(2019, 2, 29)]
                });

                let result = await view.to_columns();

                expect(result.bucket.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? year_bucket(x) : null)));
                view.delete();
                table2.delete();
                table.delete();
            });
        });

        describe("types", function() {
            describe("Arity 1", function() {
                it("Should compute functions between all types, abs", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `abs(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "abs",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        expect(results[name]).toEqual(results[x]);
                        view.delete();
                        table.delete();
                    }
                });

                it("Should compute functions between all types, sqrt", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `sqrt(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "sqrt",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        expect(results[name]).toEqual(results[x].map(val => Math.sqrt(val)));
                        view.delete();
                        table.delete();
                    }
                });

                it("Should compute functions between all types, invert", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `invert(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "1/x",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => 1 / val);
                        expected[0] = null;
                        expect(results[name]).toEqual(expected);
                        view.delete();
                        table.delete();
                    }
                });

                it("Should compute functions between all types, pow", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `pow(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "x^2",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.pow(val, 2));
                        expect(results[name]).toEqual(expected);
                        view.delete();
                        table.delete();
                    }
                });

                it("Should compute functions between all types, bucket 10", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `bucket(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "Bucket (10)",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 10) * 10);
                        expect(results[name]).toEqual(expected);
                        view.delete();
                        table.delete();
                    }
                });

                it("Should compute functions between all types, bucket 100", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `bucket(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "Bucket (100)",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 100) * 100);
                        expect(results[name]).toEqual(expected);
                        view.delete();
                        table.delete();
                    }
                });

                it("Should compute functions between all types, bucket 1000", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `bucket(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "Bucket (1000)",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 1000) * 1000);
                        expect(results[name]).toEqual(expected);
                        view.delete();
                        table.delete();
                    }
                });

                it("Should compute functions between all types, bucket 1/10", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `bucket(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "Bucket (1/10)",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 0.1) * 0.1);
                        expect(results[name]).toEqual(expected);
                        view.delete();
                        table.delete();
                    }
                });

                it("Should compute functions between all types, bucket 1/100", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `bucket(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "Bucket (1/100)",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 0.01) * 0.01);
                        expect(results[name]).toEqual(expected);
                        view.delete();
                        table.delete();
                    }
                });

                it("Should compute functions between all types, bucket 1/1000", async function() {
                    for (let i = 0; i < cols.length; i++) {
                        const x = cols[i];
                        const name = `bucket(${x})`;
                        let table = perspective.table(arrow.slice()).add_computed([
                            {
                                computed_function_name: "Bucket (1/1000)",
                                inputs: [x],
                                column: name
                            }
                        ]);

                        let view = table.view({
                            columns: [name, x]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 0.001) * 0.001);
                        expect(results[name]).toEqual(expected);
                        view.delete();
                        table.delete();
                    }
                });
            });

            describe("Arity 2", function() {
                it("Should compute functions between all types, add", async function() {
                    const int_result = [0, 2, 6, 8, 12, 14, 18, 20, 24, 26];
                    const int_float_result = [0, 2.5, 6, 8.5, 12, 14.5, 18, 20.5, 24, 26.5];
                    const float_result = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27];
                    for (let i = 0; i < cols.length; i++) {
                        for (let j = 0; j < cols.length; j++) {
                            const x = cols[i];
                            const y = cols[j];
                            const name = `(${x} + ${y})`;
                            let table = perspective.table(arrow.slice()).add_computed([
                                {
                                    computed_function_name: "+",
                                    inputs: [x, y],
                                    column: name
                                }
                            ]);

                            let view = table.view({
                                columns: [name]
                            });

                            let results = await view.to_columns();
                            let comparison;

                            if (i > 7 && j > 7) {
                                comparison = float_result;
                            } else if (i > 7 || j > 7) {
                                comparison = int_float_result;
                            } else {
                                comparison = int_result;
                            }

                            expect(results[name]).toEqual(comparison);
                            view.delete();
                            table.delete();
                        }
                    }
                });

                it("Should compute functions between all types, subtract", async function() {
                    const int_result = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    const int_float_result = [0, -0.5, 0, -0.5, 0, -0.5, 0, -0.5, 0, -0.5];
                    const float_int_result = [0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5];
                    for (let i = 0; i < cols.length; i++) {
                        for (let j = 0; j < cols.length; j++) {
                            const x = cols[i];
                            const y = cols[j];
                            const name = `(${x} - ${y})`;
                            let table = perspective.table(arrow.slice()).add_computed([
                                {
                                    computed_function_name: "-",
                                    inputs: [x, y],
                                    column: name
                                }
                            ]);

                            let view = table.view({
                                columns: [name]
                            });

                            let results = await view.to_columns();
                            let comparison;

                            if (x.includes("i") && y.includes("f")) {
                                comparison = int_float_result;
                            } else if (x.includes("f") && y.includes("i")) {
                                comparison = float_int_result;
                            } else {
                                comparison = int_result;
                            }

                            expect(results[name]).toEqual(comparison);
                            view.delete();
                            table.delete();
                        }
                    }
                });

                it("Should compute functions between all types, multiply", async function() {
                    const int_result = [0, 1, 9, 16, 36, 49, 81, 100, 144, 169];
                    const int_float_result = [0, 1.5, 9, 18, 36, 52.5, 81, 105, 144, 175.5];
                    const float_result = [0, 2.25, 9, 20.25, 36, 56.25, 81, 110.25, 144, 182.25];
                    for (let i = 0; i < cols.length; i++) {
                        for (let j = 0; j < cols.length; j++) {
                            const x = cols[i];
                            const y = cols[j];
                            const name = `(${x} * ${y})`;
                            let table = perspective.table(arrow.slice()).add_computed([
                                {
                                    computed_function_name: "*",
                                    inputs: [x, y],
                                    column: name
                                }
                            ]);

                            let view = table.view({
                                columns: [name]
                            });

                            let results = await view.to_columns();
                            let comparison;

                            if (x.includes("f") && y.includes("f")) {
                                comparison = float_result;
                            } else if (x.includes("f") || y.includes("f")) {
                                comparison = int_float_result;
                            } else {
                                comparison = int_result;
                            }

                            expect(results[name]).toEqual(comparison);
                            view.delete();
                            table.delete();
                        }
                    }
                });

                it("Should compute functions between all types, divide", async function() {
                    const int_result = [null, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                    const int_float_result = [null, 0.6666666666666666, 1, 0.8888888888888888, 1, 0.9333333333333333, 1, 0.9523809523809523, 1, 0.9629629629629629];
                    const int_float_result_precise = [null, 0.6666666865348816, 1, 0.8888888955116272, 1, 0.9333333373069763, 1, 0.9523809552192688, 1, 0.9629629850387573];
                    const float_int_result = [null, 1.5, 1, 1.125, 1, 1.0714285714285714, 1, 1.05, 1, 1.0384615384615385];
                    for (let i = 0; i < cols.length; i++) {
                        for (let j = 0; j < cols.length; j++) {
                            const x = cols[i];
                            const y = cols[j];
                            const name = `(${x} / ${y})`;
                            let table = perspective.table(arrow.slice()).add_computed([
                                {
                                    computed_function_name: "/",
                                    inputs: [x, y],
                                    column: name
                                }
                            ]);

                            let view = table.view({
                                columns: [name]
                            });

                            let results = await view.to_columns();
                            let comparison;

                            // 8 and 16-bit less precise when divided out
                            const narrow = i < 8 && j > 7;

                            if (narrow) {
                                comparison = int_float_result;
                            } else if (x.includes("f") && y.includes("i")) {
                                comparison = float_int_result;
                            } else if (x.includes("i") && y.includes("f")) {
                                comparison = int_float_result_precise;
                            } else {
                                comparison = int_result;
                            }

                            expect(results[name]).toEqual(comparison);
                            view.delete();
                            table.delete();
                        }
                    }
                });

                it("Should compute functions between all types, percent a of b", async function() {
                    const int_result = [null, 100, 100, 100, 100, 100, 100, 100, 100, 100];
                    const int_float_result = [null, 66.66666666666666, 100, 88.8888888888888888, 100, 93.33333333333333, 100, 95.23809523809523, 100, 96.29629629629629];
                    const float_int_result = [null, 150, 100, 112.5, 100, 107.14285714285714, 100, 105, 100, 103.84615384615385];
                    for (let i = 0; i < cols.length; i++) {
                        for (let j = 0; j < cols.length; j++) {
                            const x = cols[i];
                            const y = cols[j];
                            const name = `(${x} % ${y})`;
                            let table = perspective.table(arrow.slice()).add_computed([
                                {
                                    computed_function_name: "%",
                                    inputs: [x, y],
                                    column: name
                                }
                            ]);

                            let view = table.view({
                                columns: [name, x, y]
                            });

                            let results = await view.to_columns();
                            let expected;

                            if (x.includes("i") && y.includes("f")) {
                                expected = int_float_result;
                            } else if (x.includes("f") && y.includes("i")) {
                                expected = float_int_result;
                            } else {
                                expected = int_result;
                            }
                            expect(results[name]).toEqual(expected);
                            view.delete();
                            table.delete();
                        }
                    }
                });
            });
        });

        describe("row pivots", function() {
            it("should update on dependent columns", async function() {
                const table = perspective
                    .table([
                        {int: 1, float: 2.25, string: "a", datetime: new Date()},
                        {int: 2, float: 3.5, string: "b", datetime: new Date()},
                        {int: 3, float: 4.75, string: "c", datetime: new Date()},
                        {int: 4, float: 5.25, string: "d", datetime: new Date()}
                    ])
                    .add_computed([
                        {
                            column: "int+float",
                            computed_function_name: "+",
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({
                    row_pivots: ["int+float"]
                });

                table.update([{int: 4, __INDEX__: 0}]);

                let json = await view.to_json({
                    index: true
                });

                expect(json).toEqual([
                    {__ROW_PATH__: [], int: 13, "int+float": 28.75, float: 15.75, string: 4, datetime: 4, __INDEX__: [0, 3, 2, 1]},
                    {__ROW_PATH__: [5.5], int: 2, "int+float": 5.5, float: 3.5, string: 1, datetime: 1, __INDEX__: [1]},
                    {__ROW_PATH__: [6.25], int: 4, "int+float": 6.25, float: 2.25, string: 1, datetime: 1, __INDEX__: [0]},
                    {__ROW_PATH__: [7.75], int: 3, "int+float": 7.75, float: 4.75, string: 1, datetime: 1, __INDEX__: [2]},
                    {__ROW_PATH__: [9.25], int: 4, "int+float": 9.25, float: 5.25, string: 1, datetime: 1, __INDEX__: [3]}
                ]);

                view.delete();
                table.delete();
            });

            it("should update on dependent columns, add", async function() {
                const table = perspective
                    .table([
                        {int: 1, float: 2.25, string: "a", datetime: new Date()},
                        {int: 2, float: 3.5, string: "b", datetime: new Date()},
                        {int: 3, float: 4.75, string: "c", datetime: new Date()},
                        {int: 4, float: 5.25, string: "d", datetime: new Date()}
                    ])
                    .add_computed([
                        {
                            column: "int+float",
                            computed_function_name: "+",
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({
                    row_pivots: ["int+float"]
                });

                table.update([{int: 4, __INDEX__: 0}]);

                let json = await view.to_json({
                    index: true
                });

                expect(json).toEqual([
                    {__ROW_PATH__: [], int: 13, "int+float": 28.75, float: 15.75, string: 4, datetime: 4, __INDEX__: [0, 3, 2, 1]},
                    {__ROW_PATH__: [5.5], int: 2, "int+float": 5.5, float: 3.5, string: 1, datetime: 1, __INDEX__: [1]},
                    {__ROW_PATH__: [6.25], int: 4, "int+float": 6.25, float: 2.25, string: 1, datetime: 1, __INDEX__: [0]},
                    {__ROW_PATH__: [7.75], int: 3, "int+float": 7.75, float: 4.75, string: 1, datetime: 1, __INDEX__: [2]},
                    {__ROW_PATH__: [9.25], int: 4, "int+float": 9.25, float: 5.25, string: 1, datetime: 1, __INDEX__: [3]}
                ]);

                view.delete();
                table.delete();
            });

            it("should update on dependent columns, subtract", async function() {
                const table = perspective
                    .table([
                        {int: 1, float: 2.25, string: "a", datetime: new Date()},
                        {int: 2, float: 3.5, string: "b", datetime: new Date()},
                        {int: 3, float: 4.75, string: "c", datetime: new Date()},
                        {int: 4, float: 5.25, string: "d", datetime: new Date()}
                    ])
                    .add_computed([
                        {
                            column: "int-float",
                            computed_function_name: "-",
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({
                    row_pivots: ["int-float"]
                });

                table.update([{int: 4, __INDEX__: 0}]);

                let json = await view.to_json({
                    index: true
                });

                expect(json).toEqual([
                    {__ROW_PATH__: [], int: 13, "int-float": -2.75, float: 15.75, string: 4, datetime: 4, __INDEX__: [0, 3, 1, 2]},
                    {__ROW_PATH__: [-1.75], int: 3, "int-float": -1.75, float: 4.75, string: 1, datetime: 1, __INDEX__: [2]},
                    {__ROW_PATH__: [-1.5], int: 2, "int-float": -1.5, float: 3.5, string: 1, datetime: 1, __INDEX__: [1]},
                    {__ROW_PATH__: [-1.25], int: 4, "int-float": -1.25, float: 5.25, string: 1, datetime: 1, __INDEX__: [3]},
                    {__ROW_PATH__: [1.75], int: 4, "int-float": 1.75, float: 2.25, string: 1, datetime: 1, __INDEX__: [0]}
                ]);

                view.delete();
                table.delete();
            });

            it("should update on dependent columns, multiply", async function() {
                const table = perspective
                    .table([
                        {int: 1, float: 2.25, string: "a", datetime: new Date()},
                        {int: 2, float: 3.5, string: "b", datetime: new Date()},
                        {int: 3, float: 4.75, string: "c", datetime: new Date()},
                        {int: 4, float: 5.25, string: "d", datetime: new Date()}
                    ])
                    .add_computed([
                        {
                            column: "int * float",
                            computed_function_name: "*",
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({
                    row_pivots: ["int * float"]
                });

                table.update([{int: 4, __INDEX__: 0}]);

                let json = await view.to_json({
                    index: true
                });

                expect(json).toEqual([
                    {__ROW_PATH__: [], int: 13, "int * float": 51.25, float: 15.75, string: 4, datetime: 4, __INDEX__: [0, 3, 2, 1]},
                    {__ROW_PATH__: [7], int: 2, "int * float": 7, float: 3.5, string: 1, datetime: 1, __INDEX__: [1]},
                    {__ROW_PATH__: [9], int: 4, "int * float": 9, float: 2.25, string: 1, datetime: 1, __INDEX__: [0]},
                    {__ROW_PATH__: [14.25], int: 3, "int * float": 14.25, float: 4.75, string: 1, datetime: 1, __INDEX__: [2]},
                    {__ROW_PATH__: [21], int: 4, "int * float": 21, float: 5.25, string: 1, datetime: 1, __INDEX__: [3]}
                ]);

                view.delete();
                table.delete();
            });

            it("should update on dependent columns, divide", async function() {
                const table = perspective
                    .table([
                        {int: 1, float: 2.25, string: "a", datetime: new Date()},
                        {int: 2, float: 3.5, string: "b", datetime: new Date()},
                        {int: 3, float: 4.75, string: "c", datetime: new Date()},
                        {int: 4, float: 5.25, string: "d", datetime: new Date()}
                    ])
                    .add_computed([
                        {
                            column: "int / float",
                            computed_function_name: "/",
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({
                    row_pivots: ["int / float"]
                });

                table.update([{int: 4, __INDEX__: 0}]);

                let json = await view.to_json({
                    index: true
                });

                expect(json).toEqual([
                    {__ROW_PATH__: [], int: 13, "int / float": 3.742690058479532, float: 15.75, string: 4, datetime: 4, __INDEX__: [0, 3, 2, 1]},
                    {__ROW_PATH__: [0.5714285714285714], int: 2, "int / float": 0.5714285714285714, float: 3.5, string: 1, datetime: 1, __INDEX__: [1]},
                    {__ROW_PATH__: [0.631578947368421], int: 3, "int / float": 0.631578947368421, float: 4.75, string: 1, datetime: 1, __INDEX__: [2]},
                    {__ROW_PATH__: [0.7619047619047619], int: 4, "int / float": 0.7619047619047619, float: 5.25, string: 1, datetime: 1, __INDEX__: [3]},
                    {__ROW_PATH__: [1.7777777777777777], int: 4, "int / float": 1.7777777777777777, float: 2.25, string: 1, datetime: 1, __INDEX__: [0]}
                ]);

                view.delete();
                table.delete();
            });
        });

        describe("Partial update with null", function() {
            it.skip("Null poison", async function() {
                const table = perspective
                    .table(
                        [
                            {int: 1, float: 2.25, string: "a", datetime: new Date()},
                            {int: 2, float: 3.5, string: "b", datetime: new Date()},
                            {int: 3, float: 4.75, string: "c", datetime: new Date()},
                            {int: 4, float: 5.25, string: "d", datetime: new Date()}
                        ],
                        {index: "int"}
                    )
                    .add_computed([
                        {
                            column: "new",
                            computed_function_name: "+",
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({columns: ["new", "int", "float"]});

                table.update([{int: 2, float: null}]);

                let result = await view.to_columns();

                expect(result).toEqual({
                    new: [3.25, null, 4.75, 5.25],
                    int: [1, 2, 3, 4],
                    float: [2.25, null, 4.75, 5.25]
                });

                view.delete();
                table.delete();
            });

            it.skip("Null poison, unset", async function() {
                const table = perspective
                    .table(
                        [
                            {int: 1, float: 2.25, string: "a", datetime: new Date()},
                            {int: 2, float: 3.5, string: "b", datetime: new Date()},
                            {int: 3, float: 4.75, string: "c", datetime: new Date()},
                            {int: 4, float: 5.25, string: "d", datetime: new Date()}
                        ],
                        {index: "int"}
                    )
                    .add_computed([
                        {
                            column: "new",
                            computed_function_name: "+",
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({columns: ["new", "int", "float"]});

                table.update([{int: 2, float: undefined}]);

                let result = await view.to_columns();

                expect(result).toEqual({
                    new: [3.25, null, 4.75, 5.25],
                    int: [1, 2, 3, 4],
                    float: [2.25, null, 4.75, 5.25]
                });

                view.delete();
                table.delete();
            });
        });
    });
};
