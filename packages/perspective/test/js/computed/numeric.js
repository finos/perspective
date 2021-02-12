/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const common = require("./common.js");

/**
 * Tests the correctness of each numeric computation function in various
 * environments and parameters - different types, nulls, undefined, etc.
 */
module.exports = perspective => {
    describe("Numeric computed columns", function() {
        describe("Numeric, arity 1", function() {
            describe("All data types", function() {
                it("Should compute functions between all types, abs", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `abs(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "abs",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });

                        let results = await view.to_columns();
                        expect(results[name]).toEqual(results[x]);
                        await view.delete();
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, sqrt", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `sqrt(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "sqrt",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });

                        let results = await view.to_columns();
                        expect(results[name]).toEqual(results[x].map(val => Math.sqrt(val)));
                        await view.delete();
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, invert", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `invert(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "1/x",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => 1 / val);
                        expected[0] = null;
                        expect(results[name]).toEqual(expected);
                        await view.delete();
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, pow", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `pow(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "x^2",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.pow(val, 2));
                        expect(results[name]).toEqual(expected);
                        await view.delete();
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, bucket 10", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `bucket(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "Bucket (10)",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 10) * 10);
                        expect(results[name]).toEqual(expected);
                        await view.delete();
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, bucket 100", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `bucket(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "Bucket (100)",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 100) * 100);
                        expect(results[name]).toEqual(expected);
                        await view.delete();
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, bucket 1000", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `bucket(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "Bucket (1000)",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 1000) * 1000);
                        expect(results[name]).toEqual(expected);
                        await view.delete();
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, bucket 1/10", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `bucket(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "Bucket (1/10)",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 0.1) * 0.1);
                        expect(results[name]).toEqual(expected);
                        await view.delete();
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, bucket 1/100", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `bucket(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "Bucket (1/100)",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });

                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 0.01) * 0.01);
                        expect(results[name]).toEqual(expected);
                        await view.delete();
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, bucket 1/1000", async function() {
                    let table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        const x = common.cols[i];
                        const name = `bucket(${x})`;
                        let view = await table.view({
                            columns: [name, x],
                            computed_columns: [
                                {
                                    computed_function_name: "Bucket (1/1000)",
                                    inputs: [x],
                                    column: name
                                }
                            ]
                        });
                        let results = await view.to_columns();
                        let expected = results[x].map(val => Math.floor(val / 0.001) * 0.001);
                        expect(results[name]).toEqual(expected);
                        await view.delete();
                    }
                    await table.delete();
                });
            });

            it("Square root of int", async function() {
                const table = await perspective.table({
                    a: [4, 9, 16, 20, 81, 1000]
                });
                let view = await table.view({
                    columns: ["sqrt"],
                    computed_columns: [
                        {
                            column: "sqrt",
                            computed_function_name: "sqrt",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.sqrt).toEqual([2, 3, 4, 4.47213595499958, 9, 31.622776601683793]);
                await view.delete();
                await table.delete();
            });

            it("Square root of int, nulls", async function() {
                const table = await perspective.table({
                    a: [4, 9, null, undefined, 16]
                });
                let view = await table.view({
                    columns: ["sqrt"],
                    computed_columns: [
                        {
                            column: "sqrt",
                            computed_function_name: "sqrt",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.sqrt).toEqual([2, 3, null, null, 4]);
                await view.delete();
                await table.delete();
            });

            it("Square root of float", async function() {
                const table = await perspective.table({
                    a: [4.5, 9.5, 16.5, 20.5, 81.5, 1000.5]
                });
                let view = await table.view({
                    columns: ["sqrt"],
                    computed_columns: [
                        {
                            column: "sqrt",
                            computed_function_name: "sqrt",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.sqrt).toEqual([2.1213203435596424, 3.082207001484488, 4.06201920231798, 4.527692569068709, 9.027735042633894, 31.63068130786942]);
                await view.delete();
                await table.delete();
            });

            it("Square root of float, null", async function() {
                const table = await perspective.table({
                    a: [4.5, 9.5, null, undefined, 16.5]
                });
                let view = await table.view({
                    columns: ["sqrt"],
                    computed_columns: [
                        {
                            column: "sqrt",
                            computed_function_name: "sqrt",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.sqrt).toEqual([2.1213203435596424, 3.082207001484488, null, null, 4.06201920231798]);
                await view.delete();
                await table.delete();
            });

            it("Pow^2 of int", async function() {
                const table = await perspective.table({
                    a: [2, 4, 6, 8, 10]
                });
                let view = await table.view({
                    columns: ["pow2"],
                    computed_columns: [
                        {
                            column: "pow2",
                            computed_function_name: "x^2",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.pow2).toEqual([4, 16, 36, 64, 100]);
                await view.delete();
                await table.delete();
            });

            it("Pow^2 of int, nulls", async function() {
                const table = await perspective.table({
                    a: [2, 4, null, undefined, 10]
                });
                let view = await table.view({
                    columns: ["pow2"],
                    computed_columns: [
                        {
                            column: "pow2",
                            computed_function_name: "x^2",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.pow2).toEqual([4, 16, null, null, 100]);
                await view.delete();
                await table.delete();
            });

            it("Pow^2 of float", async function() {
                const table = await perspective.table({
                    a: [2.5, 4.5, 6.5, 8.5, 10.5]
                });
                let view = await table.view({
                    columns: ["pow2"],
                    computed_columns: [
                        {
                            column: "pow2",
                            computed_function_name: "x^2",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.pow2).toEqual([6.25, 20.25, 42.25, 72.25, 110.25]);
                await view.delete();
                await table.delete();
            });

            it("Pow^2 of float, nulls", async function() {
                const table = await perspective.table({
                    a: [2.5, 4.5, null, undefined, 10.5]
                });
                let view = await table.view({
                    columns: ["pow2"],
                    computed_columns: [
                        {
                            column: "pow2",
                            computed_function_name: "x^2",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.pow2).toEqual([6.25, 20.25, null, null, 110.25]);
                await view.delete();
                await table.delete();
            });

            it("Invert int", async function() {
                const table = await perspective.table({
                    a: [2, 4, 6, 8, 10]
                });
                let view = await table.view({
                    columns: ["invert"],
                    computed_columns: [
                        {
                            column: "invert",
                            computed_function_name: "1/x",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.invert).toEqual([0.5, 0.25, 0.16666666666666666, 0.125, 0.1]);
                await view.delete();
                await table.delete();
            });

            it("Invert int, nulls", async function() {
                const table = await perspective.table({
                    a: [2, 4, null, undefined, 10]
                });
                let view = await table.view({
                    columns: ["invert"],
                    computed_columns: [
                        {
                            column: "invert",
                            computed_function_name: "1/x",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.invert).toEqual([0.5, 0.25, null, null, 0.1]);
                await view.delete();
                await table.delete();
            });

            it("Invert float", async function() {
                const table = await perspective.table({
                    a: [2.5, 4.5, 6.5, 8.5, 10.5]
                });
                let view = await table.view({
                    columns: ["invert"],
                    computed_columns: [
                        {
                            column: "invert",
                            computed_function_name: "1/x",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.invert).toEqual([0.4, 0.2222222222222222, 0.15384615384615385, 0.11764705882352941, 0.09523809523809523]);
                await view.delete();
                await table.delete();
            });

            it("Invert float, nulls", async function() {
                const table = await perspective.table({
                    a: [2.5, 4.5, null, undefined, 10.5]
                });
                let view = await table.view({
                    columns: ["invert"],
                    computed_columns: [
                        {
                            column: "invert",
                            computed_function_name: "1/x",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.invert).toEqual([0.4, 0.2222222222222222, null, null, 0.09523809523809523]);
                await view.delete();
                await table.delete();
            });

            it("Log int", async function() {
                const table = await perspective.table({
                    a: [2, 4, 6, 8, 10]
                });
                let view = await table.view({
                    columns: ["log"],
                    computed_columns: [
                        {
                            column: "log",
                            computed_function_name: "log",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.log).toEqual([2, 4, 6, 8, 10].map(x => Math.log(x)));
                await view.delete();
                await table.delete();
            });

            it("Log int, nulls", async function() {
                const table = await perspective.table({
                    a: [2, 4, null, undefined, 10]
                });
                let view = await table.view({
                    columns: ["log"],
                    computed_columns: [
                        {
                            column: "log",
                            computed_function_name: "log",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                let expected = [2, 4, 6, 8, 10].map(x => Math.log(x));
                expected[2] = null;
                expected[3] = null;
                expect(result.log).toEqual(expected);
                await view.delete();
                await table.delete();
            });

            it("Log float", async function() {
                const table = await perspective.table({
                    a: [2.5, 4.5, 6.5, 8.5, 10.5]
                });
                let view = await table.view({
                    columns: ["log"],
                    computed_columns: [
                        {
                            column: "log",
                            computed_function_name: "log",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result.log).toEqual([2.5, 4.5, 6.5, 8.5, 10.5].map(x => Math.log(x)));
                await view.delete();
                await table.delete();
            });

            it("Log float, nulls", async function() {
                const table = await perspective.table({
                    a: [2.5, 4.5, null, undefined, 10.5]
                });
                let view = await table.view({
                    columns: ["log"],
                    computed_columns: [
                        {
                            column: "log",
                            computed_function_name: "log",
                            inputs: ["a"]
                        }
                    ]
                });
                let result = await view.to_columns();
                let expected = [2.5, 4.5, null, undefined, 10.5].map(x => Math.log(x));
                expected[2] = null;
                expected[3] = null;
                expect(result.log).toEqual(expected);
                await view.delete();
                await table.delete();
            });
        });

        describe("Numeric, arity 2", function() {
            describe("All data types", function() {
                it("Should compute functions between all types, add", async function() {
                    const int_result = [0, 2, 6, 8, 12, 14, 18, 20, 24, 26];
                    const int_float_result = [0, 2.5, 6, 8.5, 12, 14.5, 18, 20.5, 24, 26.5];
                    const float_result = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27];
                    const table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        for (let j = 0; j < common.cols.length; j++) {
                            const x = common.cols[i];
                            const y = common.cols[j];
                            const name = `(${x} + ${y})`;
                            const view = await table.view({
                                columns: [name, x, y],
                                computed_columns: [
                                    {
                                        computed_function_name: "+",
                                        inputs: [x, y],
                                        column: name
                                    }
                                ]
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
                            await view.delete();
                        }
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, subtract", async function() {
                    const int_result = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    const int_float_result = [0, -0.5, 0, -0.5, 0, -0.5, 0, -0.5, 0, -0.5];
                    const float_int_result = [0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5];
                    const table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        for (let j = 0; j < common.cols.length; j++) {
                            const x = common.cols[i];
                            const y = common.cols[j];
                            const name = `(${x} - ${y})`;
                            const view = await table.view({
                                columns: [name, x, y],
                                computed_columns: [
                                    {
                                        computed_function_name: "-",
                                        inputs: [x, y],
                                        column: name
                                    }
                                ]
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
                            await view.delete();
                        }
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, multiply", async function() {
                    const int_result = [0, 1, 9, 16, 36, 49, 81, 100, 144, 169];
                    const int_float_result = [0, 1.5, 9, 18, 36, 52.5, 81, 105, 144, 175.5];
                    const float_result = [0, 2.25, 9, 20.25, 36, 56.25, 81, 110.25, 144, 182.25];
                    const table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        for (let j = 0; j < common.cols.length; j++) {
                            const x = common.cols[i];
                            const y = common.cols[j];
                            const name = `(${x} * ${y})`;
                            const view = await table.view({
                                columns: [name, x, y],
                                computed_columns: [
                                    {
                                        computed_function_name: "*",
                                        inputs: [x, y],
                                        column: name
                                    }
                                ]
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
                            await view.delete();
                        }
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, divide", async function() {
                    const int_result = [null, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                    const int_float_result = [null, 0.6666666666666666, 1, 0.8888888888888888, 1, 0.9333333333333333, 1, 0.9523809523809523, 1, 0.9629629629629629];
                    const int_float_result_precise = [null, 0.6666666865348816, 1, 0.8888888955116272, 1, 0.9333333373069763, 1, 0.9523809552192688, 1, 0.9629629850387573];
                    const float_int_result = [null, 1.5, 1, 1.125, 1, 1.0714285714285714, 1, 1.05, 1, 1.0384615384615385];
                    const table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        for (let j = 0; j < common.cols.length; j++) {
                            const x = common.cols[i];
                            const y = common.cols[j];
                            const name = `(${x} / ${y})`;
                            const view = await table.view({
                                columns: [name, x, y],
                                computed_columns: [
                                    {
                                        computed_function_name: "/",
                                        inputs: [x, y],
                                        column: name
                                    }
                                ]
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
                            await view.delete();
                        }
                    }
                    await table.delete();
                });

                it("Should compute functions between all types, percent a of b", async function() {
                    const int_result = [null, 100, 100, 100, 100, 100, 100, 100, 100, 100];
                    const int_float_result = [null, 66.66666666666666, 100, 88.8888888888888888, 100, 93.33333333333333, 100, 95.23809523809523, 100, 96.29629629629629];
                    const float_int_result = [null, 150, 100, 112.5, 100, 107.14285714285714, 100, 105, 100, 103.84615384615385];
                    const table = await perspective.table(common.arrow.slice());
                    for (let i = 0; i < common.cols.length; i++) {
                        for (let j = 0; j < common.cols.length; j++) {
                            const x = common.cols[i];
                            const y = common.cols[j];
                            const name = `(${x} % ${y})`;
                            const view = await table.view({
                                columns: [name, x, y],
                                computed_columns: [
                                    {
                                        computed_function_name: "%",
                                        inputs: [x, y],
                                        column: name
                                    }
                                ]
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
                            await view.delete();
                        }
                    }
                    await table.delete();
                });
            });

            it("Computed column of arity 2, add ints", async function() {
                const table = await perspective.table(common.int_float_data);

                const view = await table.view({
                    columns: ["sum"],
                    computed_columns: [
                        {
                            column: "sum",
                            computed_function_name: "+",
                            inputs: ["x", "x"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{sum: 2}, {sum: 4}, {sum: 6}, {sum: 8}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, add floats", async function() {
                const table = await perspective.table(common.int_float_data);

                const view = await table.view({
                    columns: ["sum"],
                    computed_columns: [
                        {
                            column: "sum",
                            computed_function_name: "+",
                            inputs: ["w", "w"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{sum: 3}, {sum: 5}, {sum: 7}, {sum: 9}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, add mixed", async function() {
                const table = await perspective.table(common.int_float_data);

                const view = await table.view({
                    columns: ["sum"],
                    computed_columns: [
                        {
                            column: "sum",
                            computed_function_name: "+",
                            inputs: ["w", "x"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{sum: 2.5}, {sum: 4.5}, {sum: 6.5}, {sum: 8.5}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, add with null", async function() {
                const table = await perspective.table({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, undefined, 2.5, 3.5, 4.5]
                });

                const full = await table.view();
                expect(await full.to_columns()).toEqual({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, null, 2.5, 3.5, 4.5]
                });
                full.delete();

                const view = await table.view({
                    columns: ["sum"],
                    computed_columns: [
                        {
                            column: "sum",
                            computed_function_name: "+",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["sum"]).toEqual([2.5, null, null, 6.5, 8.5]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, subtract ints", async function() {
                const table = await perspective.table(common.int_float_subtract_data);
                const view = await table.view({
                    columns: ["difference"],
                    computed_columns: [
                        {
                            column: "difference",
                            computed_function_name: "-",
                            inputs: ["v", "x"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{difference: 1}, {difference: 1}, {difference: 1}, {difference: 1}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, subtract floats", async function() {
                const table = await perspective.table(common.int_float_subtract_data);
                const view = await table.view({
                    columns: ["difference"],
                    computed_columns: [
                        {
                            column: "difference",
                            computed_function_name: "-",
                            inputs: ["u", "w"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{difference: 1}, {difference: 1}, {difference: 1}, {difference: 1}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, subtract mixed", async function() {
                const table = await perspective.table(common.int_float_data);
                const view = await table.view({
                    columns: ["difference"],
                    computed_columns: [
                        {
                            column: "difference",
                            computed_function_name: "-",
                            inputs: ["w", "x"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{difference: 0.5}, {difference: 0.5}, {difference: 0.5}, {difference: 0.5}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, subtract with null", async function() {
                const table = await perspective.table({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, undefined, 2.5, 3.5, 4.5]
                });

                const full = await table.view();
                expect(await full.to_columns()).toEqual({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, null, 2.5, 3.5, 4.5]
                });
                full.delete();

                const view = await table.view({
                    columns: ["difference"],
                    computed_columns: [
                        {
                            column: "difference",
                            computed_function_name: "-",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["difference"]).toEqual([-0.5, null, null, -0.5, -0.5]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, multiply ints", async function() {
                const table = await perspective.table(common.int_float_subtract_data);

                const view = await table.view({
                    columns: ["multiply"],
                    computed_columns: [
                        {
                            column: "multiply",
                            computed_function_name: "*",
                            inputs: ["v", "x"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{multiply: 2}, {multiply: 6}, {multiply: 12}, {multiply: 20}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, multiply floats", async function() {
                const table = await perspective.table(common.int_float_subtract_data);

                const view = await table.view({
                    columns: ["multiply"],
                    computed_columns: [
                        {
                            column: "multiply",
                            computed_function_name: "*",
                            inputs: ["u", "w"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{multiply: 3.75}, {multiply: 8.75}, {multiply: 15.75}, {multiply: 24.75}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, multiply mixed", async function() {
                const table = await perspective.table(common.int_float_data);

                const view = await table.view({
                    columns: ["multiply"],
                    computed_columns: [
                        {
                            column: "multiply",
                            computed_function_name: "*",
                            inputs: ["w", "x"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{multiply: 1.5}, {multiply: 5}, {multiply: 10.5}, {multiply: 18}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, multiply with null", async function() {
                const table = await perspective.table({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, undefined, 2.5, 3.5, 4.5]
                });

                const full = await table.view();
                expect(await full.to_columns()).toEqual({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, null, 2.5, 3.5, 4.5]
                });
                full.delete();

                const view = await table.view({
                    columns: ["product"],
                    computed_columns: [
                        {
                            column: "product",
                            computed_function_name: "*",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["product"]).toEqual([1.5, null, null, 10.5, 18]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, divide ints", async function() {
                const table = await perspective.table(common.int_float_subtract_data);

                const view = await table.view({
                    columns: ["divide"],
                    computed_columns: [
                        {
                            column: "divide",
                            computed_function_name: "/",
                            inputs: ["v", "x"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{divide: 2}, {divide: 1.5}, {divide: 1.3333333333333333}, {divide: 1.25}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, divide floats", async function() {
                const table = await perspective.table(common.int_float_subtract_data);
                const view = await table.view({
                    columns: ["divide"],
                    computed_columns: [
                        {
                            column: "divide",
                            computed_function_name: "/",
                            inputs: ["u", "w"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{divide: 1.6666666666666667}, {divide: 1.4}, {divide: 1.2857142857142858}, {divide: 1.2222222222222223}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, divide mixed", async function() {
                const table = await perspective.table(common.int_float_data);
                const view = await table.view({
                    columns: ["divide"],
                    computed_columns: [
                        {
                            column: "divide",
                            computed_function_name: "/",
                            inputs: ["w", "x"]
                        }
                    ]
                });
                let result = await view.to_json();
                expect(result).toEqual([{divide: 1.5}, {divide: 1.25}, {divide: 1.1666666666666667}, {divide: 1.125}]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, divide with null", async function() {
                const table = await perspective.table({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, undefined, 2.5, 3.5, 4.5]
                });

                const full = await table.view();
                expect(await full.to_columns()).toEqual({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, null, 2.5, 3.5, 4.5]
                });
                full.delete();

                const view = await table.view({
                    columns: ["divide"],
                    computed_columns: [
                        {
                            column: "divide",
                            computed_function_name: "/",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["divide"]).toEqual([0.6666666666666666, null, null, 0.8571428571428571, 0.8888888888888888]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, pow ints", async function() {
                const table = await perspective.table(common.int_float_subtract_data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "pow",
                            computed_function_name: "pow",
                            inputs: ["v", "x"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["pow"]).toEqual(result["v"].map((x, idx) => Math.pow(x, result["x"][idx])));
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, pow floats", async function() {
                const table = await perspective.table(common.int_float_subtract_data);
                const view = await table.view({
                    computed_columns: [
                        {
                            column: "pow",
                            computed_function_name: "pow",
                            inputs: ["v", "x"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["pow"]).toEqual(result["v"].map((x, idx) => Math.pow(x, result["x"][idx])));
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, pow mixed", async function() {
                const table = await perspective.table(common.int_float_data);
                const view = await table.view({
                    computed_columns: [
                        {
                            column: "pow",
                            computed_function_name: "pow",
                            inputs: ["w", "x"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["pow"]).toEqual(result["w"].map((x, idx) => Math.pow(x, result["x"][idx])));
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, pow with null", async function() {
                const table = await perspective.table({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, undefined, 2.5, 3.5, 4.5]
                });

                const full = await table.view();
                expect(await full.to_columns()).toEqual({
                    a: [1, 2, null, 3, 4],
                    b: [1.5, null, 2.5, 3.5, 4.5]
                });
                full.delete();

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "pow",
                            computed_function_name: "pow",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                let expected = result["a"].map((x, idx) => (x ? Math.pow(x, result["b"][idx]) : null));
                expected[1] = null;
                expect(result["pow"]).toEqual(expected);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, pow with null and negative and 0", async function() {
                const table = await perspective.table({
                    a: [1, 1, 2, null, 3, 4, 5, -100, -25],
                    b: [0, 1.5, undefined, 2.5, 3.5, 4.5, -10, 0, -5]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "pow",
                            computed_function_name: "pow",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                let expected = result["a"].map((x, idx) => (x ? Math.pow(x, result["b"][idx]) : null));
                expected[0] = null;
                expected[2] = null;
                expected[expected.length - 2] = null; // cannot raise ^0
                expect(result["pow"]).toEqual(expected);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, percent a of b, ints", async function() {
                const table = await perspective.table({
                    a: [100, 75, 50, 25, 10, 1],
                    b: [100, 100, 100, 100, 100, 100]
                });
                const view = await table.view({
                    columns: ["%"],
                    computed_columns: [
                        {
                            column: "%",
                            computed_function_name: "%",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["%"]).toEqual([100, 75, 50, 25, 10, 1]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, percent a of b, floats", async function() {
                const table = await perspective.table({
                    a: [7.5, 5.5, 2.5, 1.5, 0.5],
                    b: [22.5, 16.5, 7.5, 4.5, 1.5]
                });
                const view = await table.view({
                    columns: ["%"],
                    computed_columns: [
                        {
                            column: "%",
                            computed_function_name: "%",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["%"]).toEqual([33.33333333333333, 33.33333333333333, 33.33333333333333, 33.33333333333333, 33.33333333333333]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, percent a of b, mixed", async function() {
                const table = await perspective.table({
                    a: [55.5, 65.5, 75.5, 85.5, 95.5],
                    b: [100, 100, 100, 100, 100]
                });
                const view = await table.view({
                    columns: ["%"],
                    computed_columns: [
                        {
                            column: "%",
                            computed_function_name: "%",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["%"]).toEqual([55.50000000000001, 65.5, 75.5, 85.5, 95.5]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, percent a of b, with null", async function() {
                const table = await perspective.table({
                    a: [100, null, 50, 25, 10, 1],
                    b: [100, 100, 100, 100, undefined, 100]
                });
                const view = await table.view({
                    columns: ["%"],
                    computed_columns: [
                        {
                            column: "%",
                            computed_function_name: "%",
                            inputs: ["a", "b"]
                        }
                    ]
                });
                let result = await view.to_columns();
                expect(result["%"]).toEqual([100, null, 50, 25, null, 1]);
                await view.delete();
                await table.delete();
            });

            it("Computed column of arity 2, equals, ints", async function() {
                const table = await perspective.table({
                    a: [100, 75, 50, 25, 10, 1],
                    b: [100, 100, 100, 100, 100, 100]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "==",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, false, false, false, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, equals, floats", async function() {
                const table = await perspective.table({
                    a: [1.2222222222, 5.5, 7.55555555555, 9.5],
                    b: [1.22222222222, 5.5, 7.55555555555, 4.5]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "==",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, true, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, equals, mixed", async function() {
                const table = await perspective.table({
                    a: [100.0, 65.5, 100.0, 85.5, 95.5],
                    b: [100, 100, 100, 100, 100]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "==",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, true, false, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, equals, with null", async function() {
                const table = await perspective.table({
                    a: [100, null, 50.0, 25, 10, 1],
                    b: [100, undefined, 50, 100, undefined, 100]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "==",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([true, null, true, false, null, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, not equals, ints", async function() {
                const table = await perspective.table({
                    a: [100, 75, 50, 25, 10, 1],
                    b: [100, 100, 100, 100, 100, 100]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "!=",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, true, true, true, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, not equals, floats", async function() {
                const table = await perspective.table({
                    a: [1.2222222222, 5.5, 7.55555555555, 9.5],
                    b: [1.22222222222, 5.5, 7.55555555555, 4.5]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "!=",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, false, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, not equals, mixed", async function() {
                const table = await perspective.table({
                    a: [100.0, 65.5, 100.0, 85.5, 95.5],
                    b: [100, 100, 100, 100, 100]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "!=",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, false, true, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, not equals, with null", async function() {
                const table = await perspective.table({
                    a: [100, null, 50.0, 25, 10, 1],
                    b: [100, undefined, 50, 100, undefined, 100]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "!=",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([false, null, false, true, null, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, greater than, ints", async function() {
                const table = await perspective.table({
                    a: [100, 75, 50, 25, 10, 1],
                    b: [100, 100, 100, 100, 100, 0]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: ">",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([false, false, false, false, false, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, greater than, floats", async function() {
                const table = await perspective.table({
                    a: [1.22222222223, 5.5, 7.55555555555, 0.555555556],
                    b: [1.22222222222, 5.5, 7.55555555555, 0.555555555]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: ">",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, false, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, greater than, mixed", async function() {
                const table = await perspective.table({
                    a: [100.0, 65.5, 100.0, 85.5, 95.5],
                    b: [100, 100, 100, 100, 5]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: ">",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([false, false, false, false, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, greater than, with null", async function() {
                const table = await perspective.table({
                    a: [100, null, 50.0, 25, 10, 10000],
                    b: [100, undefined, 50, 100, undefined, 100]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: ">",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([false, null, false, false, null, true]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, less than, ints", async function() {
                const table = await perspective.table({
                    a: [100, 75, 50, 25, 10, 1],
                    b: [100, 100, 100, 100, 100, 0]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "<",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, true, true, true, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, less than, floats", async function() {
                const table = await perspective.table({
                    a: [1.2222222222, 5.5, 7.1, 9.5],
                    b: [1.22222222222, 5.5, 7.55555555555, 4.5]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "<",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([true, false, true, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, less than, mixed", async function() {
                const table = await perspective.table({
                    a: [100.0, 65.5, 100.0, 85.5, 95.5],
                    b: [100, 100, 100, 100, 5]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "<",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([false, true, false, true, false]);
                view.delete();
                table.delete();
            });

            it("Computed column of arity 2, less than, with null", async function() {
                const table = await perspective.table({
                    a: [10, null, 50.0, 25, 10, 10000],
                    b: [100, undefined, 50, 100, undefined, 100]
                });

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "<",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const result = await view.to_columns();
                expect(result["result"]).toEqual([true, null, false, true, null, false]);
                view.delete();
                table.delete();
            });
        });
    });
};
