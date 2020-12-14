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

describe("Computed Expression Parser", () => {
    beforeAll(async () => {
        TABLE = await perspective.table({
            a: [1, 2, 3]
        });
        const computed_functions = await TABLE.get_computed_functions();
        COMPUTED_EXPRESSION_PARSER.init(computed_functions);
    });

    afterAll(() => {
        TABLE.delete();
    });

    describe("Operator notation", () => {
        it("Should parse an operator notation expression", () => {
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

        it("Should parse an operator notation expression named with 'AS'", () => {
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

        it("Should parse an recursive operator notation expression", () => {
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

        it("Should parse an recursive operator notation expression named with 'AS'", () => {
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
    });

    describe("Operator notation with associativity/precedence", () => {
        it("Should parse an operator notation expression with associativity", () => {
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

        it.skip("Should parse an operator notation expression with associativity, named with 'as'", () => {
            const expected = [
                {
                    column: "(w + x)",
                    computed_function_name: "+",
                    inputs: ["w", "x"]
                },
                {
                    column: "abc",
                    computed_function_name: "+",
                    inputs: ["(w + x)", "z"]
                }
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" + "z" as "abc"');
            expect(parsed).toEqual(expected);
        });

        it("Should parse an operator notation expression with associativity, named multiple times with 'as'", () => {
            const expected = [
                {
                    column: "abc",
                    computed_function_name: "+",
                    inputs: ["w", "x"]
                },
                {
                    column: "cba",
                    computed_function_name: "+",
                    inputs: ["abc", "z"]
                }
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" as "abc" + "z" as "cba"');
            expect(parsed).toEqual(expected);
        });

        it("Should parse an operator notation expression with associativity and operator precedence", () => {
            const expected = [
                {
                    column: "(w * x)",
                    computed_function_name: "*",
                    inputs: ["w", "x"]
                },
                {
                    column: "(z / abc)",
                    computed_function_name: "/",
                    inputs: ["z", "abc"]
                },
                {
                    column: "((w * x) + (z / abc))",
                    computed_function_name: "+",
                    inputs: ["(w * x)", "(z / abc)"]
                }
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"w" * "x" + "z" / "abc"');
            expect(parsed).toEqual(expected);
        });

        it("Should parse an operator notation expression with exponent precedence", () => {
            const expected = [
                {
                    column: "(Profit ^ Quantity)",
                    computed_function_name: "^",
                    inputs: ["Profit", "Quantity"]
                },
                {
                    column: "(Sales - (Profit ^ Quantity))",
                    computed_function_name: "-",
                    inputs: ["Sales", "(Profit ^ Quantity)"]
                }
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"Sales" - "Profit" ^ "Quantity"');
            expect(parsed).toEqual(expected);
        });

        it("Should parse an operator notation expression with boolean precedence under all other operations", () => {
            const expected = [
                {
                    column: "(x + y)",
                    computed_function_name: "+",
                    inputs: ["x", "y"]
                },
                {
                    column: "(a - b)",
                    computed_function_name: "-",
                    inputs: ["a", "b"]
                },
                {
                    column: "((x + y) > (a - b))",
                    computed_function_name: ">",
                    inputs: ["(x + y)", "(a - b)"]
                }
            ];
            // Boolean comparators should compare the result of operations and
            // have the lowest precedence.
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"x" + "y" > "a" - "b"');
            expect(parsed).toEqual(expected);
        });

        it("Should parse an operator notation expression with left-to-right precedence", () => {
            const expected = [
                {
                    column: "(Sales * Profit)",
                    computed_function_name: "*",
                    inputs: ["Sales", "Profit"]
                },
                {
                    column: "exp(Discount)",
                    computed_function_name: "exp",
                    inputs: ["Discount"]
                },
                {
                    column: "((Sales * Profit) - exp(Discount))",
                    computed_function_name: "-",
                    inputs: ["(Sales * Profit)", "exp(Discount)"]
                }
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"Sales" * "Profit" - exp("Discount")');
            expect(parsed).toEqual(expected);
        });

        it("Should parse an operator notation expression with left-to-right precedence, named with AS", () => {
            const expected = [
                {
                    column: "ABC",
                    computed_function_name: "*",
                    inputs: ["Sales", "Profit"]
                },
                {
                    column: "CBA",
                    computed_function_name: "exp",
                    inputs: ["Discount"]
                },
                {
                    column: "BBB",
                    computed_function_name: "-",
                    inputs: ["ABC", "CBA"]
                }
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"Sales" * "Profit" as "ABC" - exp("Discount") as "CBA" as "BBB"');
            expect(parsed).toEqual(expected);
        });

        it("Should parse an operator notation expression with left-to-right precedence and exponent, named with AS", () => {
            const expected = [
                {column: "CBA", computed_function_name: "exp", inputs: ["Discount"]},
                {column: "BBB", computed_function_name: "^", inputs: ["Profit", "CBA"]},
                {column: "(Sales * BBB)", computed_function_name: "*", inputs: ["Sales", "BBB"]}
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"Sales" * "Profit" ^ exp("Discount") as "CBA" as "BBB"');
            expect(parsed).toEqual(expected);
        });

        it.skip("Should parse an operator notation expression with left-to-right precedence and exponent, all named with AS", () => {
            const expected = [
                {column: "ABC", computed_function_name: "*", inputs: ["Sales", "Profit"]},
                {column: "CBA", computed_function_name: "exp", inputs: ["Discount"]},
                {column: "BBB", computed_function_name: "^", inputs: ["ABC", "CBA"]}
            ];
            // Currently parser cannot evaluate because it wants to do
            // "Profit" as "ABC" ^ exp("Discount"), which is invalid syntax. It
            // should evalute statements with "AS" almost as if parentheses
            // have been applied. If you change * to ^, the statement works
            // because precedence is correct - but following an operator of lower
            // precedence with one of higher precedence, while using "AS", fails.
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"Sales" * "Profit" as "ABC" ^ exp("Discount") as "CBA" as "BBB"');
            expect(parsed).toEqual(expected);
        });

        it("Should parse an operator notation expression with left-to-right precedence and final result named with AS", () => {
            const expected = [
                {
                    column: "BBB",
                    computed_function_name: "^",
                    inputs: ["Profit", "Discount"]
                },
                {
                    column: "(Sales + BBB)",
                    computed_function_name: "+",
                    inputs: ["Sales", "BBB"]
                }
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('"Sales" + "Profit" ^ "Discount" as "BBB"');
            expect(parsed).toEqual(expected);
        });
    });

    describe("Function notation", () => {
        it("Should parse a function notation expression", () => {
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

        it("Should parse a function notation expression named with 'AS'", () => {
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

        it("Should parse a recursive function notation expression", () => {
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

        it("Should parse a recursive function notation expression without parentheses", () => {
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
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('sqrt(pow2("x"))');
            expect(parsed).toEqual(expected);
        });

        it("Should parse a recursive function notation expression named with 'AS'", () => {
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

        it("Should parse a recursive function notation expression named with 'AS' without parentheses", () => {
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
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('sqrt(pow2("x") as "first") as "final"');
            expect(parsed).toEqual(expected);
        });
    });

    describe("Mixed function/operator notation", () => {
        it("Should parse a recursive function + operator notation expression named with 'AS'", () => {
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

        it("Should parse a recursive operator with inset function notation expression, named with 'AS'", () => {
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

        it("Should parse an operator expression inside a function without parentheses", () => {
            const expected = [
                {
                    column: "(x + y)",
                    computed_function_name: "+",
                    inputs: ["x", "y"]
                },
                {
                    column: "sqrt((x + y))",
                    computed_function_name: "sqrt",
                    inputs: ["(x + y)"]
                }
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('sqrt("x" + "y")');
            expect(parsed).toEqual(expected);
        });

        it("Should parse an operator expression inside a function without parentheses, respecting all precedence rules", () => {
            const expected = [
                {
                    column: "(z ^ a)",
                    computed_function_name: "^",
                    inputs: ["z", "a"]
                },
                {
                    column: "(y * (z ^ a))",
                    computed_function_name: "*",
                    inputs: ["y", "(z ^ a)"]
                },
                {
                    column: "(x + (y * (z ^ a)))",
                    computed_function_name: "+",
                    inputs: ["x", "(y * (z ^ a))"]
                },
                {
                    column: "sqrt((x + (y * (z ^ a))))",
                    computed_function_name: "sqrt",
                    inputs: ["(x + (y * (z ^ a)))"]
                }
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('sqrt("x" + "y" * "z" ^ "a")');
            expect(parsed).toEqual(expected);
        });

        it("Should parse arbitary operators and functions nested within each other", () => {
            const expected = [
                {column: "ABC", computed_function_name: "pow2", inputs: ["Sales"]},
                {column: "(Row ID * Profit)", computed_function_name: "*", inputs: ["Row ID", "Profit"]},
                {column: "sqrt((Row ID * Profit))", computed_function_name: "sqrt", inputs: ["(Row ID * Profit)"]},
                {column: "(ABC * sqrt((Row ID * Profit)))", computed_function_name: "*", inputs: ["ABC", "sqrt((Row ID * Profit))"]},
                {column: "exp((ABC * sqrt((Row ID * Profit))))", computed_function_name: "exp", inputs: ["(ABC * sqrt((Row ID * Profit)))"]}
            ];
            const parsed = COMPUTED_EXPRESSION_PARSER.parse('exp(pow2("Sales") as "ABC" * sqrt("Row ID" * "Profit"))');
            expect(parsed).toEqual(expected);
        });
    });

    describe("Operators and functions", () => {
        it("Should parse all arity 1 functional operators", () => {
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

        it("Should parse all arity 2 functional operators", () => {
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

        it("Should parse all arity 2 operators", () => {
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
    });

    describe("Autocomplete suggestions", () => {
        it("Should suggest a partial function", () => {
            const expression = "s";
            const lexer_result = COMPUTED_EXPRESSION_PARSER._lexer.tokenize(expression);
            const suggestions = COMPUTED_EXPRESSION_PARSER.get_autocomplete_suggestions(expression, lexer_result);
            const expected = ["sqrt", "second_bucket", "abs", "uppercase", "lowercase", "concat_space"];

            for (const suggestion of suggestions) {
                expect(expected.includes(suggestion.pattern)).toBe(true);
            }
        });

        it("Should suggest an operator after column name", () => {
            const expression = '"Sales"';
            const lexer_result = COMPUTED_EXPRESSION_PARSER._lexer.tokenize(expression);
            const suggestions = COMPUTED_EXPRESSION_PARSER.get_autocomplete_suggestions(expression, lexer_result);
            const expected = ["^", "*", "/", "+", "-", "%", "==", "!=", ">", "<", "is"];

            for (const suggestion of suggestions) {
                expect(expected.includes(suggestion.pattern)).toBe(true);
            }
        });

        it("Should suggest functions with the same input type & return type after a open function definition, integer and float", () => {
            const expression = "sqrt(";
            const lexer_result = COMPUTED_EXPRESSION_PARSER._lexer.tokenize(expression);
            const suggestions = COMPUTED_EXPRESSION_PARSER.get_autocomplete_suggestions(expression, lexer_result, ["float", "integer"], true);
            const expected = ["(", "sqrt", "pow2", "abs", "invert", "log", "exp", "bin1000th", "bin1000", "bin100th", "bin100", "bin10th", "bin10"];

            for (const suggestion of suggestions) {
                expect(expected.includes(suggestion.pattern)).toBe(true);
            }
        });

        it("Should suggest operators with the same input type after a open function definition and column name, integer and float", () => {
            const expression = "sqrt('Sales'";
            const lexer_result = COMPUTED_EXPRESSION_PARSER._lexer.tokenize(expression);
            const suggestions = COMPUTED_EXPRESSION_PARSER.get_autocomplete_suggestions(expression, lexer_result, ["float", "integer"]);
            const expected = ["^", "*", "/", "+", "-", "%", ",", ")", "==", "!=", ">", "<"];

            for (const suggestion of suggestions) {
                expect(expected.includes(suggestion.pattern)).toBe(true);
            }
        });

        it("Should suggest operators with the same input type & return type after a open function definition and column name, integer and float", () => {
            const expression = "sqrt('Sales'";
            const lexer_result = COMPUTED_EXPRESSION_PARSER._lexer.tokenize(expression);
            const suggestions = COMPUTED_EXPRESSION_PARSER.get_autocomplete_suggestions(expression, lexer_result, ["float", "integer"], true);
            const expected = ["^", "*", "/", "+", "-", "%", ",", ")"];

            for (const suggestion of suggestions) {
                expect(expected.includes(suggestion.pattern)).toBe(true);
            }
        });

        it("Should suggest a function with the same input type after a open function definition, date and datetime", () => {
            const expression = "day_bucket(";
            const lexer_result = COMPUTED_EXPRESSION_PARSER._lexer.tokenize(expression);
            const suggestions = COMPUTED_EXPRESSION_PARSER.get_autocomplete_suggestions(expression, lexer_result, ["datetime", "date"], true);
            const expected = ["(", "hour_of_day", "day_of_week", "month_of_year", "second_bucket", "minute_bucket", "hour_bucket", "day_bucket", "week_bucket", "month_bucket", "year_bucket"];

            for (const suggestion of suggestions) {
                expect(expected.includes(suggestion.pattern)).toBe(true);
            }
        });

        it("Should suggest a function with the same input type & return type after a open function definition, date and datetime", () => {
            const expression = "day_bucket(";
            const lexer_result = COMPUTED_EXPRESSION_PARSER._lexer.tokenize(expression);
            const suggestions = COMPUTED_EXPRESSION_PARSER.get_autocomplete_suggestions(expression, lexer_result, ["datetime", "date"], true);
            const expected = ["(", "second_bucket", "minute_bucket", "hour_bucket", "day_bucket", "week_bucket", "month_bucket", "year_bucket"];

            for (const suggestion of suggestions) {
                expect(expected.includes(suggestion.pattern)).toBe(true);
            }
        });

        it("Should suggest a function with the same input type after a open function definition, string", () => {
            const expression = "concat_comma(";
            const lexer_result = COMPUTED_EXPRESSION_PARSER._lexer.tokenize(expression);
            const suggestions = COMPUTED_EXPRESSION_PARSER.get_autocomplete_suggestions(expression, lexer_result, ["string"]);
            const expected = ["(", "length", "uppercase", "lowercase", "concat_comma", "concat_space"];

            for (const suggestion of suggestions) {
                expect(expected.includes(suggestion.pattern)).toBe(true);
            }
        });

        it("Should suggest a function with the same input type & return type after a open function definition, string", () => {
            const expression = "concat_comma(";
            const lexer_result = COMPUTED_EXPRESSION_PARSER._lexer.tokenize(expression);
            const suggestions = COMPUTED_EXPRESSION_PARSER.get_autocomplete_suggestions(expression, lexer_result, ["string"], true);
            // no `length` as that returns an int
            const expected = ["(", "uppercase", "lowercase", "concat_comma", "concat_space"];

            for (const suggestion of suggestions) {
                expect(expected.includes(suggestion.pattern)).toBe(true);
            }
        });
    });

    it("Should throw when missing an operator", () => {
        expect(() => COMPUTED_EXPRESSION_PARSER.parse('"Sales"')).toThrow();
    });

    it("Should throw when parentheses are unmatched", () => {
        expect(() => COMPUTED_EXPRESSION_PARSER.parse('"sqrt("Sales"')).toThrow();
    });

    it("Should throw when a token is unrecognized", () => {
        expect(() => COMPUTED_EXPRESSION_PARSER.parse("?")).toThrow();
    });

    it("Should throw when as is applied without an operator", () => {
        expect(() => COMPUTED_EXPRESSION_PARSER.parse('"Sales" as "abc"')).toThrow();
    });

    it("Should throw when as is used after a column name without an operator", () => {
        expect(() => COMPUTED_EXPRESSION_PARSER.parse('"Sales" as "ABC" + "Profit" as "ABC"')).toThrow();
    });
});
