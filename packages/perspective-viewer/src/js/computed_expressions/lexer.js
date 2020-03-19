/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {Lexer, createToken} from "chevrotain";
import {PerspectiveLexerErrorMessage} from "./error";

export const vocabulary = {};

/**
 * Create token types to categorize computations:
 * - OperatorTokenType: operators that require left and right-hand side operands
 * - FunctionTokenType: operators that have 1...n comma separated parameters.
 */
const OperatorTokenType = createToken({
    name: "OperatorTokenType",
    pattern: Lexer.NA
});

const FunctionTokenType = createToken({
    name: "FunctionTokenType",
    pattern: Lexer.NA
});

const UpperLowerCaseTokenType = createToken({
    name: "UpperLowerTokenType",
    pattern: /(uppercase|lowercase)/
});

// Create tokens for column names and computed function names
const column_name_regex_pattern = /(["'])(?<column_name>.*?[^\\])\1/y;

/**
 * Given a string from which to extract a column name, extract the column name
 * in-between the quotation marks and set it as the `payload` property. In the
 * CST visitor, use `.payload` to access the true column name value.
 *
 * @param {String} string
 * @param {Number} start_offset
 */
const match_column_name = function(string, start_offset) {
    column_name_regex_pattern.lastIndex = start_offset;
    const result = column_name_regex_pattern.exec(string);

    if (result !== null) {
        const full_match = result[0];
        const quotes_removed = full_match.substr(1, full_match.length - 2);
        result.payload = quotes_removed;
    }

    return result;
};

// Column names are always encased inside quotes.
export const ColumnName = createToken({
    name: "columnName",
    pattern: {exec: match_column_name},
    line_breaks: false
});

// Allow users to specify custom names using `AS`
export const As = createToken({
    name: "as",
    pattern: /(AS|As|as)/,
    longer_alt: UpperLowerCaseTokenType
});

// Mathematical operators, in the format "x" + "y"

export const Add = createToken({
    name: "add",
    pattern: /\+/,
    categories: [OperatorTokenType]
});

export const Subtract = createToken({
    name: "subtract",
    pattern: /-/,
    categories: [OperatorTokenType]
});

export const Multiply = createToken({
    name: "multiply",
    pattern: /\*/,
    categories: [OperatorTokenType]
});

export const Divide = createToken({
    name: "divide",
    pattern: /\//,
    categories: [OperatorTokenType]
});

export const PercentOf = createToken({
    name: "percent_of",
    pattern: /\%/,
    categories: [OperatorTokenType]
});

export const Equals = createToken({
    name: "equals",
    pattern: /\==/,
    categories: [OperatorTokenType]
});

export const NotEquals = createToken({
    name: "not_equals",
    pattern: /\!=/,
    categories: [OperatorTokenType]
});

export const GreaterThan = createToken({
    name: "greater_than",
    pattern: /\>/,
    categories: [OperatorTokenType]
});

export const LessThan = createToken({
    name: "less_than",
    pattern: /\</,
    categories: [OperatorTokenType]
});

export const Is = createToken({
    name: "is",
    pattern: /\is/,
    categories: [OperatorTokenType]
});

// Function operators, in the format func("x")
export const Sqrt = createToken({
    name: "sqrt",
    pattern: /sqrt/,
    categories: [FunctionTokenType]
});

export const Pow2 = createToken({
    name: "pow2",
    pattern: /pow2/,
    categories: [FunctionTokenType]
});

export const Abs = createToken({
    name: "abs",
    pattern: /abs/,
    categories: [FunctionTokenType]
});

export const Invert = createToken({
    name: "invert",
    pattern: /invert/,
    categories: [FunctionTokenType]
});

// Bucketing functions

export const Bin10 = createToken({
    name: "bin10",
    pattern: /bin10/,
    categories: [FunctionTokenType]
});

export const Bin100 = createToken({
    name: "bin100",
    pattern: /bin100/,
    categories: [FunctionTokenType]
});

export const Bin1000 = createToken({
    name: "bin1000",
    pattern: /bin1000/,
    categories: [FunctionTokenType]
});

export const Bin10th = createToken({
    name: "bin10th",
    pattern: /bin10th/,
    categories: [FunctionTokenType]
});

export const Bin100th = createToken({
    name: "bin100th",
    pattern: /bin100th/,
    categories: [FunctionTokenType]
});

export const Bin1000th = createToken({
    name: "bin1000th",
    pattern: /bin1000th/,
    categories: [FunctionTokenType]
});

// String functions

export const Length = createToken({
    name: "length",
    pattern: /length/,
    categories: [FunctionTokenType]
});

export const Lowercase = createToken({
    name: "lowercase",
    pattern: /lowercase/,
    categories: [FunctionTokenType]
});

export const Uppercase = createToken({
    name: "uppercase",
    pattern: /uppercase/,
    categories: [FunctionTokenType]
});

export const ConcatComma = createToken({
    name: "concat_comma",
    pattern: /concat_comma/,
    categories: [FunctionTokenType]
});

export const ConcatSpace = createToken({
    name: "concat_space",
    pattern: /concat_space/,
    categories: [FunctionTokenType]
});

// Date functions

export const HourOfDay = createToken({
    name: "hour_of_day",
    pattern: /hour_of_day/,
    categories: [FunctionTokenType]
});

export const DayOfWeek = createToken({
    name: "day_of_week",
    pattern: /day_of_week/,
    categories: [FunctionTokenType]
});

export const MonthOfYear = createToken({
    name: "month_of_year",
    pattern: /month_of_year/,
    categories: [FunctionTokenType]
});

export const SecondBucket = createToken({
    name: "second_bucket",
    pattern: /second_bucket/,
    categories: [FunctionTokenType]
});

export const MinuteBucket = createToken({
    name: "minute_bucket",
    pattern: /minute_bucket/,
    categories: [FunctionTokenType]
});

export const HourBucket = createToken({
    name: "hour_bucket",
    pattern: /hour_bucket/
});

export const DayBucket = createToken({
    name: "day_bucket",
    pattern: /day_bucket/,
    categories: [FunctionTokenType]
});

export const WeekBucket = createToken({
    name: "week_bucket",
    pattern: /week_bucket/,
    categories: [FunctionTokenType]
});

export const MonthBucket = createToken({
    name: "month_bucket",
    pattern: /month_bucket/,
    categories: [FunctionTokenType]
});

export const YearBucket = createToken({
    name: "year_bucket",
    pattern: /year_bucket/,
    categories: [FunctionTokenType]
});

// Parenthesis
export const LeftParen = createToken({
    name: "leftParen",
    pattern: /\(/
});

export const RightParen = createToken({
    name: "rightParen",
    pattern: /\)/
});

// Comma
export const Comma = createToken({
    name: "comma",
    pattern: /,/
});

// Whitespace
export const Whitespace = createToken({
    name: "whitespace",
    pattern: /\s+/,
    group: Lexer.SKIPPED
});

// Order of tokens is important
const tokens = [
    Whitespace,
    Comma,
    As,
    ColumnName,
    LeftParen,
    RightParen,
    Add,
    Subtract,
    Multiply,
    Divide,
    PercentOf,
    Equals,
    NotEquals,
    GreaterThan,
    LessThan,
    Sqrt,
    Pow2,
    Abs,
    Invert,
    Bin1000th,
    Bin1000,
    Bin100th,
    Bin100,
    Bin10th,
    Bin10,
    Length,
    Is,
    ConcatComma,
    ConcatSpace,
    Uppercase,
    Lowercase,
    HourOfDay,
    DayOfWeek,
    MonthOfYear,
    SecondBucket,
    MinuteBucket,
    HourBucket,
    DayBucket,
    WeekBucket,
    MonthBucket,
    YearBucket,
    UpperLowerCaseTokenType
];

// Add each token to the vocabulary exported for the Parser
tokens.forEach(t => {
    vocabulary[t.name] = t;
});

const lexer = new Lexer(tokens, {
    errorMessageProvider: PerspectiveLexerErrorMessage
});

export const lex = function(input) {
    const result = lexer.tokenize(input);

    if (result.errors.length > 0) {
        let message = result.errors.map(e => e.message);
        throw new Error(`${message.join("\n")}`);
    }

    return result;
};
