/* eslint-disable no-undef */
/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// The parser reads metadata from the Perspective `Table`, so unit tests need
// to import Perspective in order to `seed` the parser with actual, valid
// computations.
import perspective from "@finos/perspective";
import {COMPUTED_EXPRESSION_PARSER} from "../../../src/js/computed_expressions/computed_expression_parser";

let TABLE;

describe("Computed Expression Parser", function() {
    beforeAll(async () => {
        TABLE = perspective.table({
            a: [1, 2, 3]
        });
        const computed_functions = await TABLE.get_computed_functions();
        COMPUTED_EXPRESSION_PARSER.init(computed_functions);
    });

    afterAll(() => {
        TABLE.delete();
    });

    it("Should parse an operator notation expression", function() {
        const expected = [
            {
                column: "(w + x)",
                computed_function_name: "+",
                inputs: ["w", "x"]
            }
        ];
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('"w" + "x"');
        expect(parsed).toEqual(expected);
    });

    it("Should parse an operator notation expression with associativity", function() {
        const expected = [
            {
                column: "(w + x)",
                computed_function_name: "+",
                inputs: ["w", "x"]
            },
            {
                column: "((w + x) + z)",
                computed_function_name: "+",
                inputs: ["(w + x)", "z"]
            }
        ];
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" + "z"');
        expect(parsed).toEqual(expected);
    });

    it("Should parse an operator notation expression with associativity and operator precedence", function() {
        const expected = [
            {
                column: "(w * x)",
                computed_function_name: "*",
                inputs: ["w", "x"]
            },
            {
                column: "(z / abc)",
                computed_function_name: "/",
                inputs: ["w", "abc"]
            },
            {
                column: "((w * x) + (z / abc))",
                computed_function_name: "+",
                inputs: ["(w + x)", "(z / abc)"]
            }
        ];
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('"w" * "x" + "z" / "abc"');
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
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" as "custom column name"');
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
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('"w" / (("w" + "x") * ("w" - "x"))');
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
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('"w" / (("w" + "x" as "sub1") * ("w" - "x" as "sub2") as "sub3") as "final"');
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
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('sqrt("x")');
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
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('sqrt("x") as "custom column name"');
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
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('sqrt((pow2("x")))');
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
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('sqrt((pow2("x") as "first")) as "final"');
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
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('pow2(("x" * ("w" + "x" as "first") as "second")) as "final"');
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
        const parsed = COMPUTED_EXPRESSION_PARSER.parse('(sqrt(("x" + "w" as "first")) as "second") * (pow2(("w" / "x" as "third")) as "fourth") as "final"');
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
            expect(COMPUTED_EXPRESSION_PARSER.parse(expression)).toEqual(parsed);
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
            expect(COMPUTED_EXPRESSION_PARSER.parse(expression)).toEqual(parsed);
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
            expect(COMPUTED_EXPRESSION_PARSER.parse(expression)).toEqual(parsed);
        }
    });

    it("Should throw when missing an operator", function() {
        expect(() => COMPUTED_EXPRESSION_PARSER.parse('"Sales"')).toThrow();
    });

    it("Should throw when parentheses are unmatched", function() {
        expect(() => COMPUTED_EXPRESSION_PARSER.parse('"sqrt("Sales"')).toThrow();
    });

    it("Should throw when a token is unrecognized", function() {
        expect(() => COMPUTED_EXPRESSION_PARSER.parse("?")).toThrow();
    });
});
