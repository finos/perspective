/* eslint-disable no-undef */
/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

//import {expression_to_computed_column_config} from "../../../src/js/computed_expressions/visitor";

// TODO: need to re-enable testing when metadata is better defined
describe.skip("Computed Expression Parser", function() {
    it("Should parse an operator notation expression", function() {
        const expected = [
            {
                column: "(w + x)",
                computed_function_name: "+",
                inputs: ["w", "x"]
            }
        ];
        const parsed = expression_to_computed_column_config('"w" + "x"');
        expect(parsed).toEqual(expected);
    });

    it("Should parse an operator notation expression named with 'AS'", function() {
        const expected = [
            {
                column: "custom column name",
                computed_function_name: "+",
                inputs: ["w", "x"]
            }
        ];
        const parsed = expression_to_computed_column_config('"w" + "x" as "custom column name"');
        expect(parsed).toEqual(expected);
    });

    it("Should parse an recursive operator notation expression", function() {
        const expected = [
            {
                column: "(w + x)",
                computed_function_name: "+",
                inputs: ["w", "x"]
            },
            {
                column: "(w - x)",
                computed_function_name: "-",
                inputs: ["w", "x"]
            },
            {
                column: "((w + x) * (w - x))",
                computed_function_name: "*",
                inputs: ["(w + x)", "(w - x)"]
            },
            {
                column: "(w / ((w + x) * (w - x)))",
                computed_function_name: "/",
                inputs: ["w", "((w + x) * (w - x))"]
            }
        ];
        const parsed = expression_to_computed_column_config('"w" / (("w" + "x") * ("w" - "x"))');
        expect(parsed).toEqual(expected);
    });

    it("Should parse an recursive operator notation expression named with 'AS'", function() {
        const expected = [
            {
                column: "sub1",
                computed_function_name: "+",
                inputs: ["w", "x"]
            },
            {
                column: "sub2",
                computed_function_name: "-",
                inputs: ["w", "x"]
            },
            {
                column: "sub3",
                computed_function_name: "*",
                inputs: ["sub1", "sub2"]
            },
            {
                column: "final",
                computed_function_name: "/",
                inputs: ["w", "sub3"]
            }
        ];
        const parsed = expression_to_computed_column_config('"w" / (("w" + "x" as "sub1") * ("w" - "x" as "sub2") as "sub3") as "final"');
        expect(parsed).toEqual(expected);
    });

    it("Should parse a function notation expression", function() {
        const expected = [
            {
                column: "sqrt(x)",
                computed_function_name: "sqrt",
                inputs: ["x"]
            }
        ];
        const parsed = expression_to_computed_column_config('sqrt("x")');
        expect(parsed).toEqual(expected);
    });

    it("Should parse a function notation expression named with 'AS'", function() {
        const expected = [
            {
                column: "custom column name",
                computed_function_name: "sqrt",
                inputs: ["x"]
            }
        ];
        const parsed = expression_to_computed_column_config('sqrt("x") as "custom column name"');
        expect(parsed).toEqual(expected);
    });

    it("Should parse a recursive function notation expression", function() {
        const expected = [
            {
                column: "(x ^ 2)",
                computed_function_name: "pow2",
                inputs: ["x"]
            },
            {
                column: "sqrt((x ^ 2))",
                computed_function_name: "sqrt",
                inputs: ["(x ^ 2)"]
            }
        ];
        const parsed = expression_to_computed_column_config('sqrt((pow2("x")))');
        expect(parsed).toEqual(expected);
    });

    it("Should parse a recursive function notation expression named with 'AS'", function() {
        const expected = [
            {
                column: "first",
                computed_function_name: "pow2",
                inputs: ["x"]
            },
            {
                column: "final",
                computed_function_name: "sqrt",
                inputs: ["first"]
            }
        ];
        const parsed = expression_to_computed_column_config('sqrt((pow2("x") as "first")) as "final"');
        expect(parsed).toEqual(expected);
    });

    it("Should parse a recursive function + operator notation expression named with 'AS'", function() {
        const expected = [
            {
                column: "first",
                computed_function_name: "+",
                inputs: ["w", "x"]
            },
            {
                column: "second",
                computed_function_name: "*",
                inputs: ["x", "first"]
            },
            {
                column: "final",
                computed_function_name: "pow2",
                inputs: ["second"]
            }
        ];
        const parsed = expression_to_computed_column_config('pow2(("x" * ("w" + "x" as "first") as "second")) as "final"');
        expect(parsed).toEqual(expected);
    });

    it("Should parse a recursive operator with inset function notation expression, named with 'AS'", function() {
        const expected = [
            {
                column: "first",
                computed_function_name: "+",
                inputs: ["x", "w"]
            },
            {
                column: "second",
                computed_function_name: "sqrt",
                inputs: ["first"]
            },
            {
                column: "third",
                computed_function_name: "/",
                inputs: ["w", "x"]
            },
            {
                column: "fourth",
                computed_function_name: "pow2",
                inputs: ["third"]
            },
            {
                column: "final",
                computed_function_name: "*",
                inputs: ["second", "fourth"]
            }
        ];
        const parsed = expression_to_computed_column_config('(sqrt(("x" + "w" as "first")) as "second") * (pow2(("w" / "x" as "third")) as "fourth") as "final"');
        expect(parsed).toEqual(expected);
    });

    it("Should parse all arity 1 functional operators", function() {
        const functions = [
            "abs",
            "pow2",
            "sqrt",
            "invert",
            "log",
            "exp",
            "bin10",
            "bin100",
            "bin1000",
            "bin10th",
            "bin100th",
            "bin1000th",
            "length",
            "day_of_week",
            "month_of_year",
            "second_bucket",
            "minute_bucket",
            "hour_bucket",
            "day_bucket",
            "week_bucket",
            "month_bucket",
            "year_bucket"
        ];

        for (const f of functions) {
            const expression = `${f}("column") as "alias"`;
            const parsed = [
                {
                    column: "alias",
                    computed_function_name: f,
                    inputs: ["column"]
                }
            ];
            expect(expression_to_computed_column_config(expression)).toEqual(parsed);
        }
    });

    it("Should parse all arity 2 functional operators", function() {
        const functions = ["concat_comma", "concat_space"];

        for (const f of functions) {
            const expression = `${f}("column", "column2") as "alias"`;
            const parsed = [
                {
                    column: "alias",
                    computed_function_name: f,
                    inputs: ["column", "column2"]
                }
            ];
            expect(expression_to_computed_column_config(expression)).toEqual(parsed);
        }
    });

    it("Should parse all arity 2 operators", function() {
        const functions = ["+", "-", "/", "*", "^", "%", "==", "!=", ">", "<", "is"];

        for (const f of functions) {
            const expression = `"column" ${f} "column2" as "alias"`;
            const parsed = [
                {
                    column: "alias",
                    computed_function_name: f,
                    inputs: ["column", "column2"]
                }
            ];
            expect(expression_to_computed_column_config(expression)).toEqual(parsed);
        }
    });

    it("Should throw when missing an operator", function() {
        expect(() => expression_to_computed_column_config('"Sales"')).toThrow();
    });

    it("Should throw when parentheses are unmatched", function() {
        expect(() => expression_to_computed_column_config('"sqrt("Sales"')).toThrow();
    });

    it("Should throw when a token is unrecognized", function() {
        expect(() => expression_to_computed_column_config("?")).toThrow();
    });

    // describe.skip("Autocomplete", function() {
    //     it("Should return all valid tokens for beginning expression if expression is empty", function() {
    //         expect(get_autocomplete_suggestions("").map(x => x.value)).toEqual([
    //             "(",
    //             "sqrt(",
    //             "pow2(",
    //             "abs(",
    //             "invert(",
    //             "log(",
    //             "exp(",
    //             "bin1000th(",
    //             "bin1000(",
    //             "bin100th(",
    //             "bin100(",
    //             "bin10th(",
    //             "bin10(",
    //             "length(",
    //             "uppercase(",
    //             "lowercase(",
    //             "concat_comma(",
    //             "concat_space(",
    //             "hour_of_day(",
    //             "day_of_week(",
    //             "month_of_year(",
    //             "second_bucket(",
    //             "minute_bucket(",
    //             "hour_bucket(",
    //             "day_bucket(",
    //             "week_bucket(",
    //             "month_bucket(",
    //             "year_bucket("
    //         ]);
    //     });

    //     it("Should return correct functions when function is at beginning of expression", function() {
    //         const result = ComputedExpressionColumnLexer.tokenize("c");
    //         expect(get_autocomplete_suggestions("c", result).map(x => x.value)).toEqual(["concat_comma(", "concat_space("]);
    //     });

    //     it("Should return close parenthesis or comma inside a function", function() {
    //         const result = ComputedExpressionColumnLexer.tokenize("concat_comma('Sales'");
    //         expect(get_autocomplete_suggestions("concat_comma('Sales'", result).map(x => x.value)).toEqual([",", ")"]);
    //     });

    //     const operators = ["+ ", "- ", "* ", "/ ", "^ ", "% ", "== ", "!= ", "> ", "< ", "is "];

    //     it("Should return all operator types when last token is a column name", function() {
    //         const result = ComputedExpressionColumnLexer.tokenize("'Sales'");
    //         expect(get_autocomplete_suggestions("'Sales'", result).map(x => x.value)).toEqual(operators);
    //     });

    //     it("Should make no distinction between a last token with or without space", function() {
    //         const result = ComputedExpressionColumnLexer.tokenize("'Sales' ");
    //         expect(get_autocomplete_suggestions("'Sales' ", result).map(x => x.value)).toEqual(operators);
    //     });
    // });
});
