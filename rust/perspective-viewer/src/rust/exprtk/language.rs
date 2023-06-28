// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

use std::cell::RefCell;

use serde::Serialize;

#[derive(Serialize, Clone, Copy)]
pub struct CompletionItemSuggestion {
    pub label: &'static str,
    pub insert_text: &'static str,
    pub documentation: &'static str,
}

thread_local! {
    pub static COMPLETION_COLUMN_NAMES: RefCell<Vec<String>> = RefCell::new(vec![]);

    pub static COMPLETIONS: Vec<CompletionItemSuggestion> = vec![
            CompletionItemSuggestion {
                label: "var",
                insert_text: "var ${1:x := 1}",
                documentation: "Declare a new local variable",
            },
            CompletionItemSuggestion {
                label: "abs",
                insert_text: "abs(${1:x})",
                documentation: "Absolute value of x",
            },
            CompletionItemSuggestion {
                label: "avg",
                insert_text: "avg(${1:x})",
                documentation: "Average of all inputs",
            },
            CompletionItemSuggestion {
                label: "bucket",
                insert_text: "bucket(${1:x}, ${2:y})",
                documentation: "Bucket x by y",
            },
            CompletionItemSuggestion {
                label: "ceil",
                insert_text: "ceil(${1:x})",
                documentation: "Smallest integer >= x",
            },
            CompletionItemSuggestion {
                label: "exp",
                insert_text: "exp(${1:x})",
                documentation: "Natural exponent of x (e ^ x)",
            },
            CompletionItemSuggestion {
                label: "floor",
                insert_text: "floor(${1:x})",
                documentation: "Largest integer <= x",
            },
            CompletionItemSuggestion {
                label: "frac",
                insert_text: "frac(${1:x})",
                documentation: "Fractional portion (after the decimal) of x",
            },
            CompletionItemSuggestion {
                label: "iclamp",
                insert_text: "iclamp(${1:x})",
                documentation: "Inverse clamp x within a range",
            },
            CompletionItemSuggestion {
                label: "inrange",
                insert_text: "inrange(${1:x})",
                documentation: "Returns whether x is within a range",
            },
            CompletionItemSuggestion {
                label: "log",
                insert_text: "log(${1:x})",
                documentation: "Natural log of x",
            },
            CompletionItemSuggestion {
                label: "log10",
                insert_text: "log10(${1:x})",
                documentation: "Base 10 log of x",
            },
            CompletionItemSuggestion {
                label: "log1p",
                insert_text: "log1p(${1:x})",
                documentation: "Natural log of 1 + x where x is very small",
            },
            CompletionItemSuggestion {
                label: "log2",
                insert_text: "log2(${1:x})",
                documentation: "Base 2 log of x",
            },
            CompletionItemSuggestion {
                label: "logn",
                insert_text: "logn(${1:x}, ${2:N})",
                documentation: "Base N log of x where N >= 0",
            },
            CompletionItemSuggestion {
                label: "max",
                insert_text: "max(${1:x})",
                documentation: "Maximum value of all inputs",
            },
            CompletionItemSuggestion {
                label: "min",
                insert_text: "min(${1:x})",
                documentation: "Minimum value of all inputs",
            },
            CompletionItemSuggestion {
                label: "mul",
                insert_text: "mul(${1:x})",
                documentation: "Product of all inputs",
            },
            CompletionItemSuggestion {
                label: "percent_of",
                insert_text: "percent_of(${1:x})",
                documentation: "Percent y of x",
            },
            CompletionItemSuggestion {
                label: "pow",
                insert_text: "pow(${1:x}, ${2:y})",
                documentation: "x to the power of y",
            },
            CompletionItemSuggestion {
                label: "root",
                insert_text: "root(${1:x}, ${2:N})",
                documentation: "N-th root of x where N >= 0",
            },
            CompletionItemSuggestion {
                label: "round",
                insert_text: "round(${1:x})",
                documentation: "Round x to the nearest integer",
            },
            CompletionItemSuggestion {
                label: "sgn",
                insert_text: "sgn(${1:x})",
                documentation: "Sign of x: -1, 1, or 0",
            },
            CompletionItemSuggestion {
                label: "sqrt",
                insert_text: "sqrt(${1:x})",
                documentation: "Square root of x",
            },
            CompletionItemSuggestion {
                label: "sum",
                insert_text: "sum(${1:x})",
                documentation: "Sum of all inputs",
            },
            CompletionItemSuggestion {
                label: "trunc",
                insert_text: "trunc(${1:x})",
                documentation: "Integer portion of x",
            },
            CompletionItemSuggestion {
                label: "acos",
                insert_text: "acos(${1:x})",
                documentation: "Arc cosine of x in radians",
            },
            CompletionItemSuggestion {
                label: "acosh",
                insert_text: "acosh(${1:x})",
                documentation: "Inverse hyperbolic cosine of x in radians",
            },
            CompletionItemSuggestion {
                label: "asin",
                insert_text: "asin(${1:x})",
                documentation: "Arc sine of x in radians",
            },
            CompletionItemSuggestion {
                label: "asinh",
                insert_text: "asinh(${1:x})",
                documentation: "Inverse hyperbolic sine of x in radians",
            },
            CompletionItemSuggestion {
                label: "atan",
                insert_text: "atan(${1:x})",
                documentation: "Arc tangent of x in radians",
            },
            CompletionItemSuggestion {
                label: "atanh",
                insert_text: "atanh(${1:x})",
                documentation: "Inverse hyperbolic tangent of x in radians",
            },
            CompletionItemSuggestion {
                label: "cos",
                insert_text: "cos(${1:x})",
                documentation: "Cosine of x",
            },
            CompletionItemSuggestion {
                label: "cosh",
                insert_text: "cosh(${1:x})",
                documentation: "Hyperbolic cosine of x",
            },
            CompletionItemSuggestion {
                label: "cot",
                insert_text: "cot(${1:x})",
                documentation: "Cotangent of x",
            },
            CompletionItemSuggestion {
                label: "sin",
                insert_text: "sin(${1:x})",
                documentation: "Sine of x",
            },
            CompletionItemSuggestion {
                label: "sinc",
                insert_text: "sinc(${1:x})",
                documentation: "Sine cardinal of x",
            },
            CompletionItemSuggestion {
                label: "sinh",
                insert_text: "sinh(${1:x})",
                documentation: "Hyperbolic sine of x",
            },
            CompletionItemSuggestion {
                label: "tan",
                insert_text: "tan(${1:x})",
                documentation: "Tangent of x",
            },
            CompletionItemSuggestion {
                label: "tanh",
                insert_text: "tanh(${1:x})",
                documentation: "Hyperbolic tangent of x",
            },
            CompletionItemSuggestion {
                label: "deg2rad",
                insert_text: "deg2rad(${1:x})",
                documentation: "Convert x from degrees to radians",
            },
            CompletionItemSuggestion {
                label: "deg2grad",
                insert_text: "deg2grad(${1:x})",
                documentation: "Convert x from degrees to gradians",
            },
            CompletionItemSuggestion {
                label: "rad2deg",
                insert_text: "rad2deg(${1:x})",
                documentation: "Convert x from radians to degrees",
            },
            CompletionItemSuggestion {
                label: "grad2deg",
                insert_text: "grad2deg(${1:x})",
                documentation: "Convert x from gradians to degrees",
            },
            CompletionItemSuggestion {
                label: "concat",
                insert_text: "concat(${1:x}, ${2:y})",
                documentation: "Concatenate string columns and string literals, such as:\nconcat(\"State\" ', ', \"City\")",
            },
            CompletionItemSuggestion {
                label: "order",
                insert_text: "order(${1:input column}, ${2:value}, ...)",
                documentation: "Generates a sort order for a string column based on the input order of the parameters, such as:\norder(\"State\", 'Texas', 'New York')",
            },
            CompletionItemSuggestion {
                label: "upper",
                insert_text: "upper(${1:x})",
                documentation: "Uppercase of x",
            },
            CompletionItemSuggestion {
                label: "lower",
                insert_text: "lower(${1:x})",
                documentation: "Lowercase of x",
            },
            CompletionItemSuggestion {
                label: "hour_of_day",
                insert_text: "hour_of_day(${1:x})",
                documentation: "Return a datetime's hour of the day as a string",
            },
            CompletionItemSuggestion {
                label: "month_of_year",
                insert_text: "month_of_year(${1:x})",
                documentation: "Return a datetime's month of the year as a string",
            },
            CompletionItemSuggestion {
                label: "day_of_week",
                insert_text: "day_of_week(${1:x})",
                documentation: "Return a datetime's day of week as a string",
            },
            CompletionItemSuggestion {
                label: "now",
                insert_text: "now()",
                documentation: "The current datetime in local time",
            },
            CompletionItemSuggestion {
                label: "today",
                insert_text: "today()",
                documentation: "The current date in local time",
            },
            CompletionItemSuggestion {
                label: "is_null",
                insert_text: "is_null(${1:x})",
                documentation: "Whether x is a null value",
            },
            CompletionItemSuggestion {
                label: "is_not_null",
                insert_text: "is_not_null(${1:x})",
                documentation: "Whether x is not a null value",
            },
            CompletionItemSuggestion {
                label: "not",
                insert_text: "not(${1:x})",
                documentation: "not x",
            },
            CompletionItemSuggestion {
                label: "true",
                insert_text: "true",
                documentation: "Boolean value true",
            },
            CompletionItemSuggestion {
                label: "false",
                insert_text: "false",
                documentation: "Boolean value false",
            },
            CompletionItemSuggestion {
                label: "if",
                insert_text: "if (${1:condition}) {} else if (${2:condition}) {} else {}",
                documentation: "An if/else conditional, which evaluates a condition such as:\n if (\"Sales\" > 100) { true } else { false }",
            },
            CompletionItemSuggestion {
                label: "for",
                insert_text: "for (${1:expression}) {}",
                documentation: "A for loop, which repeatedly evaluates an incrementing expression such as:\nvar x := 0; var y := 1; for (x < 10; x += 1) { y := x + y }",
            },
            CompletionItemSuggestion {
                label: "string",
                insert_text: "string(${1:x})",
                documentation: "Converts the given argument to a string",
            },
            CompletionItemSuggestion {
                label: "integer",
                insert_text: "integer(${1:x})",
                documentation: "Converts the given argument to a 32-bit integer. If the result over/under-flows, null is returned",
            },
            CompletionItemSuggestion {
                label: "float",
                insert_text: "float(${1:x})",
                documentation: "Converts the argument to a float",
            },
            CompletionItemSuggestion {
                label: "date",
                insert_text: "date(${1:year}, ${1:month}, ${1:day})",
                documentation: "Given a year, month (1-12) and day, create a new date",
            },
            CompletionItemSuggestion {
                label: "datetime",
                insert_text: "datetime(${1:timestamp})",
                documentation: "Given a POSIX timestamp of milliseconds since epoch, create a new datetime",
            },
            CompletionItemSuggestion {
                label: "boolean",
                insert_text: "boolean(${1:x})",
                documentation: "Converts the given argument to a boolean",
            },
            CompletionItemSuggestion {
                label: "random",
                insert_text: "random()",
                documentation: "Returns a random float between 0 and 1, inclusive.",
            },
            CompletionItemSuggestion {
                label: "match",
                insert_text: "match(${1:string}, ${2:pattern})",
                documentation: "Returns True if any part of string matches pattern, and False otherwise.",
            },
            CompletionItemSuggestion {
                label: "match_all",
                insert_text: "match_all(${1:string}, ${2:pattern})",
                documentation: "Returns True if the whole string matches pattern, and False otherwise.",
            },
            CompletionItemSuggestion {
                label: "search",
                insert_text: "search(${1:string}, ${2:pattern})",
                documentation: "Returns the substring that matches the first capturing group in pattern, or null if there are no capturing groups in the pattern or if there are no matches.",
            },
            CompletionItemSuggestion {
                label: "indexof",
                insert_text: "indexof(${1:string}, ${2:pattern}, ${3:output_vector})",
                documentation: "Writes into index 0 and 1 of output_vector the start and end indices of the substring that matches the first capturing group in pattern.\n\nReturns true if there is a match and output was written, or false if there are no capturing groups in the pattern, if there are no matches, or if the indices are invalid.",
            },
            CompletionItemSuggestion {
                label: "substring",
                insert_text: "substring(${1:string}, ${2:start_idx}, ${3:length})",
                documentation: "Returns a substring of string from start_idx with the given length. If length is not passed in, returns substring from start_idx to the end of the string. Returns null if the string or any indices are invalid.",
            },
            CompletionItemSuggestion {
                label: "replace",
                insert_text: "replace(${1:string}, ${2:pattern}, ${3:replacer})",
                documentation: "Replaces the first match of pattern in string with replacer, or return the original string if no replaces were made.",
            },
            CompletionItemSuggestion {
                label: "replace_all",
                insert_text: "replace(${1:string}, ${2:pattern}, ${3:replacer})",
                documentation: "Replaces all non-overlapping matches of pattern in string with replacer, or return the original string if no replaces were made.",
            },
        ]
    ;
}
