////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use serde::Deserialize;
use std::fmt::Display;

#[derive(Deserialize, Clone, Copy, PartialEq, PartialOrd)]
pub enum Type {
    #[serde(rename = "string")]
    String,

    #[serde(rename = "datetime")]
    Datetime,

    #[serde(rename = "date")]
    Date,

    #[serde(rename = "integer")]
    Integer,

    #[serde(rename = "float")]
    Float,

    #[serde(rename = "boolean")]
    Bool,
}

impl Display for Type {
    fn fmt(
        &self,
        fmt: &mut std::fmt::Formatter<'_>,
    ) -> std::result::Result<(), std::fmt::Error> {
        write!(
            fmt,
            "{}",
            match self {
                Type::String => "string",
                Type::Integer => "integer",
                Type::Float => "float",
                Type::Bool => "boolean",
                Type::Date => "date",
                Type::Datetime => "datetime",
            }
        )
    }
}
