////////////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use nom::branch::alt;
use nom::bytes::complete::{is_not, take_while_m_n};
use nom::character::complete::{char, multispace1};
use nom::combinator::{map, map_opt, map_res, value, verify};
use nom::multi::fold_many0;
use nom::sequence::{delimited, preceded};
use nom::IResult;

fn parse_unicode(input: &str) -> IResult<&str, char> {
    let parse_hex = take_while_m_n(1, 6, |c: char| c.is_ascii_hexdigit());
    let parse_delimited_hex = preceded(char('u'), delimited(char('{'), parse_hex, char('}')));
    let parse_u32 = map_res(parse_delimited_hex, move |hex| u32::from_str_radix(hex, 16));
    map_opt(parse_u32, std::char::from_u32)(input)
}

fn parse_escaped_char(input: &str) -> IResult<&str, char> {
    preceded(
        char('\\'),
        alt((
            parse_unicode,
            value('\n', char('n')),
            value('\r', char('r')),
            value('\t', char('t')),
            value('\u{08}', char('b')),
            value('\u{0C}', char('f')),
            value('\\', char('\\')),
            value('/', char('/')),
            value('"', char('"')),
            value('\'', char('\'')),
        )),
    )(input)
}

fn parse_literal(input: &str) -> IResult<&str, &str> {
    let not_quote_slash = is_not("\'\"\\");
    verify(not_quote_slash, |s: &str| !s.is_empty())(input)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum StringFragment {
    Literal(usize),
    EscapedChar,
    EscapedWS,
}

impl StringFragment {
    const fn len(&self) -> usize {
        match self {
            Self::Literal(s) => *s,
            Self::EscapedChar => 2,
            Self::EscapedWS => 0,
        }
    }
}

fn parse_fragment(input: &str) -> IResult<&str, StringFragment> {
    alt((
        map(parse_literal, |x| StringFragment::Literal(x.len())),
        map(parse_escaped_char, |_| StringFragment::EscapedChar),
        value(StringFragment::EscapedWS, preceded(char('\\'), multispace1)),
    ))(input)
}

pub fn parse_string_literal(sep: char) -> impl for<'a> Fn(&'a str) -> IResult<&'a str, &'a str> {
    move |input| {
        let build_string = fold_many0(parse_fragment, || 2, |len, frag| frag.len() + len);
        let offset = delimited(char(sep), build_string, char(sep));
        map(offset, |x| &input[..x])(input)
    }
}
