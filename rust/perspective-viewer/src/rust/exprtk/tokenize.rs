/////////////////////////////////////////////////////////, kind: (), insert_text: (), insert_text_rules: (), documentation: () ///////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod comment;
mod number;
mod string;
mod symbol;

use nom::branch::alt;
use nom::bytes::complete::{is_a, is_not};
use nom::character::complete::{line_ending, space1};
use nom::combinator::map;
use nom::multi::many0;
use yew::prelude::*;

use self::comment::*;
use self::number::*;
use self::string::*;
use self::symbol::*;

/// Syntax-highlightable ExprTK tokens. We had the option of implemnting this
/// alternatively as `pub struct Token(TokenType, &'a str);`, but I felt this
/// was less ergonomic for the frequent pattern matching necessary when handling
/// enum tokens.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Token<'a> {
    Comment(&'a str),
    Whitespace(&'a str),
    Break(&'a str),
    Symbol(&'a str),
    Literal(&'a str),
    Operator(&'a str),
    Unknown(&'a str),
    Column(&'a str),
}

use Token::*;

#[allow(clippy::use_self)]
impl<'a> From<Token<'a>> for Html {
    fn from(x: Token<'a>) -> Self {
        html! {
            if matches!(x, Break(_)) {
                <br/>
            } else {
                <span class={ x.class_name() }>
                    { x.content() }
                </span>
            }
        }
    }
}

impl<'a> Token<'a> {
    const fn class_name(&self) -> &'static str {
        match self {
            Comment(_) => "comment",
            Whitespace(_) => "whitespace",
            Symbol(_) => "symbol",
            Operator(_) => "operator",
            Unknown(_) => "unknown",
            Break(_) => "break",
            Literal(_) => "literal",
            Column(_) => "column",
        }
    }

    /// Note the use of the lifetime `'a` - this function does not work
    /// correctly when it's signature is specified `-> &'_ str` instead, as
    /// `self` and the `str` may have different lifetimes.
    pub const fn content(&self) -> &'a str {
        match self {
            Comment(x) => x,
            Whitespace(x) => x,
            Symbol(x) => x,
            Operator(x) => x,
            Unknown(x) => x,
            Break(x) => x,
            Literal(x) => x,
            Column(x) => x,
        }
    }
}

/// Parse a string representing an ExprTK Expression Column into `Token`s. A
/// token list is sufficient for syntax-highlighting purposes, faster than a
/// full parser and much easier to write a renderer for.
pub fn tokenize(input: &str) -> Vec<Token<'_>> {
    let comment = map(parse_comment, Token::Comment);
    let string = map(parse_string_literal('"'), Token::Literal);
    let column = map(parse_string_literal('\''), Token::Column);
    let symbol = map(parse_symbol_literal, Token::Symbol);
    let number = map(parse_number_literal, Token::Literal);
    let whitespace = map(space1, Token::Whitespace);
    let linebreak = map(line_ending, Token::Break);
    let ops = map(is_a("+-/*^%&|=:;,.(){}[]"), Token::Operator);
    let unknown = map(is_not(" \t\n\r"), Token::Unknown);

    let mut expr = many0(alt((
        comment, string, column, symbol, number, whitespace, linebreak, ops, unknown,
    )));

    let (rest, mut tokens) = expr(input).unwrap_or_else(|_| (input, vec![]));
    if !rest.is_empty() {
        tracing::warn!(
            "Parser terminated at position {}: {}",
            input.len() - rest.len(),
            input
        );

        tokens.push(Token::Unknown(rest))
    }

    tokens
}

#[cfg(test)]
mod tests {
    use wasm_bindgen_test::*;

    use super::*;

    #[wasm_bindgen_test]
    fn test_simple() {
        let s = "123 abc 'hello' \"Sales\"";
        assert_eq!(tokenize(s), vec![
            Literal("123"),
            Whitespace(" "),
            Symbol("abc"),
            Whitespace(" "),
            Column("'hello'"),
            Whitespace(" "),
            Literal("\"Sales\"")
        ]);
    }

    #[wasm_bindgen_test]
    fn test_complex_string() {
        let s = "'this is 'a \"test of\" strings";
        assert_eq!(tokenize(s), vec![
            Column("'this is '"),
            Symbol("a"),
            Whitespace(" "),
            Literal("\"test of\""),
            Whitespace(" "),
            Symbol("strings"),
        ]);
    }

    #[wasm_bindgen_test]
    fn test_comment_newline() {
        let s = "// Title\n1 + 2";
        assert_eq!(tokenize(s), vec![
            Comment("// Title"),
            Break("\n"),
            Literal("1"),
            Whitespace(" "),
            Operator("+"),
            Whitespace(" "),
            Literal("2"),
        ]);
    }
}
