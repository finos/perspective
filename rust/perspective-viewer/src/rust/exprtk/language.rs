/////////////////////////////////////////////////////////, kind: (), insert_text: (), insert_text_rules: (), documentation: () ///////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js::monaco::*;

use std::cell::{Cell, RefCell};

thread_local! {

    pub static COMPLETION_COLUMN_NAMES: RefCell<Vec<String>> = RefCell::new(vec![]);

    pub static IS_REGISTERED: Cell<bool> = Cell::new(false);

    pub static REGISTER: RegisterArgs = RegisterArgs { id: "exprtk" };

    pub static TOKENIZER: MonarchTokensProviderArgs<'static> = MonarchTokensProviderArgs {
        brackets: vec![
            vec!["(", ")", "delimiter.parenthesis"],
        ],
        tokenizer: MonarchTokenizer {
            root: vec![
                vec!["\\/\\/.*", "comment"],
                vec!["[a-zA-Z_]+?", "variable"],
                vec!["\".+?\"", "string"],
                vec!["\'.+?\'", "string"],
                vec!["[0-9]", "number"],
                vec!["[\\[\\]\\{\\}\\(\\)]", "delimiter"],
            ],
        },
    };

    pub static LANGUAGE_CONFIG: LanguageConfigurationArgs<'static> = LanguageConfigurationArgs {
        auto_closing_pairs: vec![
            // // Don't auto-close quotes because the CompletionProvider will?
            // AutoClosingPairs {
            //     open: "\"",
            //     close: "\""
            // },
            AutoClosingPairs {
                open: "'",
                close: "'"
            },
            AutoClosingPairs {
                open: "(",
                close: ")"
            },
            AutoClosingPairs {
                open: "[",
                close: "]"
            },
            AutoClosingPairs {
                open: "{",
                close: "}"
            },
        ]
    };

    pub static COMPLETIONS: RegisterCompletionItemSuggestions = RegisterCompletionItemSuggestions {
        suggestions: vec![
            CompletionItemSuggestion {
                label: "var".to_owned(),
                kind: 17,
                insert_text: "var ${1:x := 1}".to_owned(),
                insert_text_rules: 4,
                documentation: "Declare a new local variable".to_owned(),
            },
            CompletionItemSuggestion {
                label: "abs".to_owned(),
                kind: 1,
                insert_text: "abs(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Absolute value of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "avg".to_owned(),
                kind: 1,
                insert_text: "avg(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Average of all inputs".to_owned(),
            },
            CompletionItemSuggestion {
                label: "bucket".to_owned(),
                kind: 1,
                insert_text: "bucket(${1:x}, ${2:y})".to_owned(),
                insert_text_rules: 4,
                documentation: "Bucket x by y".to_owned(),
            },
            CompletionItemSuggestion {
                label: "ceil".to_owned(),
                kind: 1,
                insert_text: "ceil(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Smallest integer >= x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "exp".to_owned(),
                kind: 1,
                insert_text: "exp(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Natural exponent of x (e ^ x)".to_owned(),
            },
            CompletionItemSuggestion {
                label: "floor".to_owned(),
                kind: 1,
                insert_text: "floor(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Largest integer <= x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "frac".to_owned(),
                kind: 1,
                insert_text: "frac(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Fractional portion (after the decimal) of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "iclamp".to_owned(),
                kind: 1,
                insert_text: "iclamp(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Inverse clamp x within a range".to_owned(),
            },
            CompletionItemSuggestion {
                label: "inrange".to_owned(),
                kind: 1,
                insert_text: "inrange(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Returns whether x is within a range".to_owned(),
            },
            CompletionItemSuggestion {
                label: "log".to_owned(),
                kind: 1,
                insert_text: "log(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Natural log of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "log10".to_owned(),
                kind: 1,
                insert_text: "log10(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Base 10 log of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "log1p".to_owned(),
                kind: 1,
                insert_text: "log1p(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Natural log of 1 + x where x is very small".to_owned(),
            },
            CompletionItemSuggestion {
                label: "log2".to_owned(),
                kind: 1,
                insert_text: "log2(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Base 2 log of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "logn".to_owned(),
                kind: 1,
                insert_text: "logn(${1:x}, ${2:N})".to_owned(),
                insert_text_rules: 4,
                documentation: "Base N log of x where N >= 0".to_owned(),
            },
            CompletionItemSuggestion {
                label: "max".to_owned(),
                kind: 1,
                insert_text: "max(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Maximum value of all inputs".to_owned(),
            },
            CompletionItemSuggestion {
                label: "min".to_owned(),
                kind: 1,
                insert_text: "min(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Minimum value of all inputs".to_owned(),
            },
            CompletionItemSuggestion {
                label: "mul".to_owned(),
                kind: 1,
                insert_text: "mul(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Product of all inputs".to_owned(),
            },
            CompletionItemSuggestion {
                label: "percent_of".to_owned(),
                kind: 1,
                insert_text: "percent_of(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Percent y of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "pow".to_owned(),
                kind: 1,
                insert_text: "pow(${1:x}, ${2:y})".to_owned(),
                insert_text_rules: 4,
                documentation: "x to the power of y".to_owned(),
            },
            CompletionItemSuggestion {
                label: "root".to_owned(),
                kind: 1,
                insert_text: "root(${1:x}, ${2:N})".to_owned(),
                insert_text_rules: 4,
                documentation: "N-th root of x where N >= 0".to_owned(),
            },
            CompletionItemSuggestion {
                label: "round".to_owned(),
                kind: 1,
                insert_text: "round(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Round x to the nearest integer".to_owned(),
            },
            CompletionItemSuggestion {
                label: "sgn".to_owned(),
                kind: 1,
                insert_text: "sgn(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Sign of x: -1, 1, or 0".to_owned(),
            },
            CompletionItemSuggestion {
                label: "sqrt".to_owned(),
                kind: 1,
                insert_text: "sqrt(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Square root of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "sum".to_owned(),
                kind: 1,
                insert_text: "sum(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Sum of all inputs".to_owned(),
            },
            CompletionItemSuggestion {
                label: "trunc".to_owned(),
                kind: 1,
                insert_text: "trunc(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Integer portion of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "acos".to_owned(),
                kind: 1,
                insert_text: "acos(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Arc cosine of x in radians".to_owned(),
            },
            CompletionItemSuggestion {
                label: "acosh".to_owned(),
                kind: 1,
                insert_text: "acosh(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Inverse hyperbolic cosine of x in radians".to_owned(),
            },
            CompletionItemSuggestion {
                label: "asin".to_owned(),
                kind: 1,
                insert_text: "asin(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Arc sine of x in radians".to_owned(),
            },
            CompletionItemSuggestion {
                label: "asinh".to_owned(),
                kind: 1,
                insert_text: "asinh(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Inverse hyperbolic sine of x in radians".to_owned(),
            },
            CompletionItemSuggestion {
                label: "atan".to_owned(),
                kind: 1,
                insert_text: "atan(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Arc tangent of x in radians".to_owned(),
            },
            CompletionItemSuggestion {
                label: "atanh".to_owned(),
                kind: 1,
                insert_text: "atanh(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Inverse hyperbolic tangent of x in radians".to_owned(),
            },
            CompletionItemSuggestion {
                label: "cos".to_owned(),
                kind: 1,
                insert_text: "cos(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Cosine of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "cosh".to_owned(),
                kind: 1,
                insert_text: "cosh(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Hyperbolic cosine of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "cot".to_owned(),
                kind: 1,
                insert_text: "cot(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Cotangent of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "sin".to_owned(),
                kind: 1,
                insert_text: "sin(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Sine of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "sinc".to_owned(),
                kind: 1,
                insert_text: "sinc(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Sine cardinal of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "sinh".to_owned(),
                kind: 1,
                insert_text: "sinh(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Hyperbolic sine of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "tan".to_owned(),
                kind: 1,
                insert_text: "tan(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Tangent of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "tanh".to_owned(),
                kind: 1,
                insert_text: "tanh(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Hyperbolic tangent of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "deg2rad".to_owned(),
                kind: 1,
                insert_text: "deg2rad(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Convert x from degrees to radians".to_owned(),
            },
            CompletionItemSuggestion {
                label: "deg2grad".to_owned(),
                kind: 1,
                insert_text: "deg2grad(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Convert x from degrees to gradians".to_owned(),
            },
            CompletionItemSuggestion {
                label: "rad2deg".to_owned(),
                kind: 1,
                insert_text: "rad2deg(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Convert x from radians to degrees".to_owned(),
            },
            CompletionItemSuggestion {
                label: "grad2deg".to_owned(),
                kind: 1,
                insert_text: "grad2deg(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Convert x from gradians to degrees".to_owned(),
            },
            CompletionItemSuggestion {
                label: "concat".to_owned(),
                kind: 1,
                insert_text: "concat(${1:x}, ${2:y})".to_owned(),
                insert_text_rules: 4,
                documentation: "Concatenate string columns and string literals, such as:\nconcat(\"State\".to_owned(), ', ', \"City\")".to_owned(),
            },
            CompletionItemSuggestion {
                label: "order".to_owned(),
                kind: 1,
                insert_text: "order(${1:input column}, ${2:value}, ...)".to_owned(),
                insert_text_rules: 4,
                documentation: "Generates a sort order for a string column based on the input order of the parameters, such as:\norder(\"State\".to_owned(), 'Texas', 'New York')".to_owned(),
            },
            CompletionItemSuggestion {
                label: "upper".to_owned(),
                kind: 1,
                insert_text: "upper(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Uppercase of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "lower".to_owned(),
                kind: 1,
                insert_text: "lower(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Lowercase of x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "hour_of_day".to_owned(),
                kind: 1,
                insert_text: "hour_of_day(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Return a datetime's hour of the day as a string".to_owned(),
            },
            CompletionItemSuggestion {
                label: "month_of_year".to_owned(),
                kind: 1,
                insert_text: "month_of_year(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Return a datetime's month of the year as a string".to_owned(),
            },
            CompletionItemSuggestion {
                label: "day_of_week".to_owned(),
                kind: 1,
                insert_text: "day_of_week(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Return a datetime's day of week as a string".to_owned(),
            },
            CompletionItemSuggestion {
                label: "now".to_owned(),
                kind: 1,
                insert_text: "now()".to_owned(),
                insert_text_rules: 4,
                documentation: "The current datetime in local time".to_owned(),
            },
            CompletionItemSuggestion {
                label: "today".to_owned(),
                kind: 1,
                insert_text: "today()".to_owned(),
                insert_text_rules: 4,
                documentation: "The current date in local time".to_owned(),
            },
            CompletionItemSuggestion {
                label: "is_null".to_owned(),
                kind: 1,
                insert_text: "is_null(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Whether x is a null value".to_owned(),
            },
            CompletionItemSuggestion {
                label: "is_not_null".to_owned(),
                kind: 1,
                insert_text: "is_not_null(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Whether x is not a null value".to_owned(),
            },
            CompletionItemSuggestion {
                label: "not".to_owned(),
                kind: 1,
                insert_text: "not(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "not x".to_owned(),
            },
            CompletionItemSuggestion {
                label: "true".to_owned(),
                kind: 1,
                insert_text: "true".to_owned(),
                insert_text_rules: 4,
                documentation: "Boolean value true".to_owned(),
            },
            CompletionItemSuggestion {
                label: "false".to_owned(),
                kind: 1,
                insert_text: "false".to_owned(),
                insert_text_rules: 4,
                documentation: "Boolean value false".to_owned(),
            },
            CompletionItemSuggestion {
                label: "if".to_owned(),
                kind: 17,
                insert_text: "if (${1:condition}) {} else if (${2:condition}) {} else {}".to_owned(),
                insert_text_rules: 4,
                documentation: "An if/else conditional, which evaluates a condition such as:\n if (\"Sales\" > 100) { true } else { false }".to_owned(),
            },
            CompletionItemSuggestion {
                label: "for".to_owned(),
                kind: 17,
                insert_text: "for (${1:expression}) {}".to_owned(),
                insert_text_rules: 4,
                documentation: "A for loop, which repeatedly evaluates an incrementing expression such as:\nvar x := 0; var y := 1; for (x < 10; x += 1) { y := x + y }".to_owned(),
            },
            CompletionItemSuggestion {
                label: "string".to_owned(),
                kind: 1,
                insert_text: "string(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Converts the given argument to a string".to_owned(),
            },
            CompletionItemSuggestion {
                label: "integer".to_owned(),
                kind: 1,
                insert_text: "integer(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Converts the given argument to a 32-bit integer. If the result over/under-flows, null is returned".to_owned(),
            },
            CompletionItemSuggestion {
                label: "float".to_owned(),
                kind: 1,
                insert_text: "float(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Converts the argument to a float".to_owned(),
            },
            CompletionItemSuggestion {
                label: "date".to_owned(),
                kind: 1,
                insert_text: "date(${1:year}, ${1:month}, ${1:day})".to_owned(),
                insert_text_rules: 4,
                documentation: "Given a year, month (1-12) and day, create a new date".to_owned(),
            },
            CompletionItemSuggestion {
                label: "datetime".to_owned(),
                kind: 1,
                insert_text: "datetime(${1:timestamp})".to_owned(),
                insert_text_rules: 4,
                documentation: "Given a POSIX timestamp of milliseconds since epoch, create a new datetime".to_owned(),
            },
            CompletionItemSuggestion {
                label: "boolean".to_owned(),
                kind: 1,
                insert_text: "boolean(${1:x})".to_owned(),
                insert_text_rules: 4,
                documentation: "Converts the given argument to a boolean".to_owned(),
            },
            CompletionItemSuggestion {
                label: "match".to_owned(),
                kind: 1,
                insert_text: "match(${1:string}, ${2:pattern})".to_owned(),
                insert_text_rules: 4,
                documentation: "Returns True if any part of string matches pattern, and False otherwise.".to_owned(),
            },
            CompletionItemSuggestion {
                label: "fullmatch".to_owned(),
                kind: 1,
                insert_text: "fullmatch(${1:string}, ${2:pattern})".to_owned(),
                insert_text_rules: 4,
                documentation: "Returns True if the whole string matches pattern, and False otherwise.".to_owned(),
            },
            CompletionItemSuggestion {
                label: "search".to_owned(),
                kind: 1,
                insert_text: "search(${1:string}, ${2:pattern})".to_owned(),
                insert_text_rules: 4,
                documentation: "Returns the substring that matches the first capturing group in pattern, or null if there are no capturing groups in the pattern or if there are no matches.".to_owned(),
            },
        ]
    };
}
