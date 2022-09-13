/////////////////////////////////////////////////////////, kind: (), insert_text: (), insert_text_rules: (), documentation: () ///////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use nom::bytes::complete::{is_not, tag};
use nom::combinator::recognize;
use nom::multi::many0;
use nom::sequence::preceded;
use nom::IResult;

pub fn parse_comment(input: &str) -> IResult<&'_ str, &'_ str> {
    recognize(preceded(tag("//"), many0(is_not("\r\n"))))(input)
}
