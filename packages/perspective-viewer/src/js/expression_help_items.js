/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * All operators, functions, keywords, and control flow structures from
 * the expression engine.
 */
export const EXPRESSION_HELP_ITEMS = {
    numeric: [
        {
            name: "+",
            description: "Add x to y",
            template: "x + y"
        },
        {
            name: "-",
            description: "Subtract y from x",
            template: "x - y"
        },
        {
            name: "*",
            description: "Multiply x and y",
            template: "x * y"
        },
        {
            name: "/",
            description: "Divide x by y",
            template: "x / y"
        },
        {
            name: "%",
            description: "Modulus x of y",
            template: "x % y"
        },
        {
            name: "^",
            description: "Raise x to the power of y",
            template: "x ^ y"
        },
        "DIVIDER",
        {
            name: "abs",
            description: "Absolute value of x",
            template: "abs(x)"
        },
        {
            name: "avg",
            description: "Average of all inputs",
            template: "avg(x, y, z, ...)"
        },
        {
            name: "bucket",
            description: "Bucket x by y",
            template: "bucket(x, y)"
        },
        {
            name: "ceil",
            description: "Smallest integer >= x",
            template: "ceil(x)"
        },
        {
            name: "exp",
            description: "Natural exponent of x (e ^ x)",
            template: "exp(x)"
        },
        {
            name: "floor",
            description: "Largest integer <= x",
            template: "floor(x)"
        },
        {
            name: "frac",
            description: "Fractional portion (after the decimal) of x",
            template: "frac(x)"
        },
        {
            name: "iclamp",
            description: "Inverse clamp x within a range",
            template: "iclamp(low, x, high)"
        },
        {
            name: "inrange",
            description: "Returns whether x is within a range",
            template: "inrange(low, x, high)"
        },
        {
            name: "log",
            description: "Natural log of x",
            template: "log(x)"
        },
        {
            name: "log10",
            description: "Base 10 log of x",
            template: "log10(x)"
        },
        {
            name: "log1p",
            description: "Natural log of 1 + x where x is very small",
            template: "log1p(x)"
        },
        {
            name: "log2",
            description: "Base 2 log of x",
            template: "log2(x)"
        },
        {
            name: "logn",
            description: "Base N log of x where N >= 0",
            template: "logn(x, N)"
        },
        {
            name: "max",
            description: "Maximum value of all inputs",
            template: "max(x, y, ...)"
        },
        {
            name: "min",
            description: "Minimum value of all inputs",
            template: "min(x, y, ...)"
        },
        {
            name: "mul",
            description: "Product of all inputs",
            template: "mul(x, y, ...)"
        },
        {
            name: "percent_of",
            description: "Percent y of x",
            template: "percent_of(x, y)"
        },
        {
            name: "pow",
            description: "x to the power of y",
            template: "pow(x, y)"
        },
        {
            name: "root",
            description: "N-th root of x where N >= 0",
            template: "root(x, N)"
        },
        {
            name: "round",
            description: "Round x to the nearest integer",
            template: "round(x)"
        },
        {
            name: "sgn",
            description: "Sign of x: -1, 1, or 0",
            template: "sgn(x)"
        },
        {
            name: "sqrt",
            description: "Square root of x",
            template: "sqrt(x)"
        },
        {
            name: "sum",
            description: "Sum of all inputs",
            template: "sum(x, y, ...)"
        },
        {
            name: "trunc",
            description: "Integer portion of x",
            template: "trunc(x)"
        },
        "DIVIDER",
        {
            name: "acos",
            description: "Arc cosine of x in radians",
            template: "acos(x)"
        },
        {
            name: "acosh",
            description: "Inverse hyperbolic cosine of x in radians",
            template: "acosh(x)"
        },
        {
            name: "asin",
            description: "Arc sine of x in radians",
            template: "asin(x)"
        },
        {
            name: "asinh",
            description: "Inverse hyperbolic sine of x in radians",
            template: "asinh(x)"
        },
        {
            name: "atan",
            description: "Arc tangent of x in radians",
            template: "atan(x)"
        },
        {
            name: "atanh",
            description: "Inverse hyperbolic tangent of x in radians",
            template: "atanh(x)"
        },
        {
            name: "cos",
            description: "Cosine of x",
            template: "cos(x)"
        },
        {
            name: "cosh",
            description: "Hyperbolic cosine of x",
            template: "cosh(x)"
        },
        {
            name: "cot",
            description: "Cotangent of x",
            template: "cot(x)"
        },
        {
            name: "sin",
            description: "Sine of x",
            template: "sin(x)"
        },
        {
            name: "sinc",
            description: "Sine cardinal of x",
            template: "sinc(x)"
        },
        {
            name: "sinh",
            description: "Hyperbolic sine of x",
            template: "sinh(x)"
        },
        {
            name: "tan",
            description: "Tangent of x",
            template: "tan(x)"
        },
        {
            name: "tanh",
            description: "Hyperbolic tangent of x",
            template: "tanh(x)"
        },
        {
            name: "deg2rad",
            description: "Convert x from degrees to radians",
            template: "deg2rad(x)"
        },
        {
            name: "deg2grad",
            description: "Convert x from degrees to gradians",
            template: "deg2grad(x)"
        },
        {
            name: "rad2deg",
            description: "Convert x from radians to degrees",
            template: "rad2deg(x)"
        },
        {
            name: "grad2deg",
            description: "Convert x from gradians to degrees",
            template: "grad2deg(x)"
        }
    ],
    string: [
        {
            name: "concat",
            description: "Concatenate string literals and columns",
            template: "concat(x, 'y', ...)"
        },
        {
            name: "order",
            description: "Generates a sort order for a string column based on input order",
            template: "order(column, 'c', 'b', 'a')"
        },
        {
            name: "upper",
            description: "Uppercase of x",
            template: "upper(x)"
        },
        {
            name: "lower",
            description: "Lowercase of x",
            template: "lower(x)"
        }
    ],
    datetime: [
        {
            name: "bucket",
            description: "Bucket a datetime by a unit: [s]econds, [m]inutes, [h]ours, [D]ays, [W]eeks, [M]onths, and [Y]ears",
            template: "bucket(x, 's/m/h/D/W/M/Y')"
        },
        {
            name: "month_of_year",
            description: "Return a datetime's month of the year as a string",
            template: "month_of_year(x)"
        },
        {
            name: "day_of_week",
            description: "Return a datetime's day of week as a string",
            template: "day_of_week(x)"
        },
        {
            name: "now",
            description: "The current datetime in local time",
            template: "now()"
        },
        {
            name: "today",
            description: "The current date in local time",
            template: "today()"
        }
    ],
    comparison: [
        {
            name: "==",
            description: "x is equal to y",
            template: "x == y"
        },
        {
            name: "!=",
            description: "x does not equal y",
            template: "x != y"
        },
        {
            name: "<",
            description: "x is less than y",
            template: "x < y"
        },
        {
            name: ">",
            description: "x is greater than y",
            template: "x > y"
        },
        {
            name: "<=",
            description: "x is less than or equal to y",
            template: "x <= y"
        },
        {
            name: ">=",
            description: "x is greater than or equal to y",
            template: "x >= y"
        },
        "DIVIDER",
        {
            name: "and",
            description: "x and y are true and of the same type",
            template: "x and y"
        },
        {
            name: "or",
            description: "x or y is true",
            template: "x or y"
        },
        {
            name: "nand",
            description: "NOT AND: x or y are false",
            template: "x nand y"
        },
        {
            name: "nor",
            description: "NOT OR: x and y are false",
            template: "x nor y"
        },
        {
            name: "xor",
            description: "Exclusive OR: only x or y is true",
            template: "x nor y"
        },
        {
            name: "is_null",
            description: "Whether x is null",
            template: "is_null(x)"
        },
        {
            name: "is_not_null",
            description: "Whether x is not null",
            template: "is_not_null(x)"
        },
        {
            name: "not",
            description: "not x",
            template: "not(x)"
        },
        {
            name: "true",
            description: "Boolean value true",
            template: "true"
        },
        {
            name: "false",
            description: "Boolean value false",
            template: "false"
        }
    ],
    control_flow: [
        {
            name: "column alias",
            description: "Gives the expression a custom name",
            template: "// alias\n"
        },
        {
            name: "var x := y",
            description: "Store x as a expression-scoped variable",
            template: "var x := y"
        },
        {
            name: "if/else",
            description: "if/else if/else conditional",
            template: "if (condition) {\n  x\n} else if (condition) {\n  y\n} else {\n  z\n};"
        },
        {
            name: "?",
            description: "Ternary if/else",
            template: "condition ? x : y;"
        },
        {
            name: "for",
            description: "For loop",
            template: "for (var i := 0; i < end condition; i += 1) {\n  expression;\n}"
        }
    ]
};
