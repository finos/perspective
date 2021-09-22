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
module.exports = (perspective) => {
    describe("Expression structures", function () {
        describe("if statements", function () {
            it("if without else should be invalid", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const validate = await table.validate_expressions([
                    'if ("w" > 1) 5;',
                    'if ("w" > 1) 5',
                ]);

                expect(
                    validate.expression_schema['if ("w" > 1) 5;']
                ).toBeUndefined();
                expect(
                    validate.expression_schema['if ("w" > 1) 5']
                ).toBeUndefined();

                expect(validate.errors).toEqual({
                    'if ("w" > 1) 5': {
                        column: 0,
                        error_message:
                            "Type Error - inputs do not resolve to a valid expression.",
                        line: 0,
                    },
                    'if ("w" > 1) 5;': {
                        column: 0,
                        error_message:
                            "Type Error - inputs do not resolve to a valid expression.",
                        line: 0,
                    },
                });

                table.delete();
            });

            it.skip("if else with multiple return types should be invalid", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: ["if (\"w\" == 1.5) 5; else 'abc'"],
                });
                const results = await view.to_columns();

                // TODO: we should prevent this polymorphic return from being
                // allowed, but the machinery around how if/else returns is
                // opaque to me at the moment.
                expect(results["if (\"w\" == 1.5) 5; else 'abc'"]).toEqual([
                    "",
                    "abc",
                    "abc",
                    "abc",
                ]);
                view.delete();
                table.delete();
            });

            it("functional if", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        'if ("w" > 2, 5, 10);',
                        'if ("w" == 1.5, 5, 10)',
                    ],
                });

                const results = await view.to_columns();
                expect(results['if ("w" > 2, 5, 10);']).toEqual([10, 5, 5, 5]);
                expect(results['if ("w" == 1.5, 5, 10)']).toEqual([
                    5, 10, 10, 10,
                ]);
                view.delete();
                table.delete();
            });

            it("functional if string", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        "if (\"y\" == 'a', 5, 10);",
                        "if (\"y\" != 'a', 5, 10)",
                    ],
                });

                const results = await view.to_columns();
                expect(results["if (\"y\" == 'a', 5, 10);"]).toEqual([
                    5, 10, 10, 10,
                ]);
                expect(results["if (\"y\" != 'a', 5, 10)"]).toEqual([
                    10, 5, 5, 5,
                ]);
                view.delete();
                table.delete();
            });

            it.skip("functional if bool", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        'if ("z" == true, 5, 10);',
                        'if ("z" != true, 5, 10)',
                    ],
                });

                const results = await view.to_columns();
                expect(results['if ("z" == 1, 5, 10);']).toEqual([
                    5, 10, 5, 10,
                ]);
                expect(results['if ("z" != true, 5, 10)']).toEqual([
                    10, 5, 10, 5,
                ]);
                view.delete();
                table.delete();
            });

            it("functional if date", async function () {
                const table = await perspective.table({
                    a: "date",
                    b: "date",
                });

                const view = await table.view({
                    expressions: [
                        'if ("a" == "b", 5, 10);',
                        'if ("a" < "b", 5, 10)',
                    ],
                });

                table.update({
                    a: [
                        new Date(2020, 3, 1),
                        new Date(2012, 0, 30),
                        new Date(2018, 9, 31),
                        new Date(2020, 1, 29),
                    ],
                    b: [
                        new Date(2020, 3, 1),
                        new Date(2012, 1, 30),
                        new Date(2018, 10, 31),
                        new Date(2020, 1, 29),
                    ],
                });

                const results = await view.to_columns();
                expect(results['if ("a" == "b", 5, 10);']).toEqual([
                    5, 10, 10, 5,
                ]);
                expect(results['if ("a" < "b", 5, 10)']).toEqual([
                    10, 5, 5, 10,
                ]);

                view.delete();
                table.delete();
            });

            it("functional if datetime", async function () {
                const table = await perspective.table({
                    a: "datetime",
                    b: "datetime",
                });

                const view = await table.view({
                    expressions: [
                        'if ("a" >= "b", 5, 10);',
                        'if ("a" < "b", 5, 10)',
                    ],
                });

                table.update({
                    a: [
                        new Date(2020, 3, 1, 12, 30, 45, 850),
                        new Date(2012, 0, 30, 19, 25),
                        new Date(2018, 9, 31, 3, 13),
                        new Date(2020, 1, 29, 23, 59, 59),
                    ],
                    b: [
                        new Date(2020, 3, 1, 12, 30, 45, 850),
                        new Date(2012, 1, 30),
                        new Date(2018, 10, 31),
                        new Date(2020, 1, 29),
                    ],
                });

                const results = await view.to_columns();
                expect(results['if ("a" >= "b", 5, 10);']).toEqual([
                    5, 10, 10, 5,
                ]);
                expect(results['if ("a" < "b", 5, 10)']).toEqual([
                    10, 5, 5, 10,
                ]);
                view.delete();
                table.delete();
            });

            it("ternary if", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: ['"w" > 2 ? 5 : 10;', '"w" == 1.5 ? 5 : 10'],
                });

                const results = await view.to_columns();
                expect(results['"w" > 2 ? 5 : 10;']).toEqual([10, 5, 5, 5]);
                expect(results['"w" == 1.5 ? 5 : 10']).toEqual([5, 10, 10, 10]);
                view.delete();
                table.delete();
            });

            it("ternary if string", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        "\"y\" == 'a' ? 5 : 10;",
                        "\"y\" != 'a' ? 5 : 10",
                    ],
                });

                const results = await view.to_columns();
                expect(results["\"y\" == 'a' ? 5 : 10;"]).toEqual([
                    5, 10, 10, 10,
                ]);
                expect(results["\"y\" != 'a' ? 5 : 10"]).toEqual([10, 5, 5, 5]);
                view.delete();
                table.delete();
            });

            it.skip("ternary if bool", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        '"z" == true ? 5 : 10;',
                        '"z" != true ? 5 : 10',
                    ],
                });

                const results = await view.to_columns();
                expect(results['"z" == 1 ? 5 : 10;']).toEqual([5, 10, 5, 10]);
                expect(results['"z" != true ? 5 : 10']).toEqual([10, 5, 10, 5]);
                view.delete();
                table.delete();
            });

            it("ternary if date", async function () {
                const table = await perspective.table({
                    a: "date",
                    b: "date",
                });

                const view = await table.view({
                    expressions: ['"a" == "b" ? 5 : 10;', '"a" < "b" ? 5 : 10'],
                });

                table.update({
                    a: [
                        new Date(2020, 3, 1),
                        new Date(2012, 0, 30),
                        new Date(2018, 9, 31),
                        new Date(2020, 1, 29),
                    ],
                    b: [
                        new Date(2020, 3, 1),
                        new Date(2012, 1, 30),
                        new Date(2018, 10, 31),
                        new Date(2020, 1, 29),
                    ],
                });

                const results = await view.to_columns();
                expect(results['"a" == "b" ? 5 : 10;']).toEqual([5, 10, 10, 5]);
                expect(results['"a" < "b" ? 5 : 10']).toEqual([10, 5, 5, 10]);

                view.delete();
                table.delete();
            });

            it("ternary if datetime", async function () {
                const table = await perspective.table({
                    a: "datetime",
                    b: "datetime",
                });

                const view = await table.view({
                    expressions: ['"a" >= "b" ? 5 : 10;', '"a" < "b" ? 5 : 10'],
                });

                table.update({
                    a: [
                        new Date(2020, 3, 1, 12, 30, 45, 850),
                        new Date(2012, 0, 30, 19, 25),
                        new Date(2018, 9, 31, 3, 13),
                        new Date(2020, 1, 29, 23, 59, 59),
                    ],
                    b: [
                        new Date(2020, 3, 1, 12, 30, 45, 850),
                        new Date(2012, 1, 30),
                        new Date(2018, 10, 31),
                        new Date(2020, 1, 29),
                    ],
                });

                const results = await view.to_columns();
                expect(results['"a" >= "b" ? 5 : 10;']).toEqual([5, 10, 10, 5]);
                expect(results['"a" < "b" ? 5 : 10']).toEqual([10, 5, 5, 10]);
                view.delete();
                table.delete();
            });

            it("if else", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        'if ("w" > 2) 5; else 10',
                        'if ("w" > 2) 5; else 10;',
                        'if ("w" > 2) { \n5; } else { \n10;}',
                    ],
                });

                const results = await view.to_columns();
                expect(results['if ("w" > 2) 5; else 10']).toEqual([
                    10, 5, 5, 5,
                ]);
                expect(results['if ("w" > 2) 5; else 10;']).toEqual([
                    10, 5, 5, 5,
                ]);
                expect(results['if ("w" > 2) { \n5; } else { \n10;}']).toEqual([
                    10, 5, 5, 5,
                ]);
                view.delete();
                table.delete();
            });

            it("if else if", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        'if ("w" == 3.5) 15; else if ("w" > 2) 5; else 10',
                        'if ("w" == 3.5) 15; else if ("w" > 2) 5; else 10;',
                        'if ("w" == 3.5) { \n15; } else if ("w" > 2) { \n5; } else { \n10;}',
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results['if ("w" == 3.5) 15; else if ("w" > 2) 5; else 10']
                ).toEqual([10, 5, 15, 5]);
                expect(
                    results['if ("w" == 3.5) 15; else if ("w" > 2) 5; else 10;']
                ).toEqual([10, 5, 15, 5]);
                expect(
                    results[
                        'if ("w" == 3.5) { \n15; } else if ("w" > 2) { \n5; } else { \n10;}'
                    ]
                ).toEqual([10, 5, 15, 5]);
                view.delete();
                table.delete();
            });
        });

        describe("Switch", function () {
            it("Switch on multiple columns", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        `switch { case "w" > 2: sqrt(144); case "y" == 'a': sqrt(121); default: 0; }`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `switch { case "w" > 2: sqrt(144); case "y" == 'a': sqrt(121); default: 0; }`
                    ]
                ).toEqual([11, 12, 12, 12]);

                await view.delete();
                await table.delete();
            });

            it("Switch on multiple columns with resulting expression", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        `switch { case "w" > 2: (sqrt(144) * "w"); case "y" == 'a': (sqrt(121) * "w"); default: "x"; }`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `switch { case "w" > 2: (sqrt(144) * "w"); case "y" == 'a': (sqrt(121) * "w"); default: "x"; }`
                    ]
                ).toEqual([16.5, 30, 42, 54]);

                await view.delete();
                await table.delete();
            });
        });

        describe("While loop", function () {
            it("Scalar while", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );

                // 2 ^ 10 = 1024
                const view = await table.view({
                    expressions: [
                        `var x := 1; var y := 0; while (y < 10) { x := x * 2; y += 1; }; x`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `var x := 1; var y := 0; while (y < 10) { x := x * 2; y += 1; }; x`
                    ]
                ).toEqual([1024, 1024, 1024, 1024]);

                await view.delete();
                await table.delete();
            });

            it("Scalar while 2", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );

                // 2 * 2 = 4, 4 * 4 = 16, 16 * 16 = 256
                const view = await table.view({
                    expressions: [
                        `var x := 2; var y := 0; while (y < 3) { x := x * x; y += 1; }; x`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `var x := 2; var y := 0; while (y < 3) { x := x * x; y += 1; }; x`
                    ]
                ).toEqual([256, 256, 256, 256]);

                await view.delete();
                await table.delete();
            });

            it("While without semicolon should not validate", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );

                const schema = await table.validate_expressions([
                    `//expr\nvar x := 2; var y := 0; while (y < 3) { x := x * x; y += 1; } x`,
                ]);

                expect(schema.expression_schema["expr"]).toBeUndefined();
                expect(schema.errors["expr"]).toEqual({
                    column: 63,
                    line: 1,
                    error_message:
                        "Parser Error - Invalid expression encountered",
                });

                await table.delete();
            });

            it("Column while", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        `var x := 0; var y := 0; while (y < 10) { x := "w" * 2; y += 1; }; x`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `var x := 0; var y := 0; while (y < 10) { x := "w" * 2; y += 1; }; x`
                    ]
                ).toEqual([3, 5, 7, 9]);

                await view.delete();
                await table.delete();
            });

            it.skip("Column while with break", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        `var x := 0; var y := 0; while (y < 10) { if (y % 2 == 0) { break; }; x := "w" * 2; y += 1; }; x`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `var x := 0; var y := 0; while (y < 10) { if (y % 2 == 0) { break; }; x := "w" * 2; y += 1; }; x`
                    ]
                ).toEqual([16.5, 30, 42, 54]);

                await view.delete();
                await table.delete();
            });
        });

        describe("For loop", function () {
            it("For loop", async () => {
                const expr = `// expression\nvar x := 0; for (var i := 0; i < 3; i += 1) { x += 1; }; x`;
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [expr],
                });

                const results = await view.to_columns();
                expect(results["expression"]).toEqual([3, 3, 3, 3]);

                await view.delete();
                await table.delete();
            });

            it("Scalar for", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        `for (var x := 0; x < 10; x += 1) { var y := x + 1; y}`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `for (var x := 0; x < 10; x += 1) { var y := x + 1; y}`
                    ]
                ).toEqual([10, 10, 10, 10]);

                await view.delete();
                await table.delete();
            });

            it("Column for", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        `for (var x := 0; x < 10; x += 1) { var y := "w" + 1; y}`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `for (var x := 0; x < 10; x += 1) { var y := "w" + 1; y}`
                    ]
                ).toEqual([2.5, 3.5, 4.5, 5.5]);

                await view.delete();
                await table.delete();
            });

            it.skip("for loop only valid on numbers", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                // `for (var x := today(); x < 10; x += 1) { var y := "w" + 1; y}`
                const expressions = [
                    `for (var x := 'abc'; x < 10; x += 1) { var y := "w" + 1; y}`,
                ];
                const validate = await table.validate_expressions(expressions);

                for (const expr of expressions) {
                    expect(validate.expression_schema[expr]).toBeUndefined();
                }

                await table.delete();
            });
        });

        describe.skip("Repeat loop", function () {
            it("Scalar repeat", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        `var x := 1; var y := 1; repeat x := x + (y * 2) until (x > 10)`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `var x := 1; var y := 1; repeat x := x + (y * 2) until (x > 10)`
                    ]
                ).toEqual([11, 11, 11, 11]);

                await view.delete();
                await table.delete();
            });

            it("Column repeat", async function () {
                const table = await perspective.table(
                    expressions_common.int_float_data
                );
                const view = await table.view({
                    expressions: [
                        `var x := 1; repeat x := x + ("x" * 2) until (x > 10)`,
                    ],
                });

                const results = await view.to_columns();
                expect(
                    results[
                        `var x := 1; repeat x := x + ("x" * 2) until (x > 10)`
                    ]
                ).toEqual([16.5, 30, 42, 54]);

                await view.delete();
                await table.delete();
            });
        });
    });

    describe("Local variables", function () {
        it("Declare numeric", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ["1", "100.0000001"],
            });

            const results = await view.to_columns();
            expect(results["1"]).toEqual([1, 1, 1, 1]);
            expect(results["100.0000001"]).toEqual([
                100.0000001, 100.0000001, 100.0000001, 100.0000001,
            ]);

            await view.delete();
            await table.delete();
        });

        it("Declare string", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    "'hello'",
                    "'very long string that is very long and has many characters'",
                ],
            });

            const results = await view.to_columns();
            expect(results["'hello'"]).toEqual([
                "hello",
                "hello",
                "hello",
                "hello",
            ]);
            expect(
                results[
                    "'very long string that is very long and has many characters'"
                ]
            ).toEqual([
                "very long string that is very long and has many characters",
                "very long string that is very long and has many characters",
                "very long string that is very long and has many characters",
                "very long string that is very long and has many characters",
            ]);

            await view.delete();
            await table.delete();
        });

        it("Declare numeric var", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    `var x := 10; var y := -100.00005; var z := x + y; abs(z)`,
                ],
            });

            const results = await view.to_columns();
            expect(
                results[
                    `var x := 10; var y := -100.00005; var z := x + y; abs(z)`
                ]
            ).toEqual([90.00005, 90.00005, 90.00005, 90.00005]);

            await view.delete();
            await table.delete();
        });

        it("Declare numeric var 0 and 1", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const expressions = ["1", "0", "var x := 1; x", "var x := 0; x"];
            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("float");
            }

            const results = await view.to_columns();
            expect(results["1"]).toEqual(Array(4).fill(1));
            expect(results["0"]).toEqual(Array(4).fill(0));
            expect(results["var x := 1; x"]).toEqual(Array(4).fill(1));
            expect(results["var x := 0; x"]).toEqual(Array(4).fill(0));

            await view.delete();
            await table.delete();
        });

        it("Declare string var", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    `var x := 'long literal string here'; var y := 'long literal string here'; x == y ? concat('strings: ', x, ', ', y) : 'nope'`,
                    `var x := 'hello'; var y := upper(x); lower(y);`,
                ],
            });

            const results = await view.to_columns();
            expect(
                results[
                    `var x := 'long literal string here'; var y := 'long literal string here'; x == y ? concat('strings: ', x, ', ', y) : 'nope'`
                ]
            ).toEqual([
                "strings: long literal string here, long literal string here",
                "strings: long literal string here, long literal string here",
                "strings: long literal string here, long literal string here",
                "strings: long literal string here, long literal string here",
            ]);
            expect(
                results[`var x := 'hello'; var y := upper(x); lower(y);`]
            ).toEqual(["hello", "hello", "hello", "hello"]);

            await view.delete();
            await table.delete();
        });

        it("Declare date var", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    `var x := today(); var y := today(); x == y ? 1 : 0;`,
                ],
            });

            const results = await view.to_columns();
            expect(
                results[`var x := today(); var y := today(); x == y ? 1 : 0;`]
            ).toEqual([1, 1, 1, 1]);

            await view.delete();
            await table.delete();
        });

        it("Declare datetime var", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const now = new Date().getTime();
            const view = await table.view({
                expressions: ["now()"],
            });

            const results = await view.to_columns();

            for (const x of results["now()"]) {
                expect(now - 1000 < x < now + 1000).toBe(true);
            }

            await view.delete();
            await table.delete();
        });

        it("Declare boolean var", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    `var x := True; var y := False; x and y ? 1 : 0`,
                    `var x := True; var y := False; x or y`,
                ],
            });

            const results = await view.to_columns();
            expect(
                results[`var x := True; var y := False; x and y ? 1 : 0`]
            ).toEqual([0, 0, 0, 0]);
            expect(results["var x := True; var y := False; x or y"]).toEqual([
                true,
                true,
                true,
                true,
            ]);

            await view.delete();
            await table.delete();
        });

        it("Declare column as var", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [`var x := "w"; var y := 1.5; x > 2.5 ? x : y`],
            });

            const results = await view.to_columns();
            expect(
                results[`var x := "w"; var y := 1.5; x > 2.5 ? x : y`]
            ).toEqual([1.5, 1.5, 3.5, 4.5]);

            await view.delete();
            await table.delete();
        });

        it("Assign one type to var of another", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    `var x := 'w'; var y := 1.5; x := y; x`,
                    `var x := 'w'; var y := 1.5; y := x; y`,
                ],
            });

            const results = await view.to_columns();
            expect(results[`var x := 'w'; var y := 1.5; x := y; x`]).toEqual([
                1.5, 1.5, 1.5, 1.5,
            ]);
            expect(results[`var x := 'w'; var y := 1.5; y := x; y`]).toEqual([
                "w",
                "w",
                "w",
                "w",
            ]);

            await view.delete();
            await table.delete();
        });

        it("Assign to declared numeric var", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    `var x := 100; var y := 200.5; x := y; x`,
                    `var x := 10; var y := pow(x, 3); y := x; y`,
                ],
            });

            const results = await view.to_columns();
            expect(results[`var x := 100; var y := 200.5; x := y; x`]).toEqual([
                200.5, 200.5, 200.5, 200.5,
            ]);
            expect(
                results[`var x := 10; var y := pow(x, 3); y := x; y`]
            ).toEqual([10, 10, 10, 10]);

            await view.delete();
            await table.delete();
        });

        it("Assign to declared string var", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    `var x := 'long literal string here'; var y := lower('ANOTHER VERY LONG STRING HERE'); x := y`,
                ],
            });

            const results = await view.to_columns();
            expect(
                results[
                    `var x := 'long literal string here'; var y := lower('ANOTHER VERY LONG STRING HERE'); x := y`
                ]
            ).toEqual([
                "another very long string here",
                "another very long string here",
                "another very long string here",
                "another very long string here",
            ]);

            await view.delete();
            await table.delete();
        });

        it("Assign to declared date var", async function () {
            const table = await perspective.table({
                a: "date",
            });
            const view = await table.view({
                expressions: [
                    `var x := today(); var y := today(); var z := "a"; (x > z) and (y > z) ? 1 : 0`,
                ],
            });

            const tomorrow = new Date();
            tomorrow.setDate(new Date().getDate() + 1);

            table.update({
                a: [
                    new Date(2020, 3, 1),
                    new Date(2012, 0, 30),
                    new Date(2018, 9, 31),
                    tomorrow,
                ],
            });

            const results = await view.to_columns();
            expect(
                results[
                    `var x := today(); var y := today(); var z := "a"; (x > z) and (y > z) ? 1 : 0`
                ]
            ).toEqual([1, 1, 1, 0]);

            await view.delete();
            await table.delete();
        });

        it("Assign to declared datetime var", async function () {
            const table = await perspective.table({
                a: "datetime",
            });
            const view = await table.view({
                expressions: [
                    `var x := now(); var y := now(); var z := "a"; (x > z) and (y > z) ? 1 : 0`,
                ],
            });

            const tomorrow = new Date();
            tomorrow.setDate(new Date().getDate() + 1);

            table.update({
                a: [
                    new Date(2020, 3, 1, 12, 30, 45, 850),
                    new Date(2012, 0, 30, 19, 25),
                    new Date(2018, 9, 31, 3, 13),
                    tomorrow,
                ],
            });

            const results = await view.to_columns();
            expect(
                results[
                    `var x := now(); var y := now(); var z := "a"; (x > z) and (y > z) ? 1 : 0`
                ]
            ).toEqual([1, 1, 1, 0]);

            await view.delete();
            await table.delete();
        });

        it("Assign to declared column as var", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );

            // test type transitions as assignments happen - from str to int,
            // from float to str, etc.
            const view = await table.view({
                expressions: [
                    `var x := "w"; var y := x; x := "y"; x;`,
                    `var x := "z"; var y := x; x := "w"; x;`,
                ],
            });

            const results = await view.to_columns();
            expect(results[`var x := "w"; var y := x; x := "y"; x;`]).toEqual([
                "a",
                "b",
                "c",
                "d",
            ]);
            expect(results[`var x := "z"; var y := x; x := "w"; x;`]).toEqual([
                1.5, 2.5, 3.5, 4.5,
            ]);

            await view.delete();
            await table.delete();
        });
    });

    describe("Functionality", function () {
        it("Should be able to create an expression column in `view()`", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();
            table.delete();
        });

        it("Should be able to alias a real column in `view()`", async function () {
            const table = await perspective.table(
                expressions_common.all_types_arrow.slice()
            );
            const columns = await table.columns();
            const view = await table.view({
                expressions: columns.map((col) => `"${col}"`),
            });

            const schema = await view.schema();
            const expression_schema = await view.expression_schema();
            const result = await view.to_columns();

            for (const col of columns) {
                expect(expression_schema[`"${col}"`]).toEqual(schema[col]);
                expect(result[`"${col}"`]).toEqual(result[col]);
            }

            view.delete();
            table.delete();
        });

        it("Should be able to create an expression column with scalars in `view()`", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ["1 + 2 + 3 + 4 + 5 + 6"],
            });
            const result = await view.to_columns();
            expect(result["1 + 2 + 3 + 4 + 5 + 6"]).toEqual([21, 21, 21, 21]);
            view.delete();
            table.delete();
        });

        it("Should be able to create a string expression column with scalars in `view()`", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                row_pivots: ["'abc'"], // checks that the strings are interned
                expressions: ["'abc'"],
            });
            const result = await view.to_columns();
            expect(result["__ROW_PATH__"]).toEqual([[], ["abc"]]);
            expect(result["'abc'"]).toEqual([4, 4]);
            view.delete();
            table.delete();
        });

        it("Should be able to create a boolean expression column with scalars in `view()`", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    "0 and 1",
                    "0 or 1",
                    "True and True",
                    "False or True",
                ],
            });
            expect(await view.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "0 and 1": "boolean",
                "0 or 1": "boolean",
                "True and True": "boolean",
                "False or True": "boolean",
            });
            const result = await view.to_columns();
            expect(result["0 and 1"]).toEqual([false, false, false, false]);
            expect(result["0 or 1"]).toEqual([true, true, true, true]);
            expect(result["True and True"]).toEqual([true, true, true, true]);
            expect(result["False or True"]).toEqual([true, true, true, true]);
            view.delete();
            table.delete();
        });

        it("Boolean scalars should not compare to numeric scalars", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    "0 and 1",
                    "0 or 1",
                    "True and True",
                    "False or True",
                ],
            });
            expect(await view.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                "0 and 1": "boolean",
                "0 or 1": "boolean",
                "True and True": "boolean",
                "False or True": "boolean",
            });
            const result = await view.to_columns();
            expect(result["0 and 1"]).toEqual([false, false, false, false]);
            expect(result["0 or 1"]).toEqual([true, true, true, true]);
            expect(result["True and True"]).toEqual([true, true, true, true]);
            expect(result["False or True"]).toEqual([true, true, true, true]);
            view.delete();
            table.delete();
        });

        it("Should be able to create an expression column with scalars and columns `view()`", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                columns: ['("w" + "x") ^ 2'],
                expressions: ['("w" + "x") ^ 2'],
            });
            const result = await view.to_columns();
            expect(result['("w" + "x") ^ 2']).toEqual(
                [2.5, 4.5, 6.5, 8.5].map((x) => Math.pow(x, 2))
            );
            view.delete();
            table.delete();
        });

        it("Should be able to create a boolean expression column with scalars and columns in `view()`", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    '"x" and 1',
                    '"x" or 1',
                    '"x" and True',
                    '"x" and False',
                    '"x" or True',
                    '"x" or False',
                ],
            });
            expect(await view.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"x" and 1': "boolean",
                '"x" or 1': "boolean",
                '"x" and True': "boolean",
                '"x" and False': "boolean",
                '"x" or True': "boolean",
                '"x" or False': "boolean",
            });
            const result = await view.to_columns();
            expect(result['"x" and 1']).toEqual([true, true, true, true]);
            expect(result['"x" or 1']).toEqual([true, true, true, true]);
            expect(result['"x" and True']).toEqual([true, true, true, true]);
            expect(result['"x" and False']).toEqual([
                false,
                false,
                false,
                false,
            ]);
            expect(result['"x" or True']).toEqual([true, true, true, true]);
            expect(result['"x" or False']).toEqual([true, true, true, true]);
            view.delete();
            table.delete();
        });

        it("Should be able to create an expression column in `view()` from schema, and updates propagate", async function () {
            const table = await perspective.table({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
            });
            const view = await table.view({
                expressions: ['("w" + "x") * 10'],
            });

            const result = await view.to_columns();
            expect(result).toEqual({});

            table.update(expressions_common.int_float_data);

            const new_result = await view.to_columns();
            expect(new_result['("w" + "x") * 10']).toEqual([25, 45, 65, 85]);

            table.update(expressions_common.int_float_data);

            const new_result2 = await view.to_columns();
            expect(new_result2['("w" + "x") * 10']).toEqual([
                25, 45, 65, 85, 25, 45, 65, 85,
            ]);

            view.delete();
            table.delete();
        });

        it("Should be able to create an expression column using an alias.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['// new column\n"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result["new column"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            await view.delete();
            await table.delete();
        });

        it("Alias should be trimmed.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['// new column\n"w" + "x"'],
            });

            const result = await view.to_columns();
            expect(result["new column"]).toEqual([2.5, 4.5, 6.5, 8.5]);

            const view2 = await table.view({
                expressions: ['// new column\n"w" - "x"'],
            });

            const result2 = await view2.to_columns();
            expect(result2["new column"]).toEqual([0.5, 0.5, 0.5, 0.5]);

            await view2.delete();
            await view.delete();
            await table.delete();
        });

        it("Should be able to create an expression column using a very long alias.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    '// new column with lots of different strings and names and lots of good characters\n"w" + "x"',
                ],
            });
            const result = await view.to_columns();
            expect(
                result[
                    "new column with lots of different strings and names and lots of good characters"
                ]
            ).toEqual([2.5, 4.5, 6.5, 8.5]);
            await view.delete();
            await table.delete();
        });

        it("Comments after the alias are not picked up.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: [
                    '// alias\nvar x := "w" + "x"\n// a comment\n# another comment\n/* another comment here */\n',
                ],
            });
            const result = await view.to_columns();
            expect(result["alias"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            await view.delete();
            await table.delete();
        });

        it("Duplicate alias within the same view should resolve to the last expression.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );

            const view = await table.view({
                expressions: [
                    '// new column\n"w" + "x"',
                    '// new column 1\n"w" - "x"',
                    "// new column\n100 * 10",
                    '// new column 1\n"w" + "x"',
                    '// new column\n"w" - "x"',
                ],
            });

            expect(await view.expression_schema()).toEqual({
                "new column": "float",
                "new column 1": "float",
            });

            const result = await view.to_columns();

            expect(result["new column"]).toEqual([0.5, 0.5, 0.5, 0.5]);
            expect(result["new column 1"]).toEqual([2.5, 4.5, 6.5, 8.5]);

            await view.delete();
            await table.delete();
        });

        it("Duplicate alias within the same view should resolve to the last expression, different types.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );

            const view = await table.view({
                expressions: [
                    '// new column\n"w" + "x"',
                    '// new column 1\n"w" - "x"',
                    "// new column\n100",
                    "// new column\nupper('abc')",
                    '// new column 1\n"w" + "x"',
                ],
            });

            expect(await view.expression_schema()).toEqual({
                "new column": "string",
                "new column 1": "float",
            });

            const result = await view.to_columns();

            expect(result["new column"]).toEqual(Array(4).fill("ABC"));
            expect(result["new column 1"]).toEqual([2.5, 4.5, 6.5, 8.5]);

            await view.delete();
            await table.delete();
        });

        it("Duplicate alias across new views will not overwrite results in old view.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['// new column\n"w" + "x"'],
            });

            let result = await view.to_columns();
            expect(result["new column"]).toEqual([2.5, 4.5, 6.5, 8.5]);

            const view2 = await table.view({
                expressions: ["// new column\n100 * 10"],
            });

            expect(await view.expression_schema()).toEqual(
                await view2.expression_schema()
            );

            result = await view.to_columns();
            const result2 = await view2.to_columns();
            expect(result["new column"]).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(result2["new column"]).toEqual([1000, 1000, 1000, 1000]);

            const view3 = await table.view({
                expressions: ["// new column\n100 * 100"],
                row_pivots: ["y"],
            });

            const result3 = await view3.to_columns();
            expect(result3["new column"]).toEqual([
                40000, 10000, 10000, 10000, 10000,
            ]);

            await view3.delete();
            await view2.delete();
            await view.delete();
            await table.delete();
        });

        it("Should not be able to overwrite table column with an expression", async function (done) {
            expect.assertions(1);
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            table
                .view({
                    expressions: ["// w\nupper('abc')"],
                })
                .catch((e) => {
                    expect(e.message).toMatch(
                        `Abort(): View creation failed: cannot create expression column 'w' that overwrites a column that already exists.\n`
                    );
                    table.delete();
                    done();
                });
        });

        it("Should be able to overwrite expression column with one that returns a different type", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['// new column\n"w" + "x"'],
            });

            let result = await view.to_columns();
            expect(result["new column"]).toEqual([2.5, 4.5, 6.5, 8.5]);

            const view2 = await table.view({
                expressions: ["// new column\n upper('abc')"],
            });

            const result2 = await view2.to_columns();
            expect(result2["new column"]).toEqual(Array(4).fill("ABC"));

            view2.delete();
            view.delete();
            table.delete();
        });

        it("A new view should not reference expression columns it did not create.", async function (done) {
            expect.assertions(2);
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            table
                .view({
                    columns: ['"w" + "x"', "x"],
                })
                .catch((e) => {
                    expect(e.message).toMatch(
                        `Abort(): Invalid column '"w" + "x"' found in View columns.\n`
                    );
                    view.delete();
                    table.delete();
                    done();
                });
        });

        it("A view should be able to shadow real columns with an expression column", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w"', '"x"', '"y"', '"z"'],
            });
            expect(await view.expression_schema()).toEqual({
                '"w"': "float",
                '"x"': "integer",
                '"y"': "string",
                '"z"': "boolean",
            });
            expect(await view.to_json()).toEqual([
                {
                    w: 1.5,
                    x: 1,
                    y: "a",
                    z: true,
                    '"w"': 1.5,
                    '"x"': 1,
                    '"y"': "a",
                    '"z"': true,
                },
                {
                    w: 2.5,
                    x: 2,
                    y: "b",
                    z: false,
                    '"w"': 2.5,
                    '"x"': 2,
                    '"y"': "b",
                    '"z"': false,
                },
                {
                    w: 3.5,
                    x: 3,
                    y: "c",
                    z: true,
                    '"w"': 3.5,
                    '"x"': 3,
                    '"y"': "c",
                    '"z"': true,
                },
                {
                    w: 4.5,
                    x: 4,
                    y: "d",
                    z: false,
                    '"w"': 4.5,
                    '"x"': 4,
                    '"y"': "d",
                    '"z"': false,
                },
            ]);
            view.delete();
            table.delete();
        });

        it("Should be able to create multiple expression columns in `view()`", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );

            const view = await table.view({
                expressions: ['"w" + "x"', 'upper("y")'],
            });

            expect(await view.expression_schema()).toEqual({
                '"w" + "x"': "float",
                'upper("y")': "string",
            });

            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(result['upper("y")']).toEqual(["A", "B", "C", "D"]);
            view.delete();
            table.delete();
        });

        it("Should be able to create multiple expression columns with unique names in multiple `view()`s", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"', '"w" - "x"', '"w" * "x"'],
            });
            const view2 = await table.view({
                expressions: ['"w" / "x"', '"x" * "w"'],
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
                '"w" * "x"': "float",
            });

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" / "x"': "float",
                '"x" * "w"': "float",
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
                '"w" * "x"': [1.5, 5, 10.5, 18],
            });

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" / "x"': [1.5, 1.25, 1.1666666666666667, 1.125],
                '"x" * "w"': [1.5, 5, 10.5, 18],
            });

            view2.delete();
            view.delete();
            table.delete();
        });

        it("Should be able to create multiple expression columns in multiple `view()`s, and arbitarily delete views.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"'],
            });
            const view2 = await table.view({
                expressions: ['"w" - "x"'],
            });

            const schema = await view.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
            });
            const result = await view.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5],
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
                '"w" - "x"': "float",
            });

            const result2 = await view2.to_columns();

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" - "x"': [0.5, 0.5, 0.5, 0.5],
            });

            view2.delete();
            table.delete();
        });

        it("Should be able to create multiple duplicate expression columns in multiple `view()`s, and delete preceding views without affecting later columns.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"'],
            });

            const view2 = await table.view({
                expressions: ['"w" + "x"', '"w" - "x"'],
            });

            const schema = await view.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
            });
            const result = await view.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5],
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
                '"w" - "x"': "float",
            });

            const result2 = await view2.to_columns();

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5],
                '"w" - "x"': [0.5, 0.5, 0.5, 0.5],
            });

            view2.delete();
            table.delete();
        });

        it("Multiple views inheriting the same expression columns with the same names should not conflict", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );

            const view = await table.view({
                expressions: ['"w" + "x"'],
            });

            expect(await view.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
            });

            const view2 = await table.view({
                expressions: ['"w" + "x"', '"w" - "x"'],
            });

            expect(await view2.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float",
            });

            const view3 = await table.view({
                expressions: ['"w" + "x"', '"w" - "x"', '("w" - "x") + "x"'],
            });

            expect(await view3.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float",
                '("w" - "x") + "x"': "float",
            });

            const result = await view3.to_columns();
            expect(result['("w" - "x") + "x"']).toEqual(result["w"]);

            view3.delete();
            view2.delete();
            view.delete();
            table.delete();
        });

        it("A view should be able to create an expression column with the same name as another deleted view's expression columns.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"'],
            });

            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();

            const view2 = await table.view({
                expressions: ['"w" - "x"'],
            });

            const result2 = await view2.to_columns();
            expect(result2['"w" - "x"']).toEqual([0.5, 0.5, 0.5, 0.5]);

            view2.delete();
            table.delete();
        });

        it("A view without expression columns should not serialize expression columns from other views.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"'],
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

        it("When expression columns are repeated between views, column indices should grow linearly.", async function () {
            let expressions = [
                '"w" + "x"',
                '"w" - "x"',
                '"w" * "x"',
                '"w" / "x"',
            ];
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({expressions: [expressions[0]]});
            const view2 = await table.view({
                expressions: [expressions[0], expressions[1]],
            });
            const view3 = await table.view({
                expressions: [expressions[0], expressions[1], expressions[2]],
            });
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
                '"w" + "x"': "float",
            });

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float",
            });

            expect(schema3).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float",
                '"w" * "x"': "float",
            });

            expect(schema4).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
                '"w" - "x"': "float",
                '"w" * "x"': "float",
                '"w" / "x"': "float",
            });

            view4.delete();
            view3.delete();
            view2.delete();
            view.delete();
            table.delete();
        });

        it("Should be able to create duplicate expressions in multiple views, and updates should propagate to both", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"'],
            });
            const view2 = await table.view({
                expressions: ['"w" + "x"'],
            });

            const schema = await view.schema();
            const schema2 = await view2.schema();

            expect(schema).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
            });

            expect(schema2).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
                '"w" + "x"': "float",
            });

            const result = await view.to_columns();
            const result2 = await view2.to_columns();

            expect(result).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5],
            });

            expect(result2).toEqual({
                w: [1.5, 2.5, 3.5, 4.5],
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5],
            });

            table.update({
                w: [5, 6, 7, 8],
                x: [1, 2, 3, 4],
            });

            expect(await view.to_columns()).toEqual({
                w: [1.5, 2.5, 3.5, 4.5, 5, 6, 7, 8],
                x: [1, 2, 3, 4, 1, 2, 3, 4],
                y: ["a", "b", "c", "d", null, null, null, null],
                z: [true, false, true, false, null, null, null, null],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5, 6, 8, 10, 12],
            });

            expect(await view2.to_columns()).toEqual({
                w: [1.5, 2.5, 3.5, 4.5, 5, 6, 7, 8],
                x: [1, 2, 3, 4, 1, 2, 3, 4],
                y: ["a", "b", "c", "d", null, null, null, null],
                z: [true, false, true, false, null, null, null, null],
                '"w" + "x"': [2.5, 4.5, 6.5, 8.5, 6, 8, 10, 12],
            });

            view2.delete();
            view.delete();
            table.delete();
        });

        it("A new view should not inherit expression columns if not created.", async function () {
            expect.assertions(2);
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);

            try {
                await table.view({
                    columns: ['"w" + "x"', "x"],
                });
            } catch (e) {
                expect(e.message).toEqual(
                    `Abort(): Invalid column '"w" + "x"' found in View columns.\n`
                );
            }

            view.delete();
            table.delete();
        });

        it("The view's underlying table should not have a mutated schema.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            expect(await table.schema()).toEqual({
                w: "float",
                x: "integer",
                y: "string",
                z: "boolean",
            });
            view.delete();
            table.delete();
        });

        it("Should be able to show an expression column.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                columns: ['"w" + "x"'],
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual([2.5, 4.5, 6.5, 8.5]);
            view.delete();
            table.delete();
        });

        it("Should be able to hide an expression column.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                columns: ["x"],
                expressions: ['"w" + "x"'],
            });
            expect(await view.schema()).toEqual({
                x: "integer",
            });
            expect(await view.expression_schema()).toEqual({
                '"w" + "x"': "float",
            });
            const result = await view.to_columns();
            expect(result['"w" + "x"']).toEqual(undefined);
            expect(result["x"]).toEqual([1, 2, 3, 4]);
            view.delete();
            table.delete();
        });

        it("Should be able to row pivot on a non-expression column and get correct results for the expression column.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                row_pivots: ["w"],
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [1.5], [2.5], [3.5], [4.5]],
                '"w" + "x"': [22, 2.5, 4.5, 6.5, 8.5],
                w: [12, 1.5, 2.5, 3.5, 4.5],
                x: [10, 1, 2, 3, 4],
                y: [4, 1, 1, 1, 1],
                z: [4, 1, 1, 1, 1],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to row pivot on an expression column.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                row_pivots: ['"w" + "x"'],
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                '"w" + "x"': [22, 2.5, 4.5, 6.5, 8.5],
                w: [12, 1.5, 2.5, 3.5, 4.5],
                x: [10, 1, 2, 3, 4],
                y: [4, 1, 1, 1, 1],
                z: [4, 1, 1, 1, 1],
            });
            view.delete();
            table.delete();
        });

        it("Row-pivoted expression columns return correct column_paths()", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );

            // default order
            let view = await table.view({
                row_pivots: ["y"],
                expressions: ['// column\n"w" + "x"'],
            });

            let paths = await view.column_paths();
            expect(paths).toEqual([
                "__ROW_PATH__",
                "w",
                "x",
                "y",
                "z",
                "column",
            ]);

            await view.delete();

            const expected_paths = [
                ["x", "column"],
                ["column"],
                ["x", "column", "y"],
            ];

            for (const expected of expected_paths) {
                const output = expected.slice();
                output.unshift("__ROW_PATH__");
                view = await table.view({
                    row_pivots: ["y"],
                    expressions: ['// column\n"w" + "x"'],
                    columns: expected,
                });
                paths = await view.column_paths();
                expect(paths).toEqual(output);
                view.delete();
            }

            for (const expected of expected_paths) {
                const output = expected.slice();
                output.unshift("__ROW_PATH__");
                view = await table.view({
                    row_pivots: ["column"],
                    expressions: ['// column\n"w" + "x"'],
                    columns: expected,
                });
                paths = await view.column_paths();
                expect(paths).toEqual(output);
                view.delete();
            }

            table.delete();
        });

        it("Row-pivoted numeric expression columns return correct column_paths()", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const config = {
                row_pivots: ["y"],
                expressions: ["1234"],
                aggregates: {
                    x: "sum",
                    y: "count",
                    1234: "sum",
                },
            };
            // default order
            let view = await table.view(config);

            let paths = await view.column_paths();
            expect(paths).toEqual(["__ROW_PATH__", "w", "x", "y", "z", "1234"]);

            await view.delete();

            const expected_paths = [
                ["x", "1234"],
                ["1234"],
                ["x", "1234", "y"],
            ];

            for (const expected of expected_paths) {
                const output = expected.slice();
                output.unshift("__ROW_PATH__");
                view = await table.view({
                    ...config,
                    columns: expected,
                });
                paths = await view.column_paths();
                expect(paths).toEqual(output);
                view.delete();
            }

            for (const expected of expected_paths) {
                const output = expected.slice();
                output.unshift("__ROW_PATH__");
                view = await table.view({
                    ...config,
                    columns: expected,
                });
                paths = await view.column_paths();
                expect(paths).toEqual(output);
                view.delete();
            }

            table.delete();
        });

        it("Should be able to column pivot on an expression column.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                column_pivots: ['"w" + "x"'],
                expressions: ['"w" + "x"'],
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
                '8.5|"w" + "x"': [null, null, null, 8.5],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to row + column pivot on an expression column.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                row_pivots: ['"w" + "x"'],
                column_pivots: ['"w" + "x"'],
                expressions: ['"w" + "x"'],
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
                '8.5|"w" + "x"': [8.5, null, null, null, 8.5],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a numeric expression column.", async function () {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: [100, 200, 300, 400],
                z: [1.5, 2.5, 3.5, 4.5],
            });
            const view = await table.view({
                row_pivots: ['"x" + "z"'],
                aggregates: {
                    '"x" + "z"': "median",
                    x: "median",
                },
                expressions: ['"x" + "z"'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                '"x" + "z"': [6.5, 2.5, 4.5, 6.5, 8.5],
                x: [3, 1, 2, 3, 4],
                y: [1000, 100, 200, 300, 400],
                z: [12, 1.5, 2.5, 3.5, 4.5],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to weighted mean aggregate a numeric expression column.", async function () {
            const table = await perspective.table({
                x: [2, 2, 4, 4],
                y: [100, 200, 300, 400],
                z: [1.5, 2.5, 3.5, 4.5],
            });
            const view = await table.view({
                row_pivots: ["y"],
                columns: ['"x" + "z"'],
                aggregates: {
                    '"x" + "z"': ["weighted mean", "y"],
                },
                expressions: ['"x" + "z"'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [100], [200], [300], [400]],
                '"x" + "z"': [6.9, 3.5, 4.5, 7.5, 8.5],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a numeric expression column that aliases a real column.", async function () {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: [100, 200, 300, 400],
                z: [1.5, 2.5, 3.5, 4.5],
            });
            const view = await table.view({
                row_pivots: ['"x"'],
                aggregates: {
                    '"x"': "median",
                    x: "median",
                },
                expressions: ['"x"'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [1], [2], [3], [4]],
                '"x"': [3, 1, 2, 3, 4],
                x: [3, 1, 2, 3, 4],
                y: [1000, 100, 200, 300, 400],
                z: [12, 1.5, 2.5, 3.5, 4.5],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a string expression column.", async function () {
            const table = await perspective.table({
                x: ["a", "a", "c", "a"],
                y: ["w", "w", "y", "w"],
            });
            const view = await table.view({
                row_pivots: ['upper("x")'],
                aggregates: {
                    'upper("x")': "distinct count",
                },
                expressions: ['upper("x")'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], ["A"], ["C"]],
                'upper("x")': [2, 1, 1],
                x: [4, 3, 1],
                y: [4, 3, 1],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to aggregate a date expression column.", async function () {
            const table = await perspective.table({
                x: [
                    new Date(2019, 0, 15),
                    new Date(2019, 0, 30),
                    new Date(2019, 1, 15),
                ],
            });
            const view = await table.view({
                row_pivots: [`bucket("x", 'M')`],
                aggregates: {
                    "bucket(\"x\", 'M')": "distinct count",
                },
                expressions: [`bucket("x", 'M')`],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [1546300800000], [1548979200000]],
                "bucket(\"x\", 'M')": [2, 1, 1],
                x: [3, 2, 1],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to weighted mean on an expression column.", async function () {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: [100, 200, 300, 400],
                z: [1.5, 2.5, 3.5, 4.5],
            });
            const view = await table.view({
                row_pivots: ['"x" + "z"'],
                aggregates: {
                    x: ["weighted mean", '"x" + "z"'],
                    '"x" + "z"': ["weighted mean", "y"],
                },
                expressions: ['"x" + "z"'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                __ROW_PATH__: [[], [2.5], [4.5], [6.5], [8.5]],
                '"x" + "z"': [6.5, 2.5, 4.5, 6.5, 8.5],
                x: [2.9545454545454546, 1, 2, 3, 4],
                y: [1000, 100, 200, 300, 400],
                z: [12, 1.5, 2.5, 3.5, 4.5],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to filter on an expression column.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                filter: [['"w" + "x"', ">", 6.5]],
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                '"w" + "x"': [8.5],
                w: [4.5],
                x: [4],
                y: ["d"],
                z: [false],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to sort on an expression column.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                sort: [['"w" + "x"', "desc"]],
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                '"w" + "x"': [8.5, 6.5, 4.5, 2.5],
                w: [4.5, 3.5, 2.5, 1.5],
                x: [4, 3, 2, 1],
                y: ["d", "c", "b", "a"],
                z: [false, true, false, true],
            });
            view.delete();
            table.delete();
        });

        it("Should be able to sort on a hidden expression column.", async function () {
            const table = await perspective.table(
                expressions_common.int_float_data
            );
            const view = await table.view({
                columns: ["w"],
                sort: [['"w" + "x"', "desc"]],
                expressions: ['"w" + "x"'],
            });
            const result = await view.to_columns();
            expect(result).toEqual({
                w: [4.5, 3.5, 2.5, 1.5],
            });
            view.delete();
            table.delete();
        });

        describe("Validation using table expression schema", function () {
            it("Should show correct expression column types in table expression schema.", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                });
                const expressions = [
                    '"a" ^ 2',
                    "sqrt(144)",
                    "0 and 1",
                    "0 or 1",
                    '-"a"',
                    'upper("c")',
                    `bucket("b", 'M')`,
                    `bucket("b", 's')`,
                ];
                const results = await table.validate_expressions(expressions);
                expect(results.expression_schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "boolean",
                    "0 or 1": "boolean",
                    'upper("c")': "string",
                    "bucket(\"b\", 'M')": "date",
                    "bucket(\"b\", 's')": "datetime",
                });
                table.delete();
            });

            it("Should skip expressions that try to overwrite table columns", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5],
                });
                const expressions = [
                    "// abc\n 123 + 345", //valid
                    "// a\n sqrt(144)", // invalid
                    "// b\n upper('abc')", // invalid
                    "// c\n concat('a', 'b')", // invalid
                    "// d\n today()", // invalid
                ];
                const results = await table.validate_expressions(expressions);
                expect(results.expression_schema).toEqual({
                    abc: "float",
                });
                table.delete();
            });

            it("Should not skip expressions that try to overwrite expressions with different types", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5],
                });

                const view = await table.view({
                    expressions: [
                        "// abc\n 123 + 345",
                        "//def \n lower('ABC')",
                    ],
                });

                const results = await table.validate_expressions([
                    "// abc\n upper('abc')",
                    "// def\n 1 + 2",
                ]);
                expect(results.expression_schema).toEqual({
                    abc: "string",
                    def: "float",
                });

                view.delete();
                table.delete();
            });

            it("Should skip invalid columns due to type error, with alias", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5],
                });
                const expressions = [
                    '// abc \n"a" + "d"', // valid
                    '// def\n"c" + "b"', // invalid
                    '"c"', // valid
                    "// new column \nbucket(\"b\", 'M')", // valid
                    "bucket(\"b\", 'abcde')", // invalid
                    'concat("c", "a")', // invalid
                    "// more columns\nconcat(\"c\", ' ', \"c\", 'abc')", // valid
                    'upper("c")', // valid
                    'lower("a")', // invalid,
                    'min("a", "c")', // invalid,
                    'max(100, "a")', // valid
                ];
                const results = await table.validate_expressions(expressions);
                expect(results.expression_schema).toEqual({
                    abc: "float",
                    '"c"': "string",
                    "new column": "date",
                    'upper("c")': "string",
                    'max(100, "a")': "float",
                    "more columns": "string",
                });
                table.delete();
            });

            it("Should skip invalid columns due to type error", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5],
                });
                const expressions = [
                    '"a" + "d"', // valid
                    '"c" + "b"', // invalid
                    '"c"', // valid
                    "bucket(\"b\", 'M')", // valid
                    "bucket(\"b\", 'abcde')", // invalid
                    'concat("c", "a")', // invalid
                    "concat(\"c\", ' ', \"c\", 'abc')", // valid
                    'upper("c")', // valid
                    'lower("a")', // invalid,
                    'min("a", "c")', // invalid,
                    'max(100, "a")', // valid
                ];
                const results = await table.validate_expressions(expressions);
                expect(results.expression_schema).toEqual({
                    '"a" + "d"': "float",
                    '"c"': "string",
                    "bucket(\"b\", 'M')": "date",
                    'upper("c")': "string",
                    'max(100, "a")': "float",
                    "concat(\"c\", ' ', \"c\", 'abc')": "string",
                });
                table.delete();
            });

            it("Should skip a invalid column due to invalid column name", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5],
                });
                const expressions = [
                    '"a" + "d"', // valid
                    '"abxbasd" + "sdfadsf"', // invalid
                    '"c"', // valid
                    "bucket(\"b\", 'M')", // valid
                    "bucket(\"basdsa\", 'Y')", // invalid
                    'upper("c")', // valid
                    'lower("sdfadsj")', // invalid
                ];
                const results = await table.validate_expressions(expressions);
                expect(results.expression_schema).toEqual({
                    '"a" + "d"': "float",
                    '"c"': "string",
                    "bucket(\"b\", 'M')": "date",
                    'upper("c")': "string",
                });
                table.delete();
            });

            it("Should skip a invalid column due to parse error", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                    d: [1.5, 2.5, 3.5, 4.5],
                });
                const expressions = [
                    '"a" + "d"', // valid
                    "{", // invalid
                    "if (\"c\" == 'a') 123; else 0;", // valid
                    "if (", // invalid
                ];
                const results = await table.validate_expressions(expressions);
                expect(results.expression_schema).toEqual({
                    '"a" + "d"': "float",
                    "if (\"c\" == 'a') 123; else 0;": "float",
                });
                table.delete();
            });
        });

        describe("View expression schema", function () {
            it("Column types in view schema on 0-sided view.", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                });
                const view = await table.view({
                    expressions: [
                        '"a" ^ 2',
                        "sqrt(144)",
                        "0 and 1",
                        "0 or 1",
                        '-"a"',
                        'upper("c")',
                        `bucket("b", 'M')`,
                        `bucket("b", 's')`,
                    ],
                });
                const schema = await view.schema();
                expect(schema).toEqual({
                    a: "integer",
                    b: "datetime",
                    c: "string",
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "boolean",
                    "0 or 1": "boolean",
                    'upper("c")': "string",
                    "bucket(\"b\", 'M')": "date",
                    "bucket(\"b\", 's')": "datetime",
                });
                view.delete();
                table.delete();
            });

            it("Column types in view expression schema on 0-sided view.", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                });
                const view = await table.view({
                    expressions: [
                        '"a" ^ 2',
                        "sqrt(144)",
                        "0 and 1",
                        "0 or 1",
                        '-"a"',
                        'upper("c")',
                        `bucket("b", 'M')`,
                        `bucket("b", 's')`,
                    ],
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "boolean",
                    "0 or 1": "boolean",
                    'upper("c")': "string",
                    "bucket(\"b\", 'M')": "date",
                    "bucket(\"b\", 's')": "datetime",
                });
                view.delete();
                table.delete();
            });

            it("Should show ALL columns in view expression schema regardless of custom columns.", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                });
                const view = await table.view({
                    columns: ["a"],
                    expressions: [
                        '"a" ^ 2',
                        "sqrt(144)",
                        "0 and 1",
                        "0 or 1",
                        '-"a"',
                        'upper("c")',
                        `bucket("b", 'M')`,
                        `bucket("b", 's')`,
                    ],
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "boolean",
                    "0 or 1": "boolean",
                    'upper("c")': "string",
                    "bucket(\"b\", 'M')": "date",
                    "bucket(\"b\", 's')": "datetime",
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view expression schema on 1-sided view.", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                });
                const view = await table.view({
                    row_pivots: ["c"],
                    expressions: [
                        '"a" ^ 2',
                        "sqrt(144)",
                        "0 and 1",
                        "0 or 1",
                        '-"a"',
                        'upper("c")',
                        `bucket("b", 'M')`,
                        `bucket("b", 's')`,
                    ],
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "integer",
                    "0 or 1": "integer",
                    'upper("c")': "integer",
                    "bucket(\"b\", 'M')": "integer",
                    "bucket(\"b\", 's')": "integer",
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view expression schema on 1-sided view with custom aggregates.", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                });
                const view = await table.view({
                    row_pivots: ["c"],
                    aggregates: {
                        "0 and 1": "any",
                        "0 or 1": "any",
                        "bucket(\"b\", 's')": "last",
                    },
                    expressions: [
                        '"a" ^ 2',
                        "sqrt(144)",
                        "0 and 1",
                        "0 or 1",
                        '-"a"',
                        'upper("c")',
                        `bucket("b", 'M')`,
                        `bucket("b", 's')`,
                    ],
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "boolean",
                    "0 or 1": "boolean",
                    'upper("c")': "integer",
                    "bucket(\"b\", 'M')": "integer",
                    "bucket(\"b\", 's')": "datetime",
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view expression schema on 2-sided view.", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                });
                const view = await table.view({
                    row_pivots: ["c"],
                    column_pivots: ["a"],
                    expressions: [
                        '"a" ^ 2',
                        "sqrt(144)",
                        "0 and 1",
                        "0 or 1",
                        '-"a"',
                        'upper("c")',
                        `bucket("b", 'M')`,
                        `bucket("b", 's')`,
                    ],
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "integer", // aggregated bool = count
                    "0 or 1": "integer",
                    'upper("c")': "integer",
                    "bucket(\"b\", 'M')": "integer",
                    "bucket(\"b\", 's')": "integer",
                });
                view.delete();
                table.delete();
            });

            it("Aggregated types in view expression schema on 2-sided column-only view.", async function () {
                const table = await perspective.table({
                    a: [1, 2, 3, 4],
                    b: [new Date(), new Date(), new Date(), new Date()],
                    c: ["a", "b", "c", "d"],
                });
                const view = await table.view({
                    row_pivots: ["c"],
                    column_pivots: ["a"],
                    aggregates: {
                        "0 and 1": "any",
                        "0 or 1": "any",
                        "bucket(\"b\", 's')": "last",
                    },
                    expressions: [
                        '"a" ^ 2',
                        "sqrt(144)",
                        "0 and 1",
                        "0 or 1",
                        '-"a"',
                        'upper("c")',
                        `bucket("b", 'M')`,
                        `bucket("b", 's')`,
                    ],
                });
                const schema = await view.expression_schema();
                expect(schema).toEqual({
                    '"a" ^ 2': "float",
                    "sqrt(144)": "float",
                    '-"a"': "integer",
                    "0 and 1": "boolean",
                    "0 or 1": "boolean",
                    'upper("c")': "integer",
                    "bucket(\"b\", 'M')": "integer",
                    "bucket(\"b\", 's')": "datetime",
                });
                view.delete();
                table.delete();
            });
        });
    });
};
