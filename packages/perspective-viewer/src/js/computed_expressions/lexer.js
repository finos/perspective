/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {Lexer, createToken, tokenMatcher} from "chevrotain";
import {PerspectiveLexerErrorMessage} from "./error";

export const vocabulary = {};

/**
 * Create token types to categorize computations:
 * - OperatorTokenType: operators that require left and right-hand side operands
 * - FunctionTokenType: operators that have 1...n comma separated parameters.
 */
export const OperatorTokenType = createToken({
    name: "OperatorTokenType",
    pattern: Lexer.NA
});

export const FunctionTokenType = createToken({
    name: "FunctionTokenType",
    pattern: Lexer.NA
});

export const ColumnNameTokenType = createToken({
    name: "ColumnNameTokenType",
    pattern: Lexer.NA
});

export const UpperLowerCaseTokenType = createToken({
    name: "UpperLowerTokenType",
    pattern: /(uppercase|lowercase)/
});

// Create tokens for column names and computed function names
export const COLUMN_NAME_REGEX_PATTERN = /(["'])(.*?[^\\])\1/y;

/**
 * Given a string from which to extract a column name, extract the column name
 * in-between the quotation marks and set it as the `payload` property. In the
 * CST visitor, use `.payload` to access the true column name value.
 *
 * @param {String} string
 * @param {Number} start_offset
 */
const match_column_name = function(string, start_offset) {
    COLUMN_NAME_REGEX_PATTERN.lastIndex = start_offset;
    const result = COLUMN_NAME_REGEX_PATTERN.exec(string);

    if (result !== null && result.length === 3) {
        result.payload = result[2]; // 2nd capture group is in-between quotes
    }

    return result;
};

// Column names are always encased inside quotes.
export const ColumnName = createToken({
    name: "columnName",
    pattern: {exec: match_column_name},
    line_breaks: false,
    categories: [ColumnNameTokenType]
});

// Allow users to specify custom names using `AS`
export const As = createToken({
    name: "as",
    label: "Name new column as",
    pattern: /(AS|As|as)/,
    longer_alt: UpperLowerCaseTokenType
});

// Mathematical operators, in the format "x" + "y"

export const Add = createToken({
    name: "add",
    label: "+",
    pattern: /\+/,
    categories: [OperatorTokenType]
});

export const Subtract = createToken({
    name: "subtract",
    label: "-",
    pattern: /\-/,
    categories: [OperatorTokenType]
});

export const Multiply = createToken({
    name: "multiply",
    label: "*",
    pattern: /\*/,
    categories: [OperatorTokenType]
});

export const Divide = createToken({
    name: "divide",
    label: "/",
    pattern: /\//,
    categories: [OperatorTokenType]
});

export const Pow = createToken({
    name: "pow",
    label: "x ^ y",
    pattern: /\^/,
    categories: [OperatorTokenType]
});

export const PercentOf = createToken({
    name: "percent_of",
    label: "x % y",
    pattern: /\%/,
    categories: [OperatorTokenType]
});

export const Equals = createToken({
    name: "equals",
    label: "x == y",
    pattern: /\==/,
    categories: [OperatorTokenType]
});

export const NotEquals = createToken({
    name: "not_equals",
    label: "x != y",
    pattern: /\!=/,
    categories: [OperatorTokenType]
});

export const GreaterThan = createToken({
    name: "greater_than",
    label: "x > y",
    pattern: /\>/,
    categories: [OperatorTokenType]
});

export const LessThan = createToken({
    name: "less_than",
    label: "x < y",
    pattern: /\</,
    categories: [OperatorTokenType]
});

export const Is = createToken({
    name: "is",
    label: "x is y",
    pattern: /is/,
    categories: [OperatorTokenType]
});

// Function operators, in the format func("x")
export const Sqrt = createToken({
    name: "sqrt",
    label: "sqrt(x)",
    pattern: /sqrt/,
    categories: [FunctionTokenType]
});

export const Pow2 = createToken({
    name: "pow2",
    label: "x ^ 2",
    pattern: /pow2/,
    categories: [FunctionTokenType]
});

export const Abs = createToken({
    name: "abs",
    label: "abs(x)",
    pattern: /abs/,
    categories: [FunctionTokenType]
});

export const Invert = createToken({
    name: "invert",
    label: "1 / x",
    pattern: /invert/,
    categories: [FunctionTokenType]
});

export const Log = createToken({
    name: "log",
    label: "log(x)",
    pattern: /log/,
    categories: [FunctionTokenType]
});

export const Exp = createToken({
    name: "exp",
    label: "exp(x)",
    pattern: /exp/,
    categories: [FunctionTokenType]
});

// Bucketing functions

export const Bin10 = createToken({
    name: "bin10",
    label: "Bucket x by 10",
    pattern: /bin10/,
    categories: [FunctionTokenType]
});

export const Bin100 = createToken({
    name: "bin100",
    label: "Bucket x by 100",
    pattern: /bin100/,
    categories: [FunctionTokenType]
});

export const Bin1000 = createToken({
    name: "bin1000",
    label: "Bucket x by 1000",
    pattern: /bin1000/,
    categories: [FunctionTokenType]
});

export const Bin10th = createToken({
    name: "bin10th",
    label: "Bucket x by 1/10",
    pattern: /bin10th/,
    categories: [FunctionTokenType]
});

export const Bin100th = createToken({
    name: "bin100th",
    label: "Bucket x by 1/100",
    pattern: /bin100th/,
    categories: [FunctionTokenType]
});

export const Bin1000th = createToken({
    name: "bin1000th",
    label: "Bucket x by 1/1000",
    pattern: /bin1000th/,
    categories: [FunctionTokenType]
});

// String functions

export const Length = createToken({
    name: "length",
    label: "length(x)",
    pattern: /length/,
    categories: [FunctionTokenType]
});

export const Lowercase = createToken({
    name: "lowercase",
    label: "lowercase(x)",
    pattern: /lowercase/,
    categories: [FunctionTokenType]
});

export const Uppercase = createToken({
    name: "uppercase",
    label: "uppercase(x)",
    pattern: /uppercase/,
    categories: [FunctionTokenType]
});

export const ConcatComma = createToken({
    name: "concat_comma",
    label: "Concat(x, y) with comma",
    pattern: /concat_comma/,
    categories: [FunctionTokenType]
});

export const ConcatSpace = createToken({
    name: "concat_space",
    label: "Concat(x, y) with space",
    pattern: /concat_space/,
    categories: [FunctionTokenType]
});

// Date functions

export const HourOfDay = createToken({
    name: "hour_of_day",
    label: "Hour of day",
    pattern: /hour_of_day/,
    categories: [FunctionTokenType]
});

export const DayOfWeek = createToken({
    name: "day_of_week",
    label: "Day of week",
    pattern: /day_of_week/,
    categories: [FunctionTokenType]
});

export const MonthOfYear = createToken({
    name: "month_of_year",
    label: "Month of year",
    pattern: /month_of_year/,
    categories: [FunctionTokenType]
});

export const SecondBucket = createToken({
    name: "second_bucket",
    label: "Bucket(x) by seconds",
    pattern: /second_bucket/,
    categories: [FunctionTokenType]
});

export const MinuteBucket = createToken({
    name: "minute_bucket",
    label: "Bucket(x) by minutes",
    pattern: /minute_bucket/,
    categories: [FunctionTokenType]
});

export const HourBucket = createToken({
    name: "hour_bucket",
    label: "Bucket(x) by hours",
    pattern: /hour_bucket/,
    categories: [FunctionTokenType]
});

export const DayBucket = createToken({
    name: "day_bucket",
    pattern: /day_bucket/,
    label: "Bucket(x) by day",
    categories: [FunctionTokenType]
});

export const WeekBucket = createToken({
    name: "week_bucket",
    pattern: /week_bucket/,
    label: "Bucket(x) by week",
    categories: [FunctionTokenType]
});

export const MonthBucket = createToken({
    name: "month_bucket",
    pattern: /month_bucket/,
    label: "Bucket(x) by month",
    categories: [FunctionTokenType]
});

export const YearBucket = createToken({
    name: "year_bucket",
    pattern: /year_bucket/,
    label: "Bucket(x) by year",
    categories: [FunctionTokenType]
});

// Parenthesis
export const LeftParen = createToken({
    name: "leftParen",
    label: "(",
    pattern: /\(/
});

export const RightParen = createToken({
    name: "rightParen",
    label: ")",
    pattern: /\)/
});

// Comma
export const Comma = createToken({
    name: "comma",
    label: ",",
    pattern: /,/
});

// Whitespace
export const Whitespace = createToken({
    name: "whitespace",
    pattern: /\s+/
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
    Pow,
    PercentOf,
    Equals,
    NotEquals,
    GreaterThan,
    LessThan,
    Sqrt,
    Pow2,
    Abs,
    Invert,
    Log,
    Exp,
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

export const function_tokens = [];
export const operator_tokens = [];

// Add each token to the vocabulary exported for the Parser
tokens.forEach(t => {
    vocabulary[t.name] = t;
    let raw = t.PATTERN.source;
    if (raw) {
        if (raw.indexOf("\\") == 0) {
            raw = raw.substring(1);
        }
    }

    if (tokenMatcher(t, FunctionTokenType)) {
        function_tokens.push(raw);
    } else if (tokenMatcher(t, OperatorTokenType)) {
        operator_tokens.push(raw);
    }
});

export const ComputedExpressionColumnLexer = new Lexer(tokens, {
    errorMessageProvider: PerspectiveLexerErrorMessage
});

/**
 * Return a list of tokens with whitespace tokens removed, as the parser and
 * visitor do not support whitespace tokens (but they are needed for the
 * expression editor to function correctly).
 *
 * @param {Array{IToken}} tokens
 */
export const clean_tokens = function(tokens) {
    const cleaned_tokens = [];

    for (const token of tokens) {
        if (!tokenMatcher(token, Whitespace)) {
            cleaned_tokens.push(token);
        }
    }

    return cleaned_tokens;
};
