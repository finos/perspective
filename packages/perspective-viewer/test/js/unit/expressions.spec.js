/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {expression_to_computed_column_config} from "../../../src/js/computed_expressions/visitor";

describe("Computed Expression Parser", function() {
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

    it("Should throw when missing an operator", function() {
        expect(() => expression_to_computed_column_config('"Sales"')).toThrow();
    });

    it("Should throw when parentheses are unmatched", function() {
        expect(() => expression_to_computed_column_config('"sqrt("Sales"')).toThrow();
    });

    it("Should throw when a token is unrecognized", function() {
        expect(() => expression_to_computed_column_config("?")).toThrow();
    });
});
