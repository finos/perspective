/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {Lexer, createToken} from "chevrotain";

export const vocabulary = {};

// Create tokens for column names and computed function names
const column_name_regex_pattern = /(["'])(?<column_name>[\s\d\w]*?[^\\])\1/y;

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
    pattern: /(AS|As|as)/
});

// Mathematical operators, in the format "x" + "y"

export const Add = createToken({
    name: "add",
    pattern: /\+/
});

export const Subtract = createToken({
    name: "subtract",
    pattern: /-/
});

export const Multiply = createToken({
    name: "multiply",
    pattern: /\*/
});

export const Divide = createToken({
    name: "divide",
    pattern: /\//
});

// Function operators, in the format func("x")
export const Sqrt = createToken({
    name: "sqrt",
    pattern: /sqrt/
});

export const Pow2 = createToken({
    name: "pow2",
    pattern: /pow2/
});

export const Abs = createToken({
    name: "abs",
    pattern: /abs/
});

export const Lowercase = createToken({
    name: "lowercase",
    pattern: /Lowercase/
});

export const Uppercase = createToken({
    name: "uppercase",
    pattern: /Uppercase/
});

export const ConcatComma = createToken({
    name: "concatComma",
    pattern: /concat_comma/
});

export const ConcatSpace = createToken({
    name: "concatSpace",
    pattern: /concat_space/
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
const tokens = [Whitespace, Comma, As, ColumnName, LeftParen, RightParen, Add, Subtract, Multiply, Divide, Sqrt, Pow2, Abs, Uppercase, Lowercase];

// Add each token to the vocabulary exported for the Parser
tokens.forEach(t => {
    vocabulary[t.name] = t;
});

const lexer = new Lexer(tokens);

export const lex = function(input) {
    const result = lexer.tokenize(input);

    if (result.errors.length > 0) {
        console.error(result.errors);
    }

    return result;
};
