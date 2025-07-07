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

use std::fmt::Display;
use std::str::FromStr;

use crate::proto::ColumnType;
use crate::ClientError;

impl Display for ColumnType {
    fn fmt(&self, fmt: &mut std::fmt::Formatter<'_>) -> std::result::Result<(), std::fmt::Error> {
        write!(fmt, "{}", match self {
            Self::String => "string",
            Self::Integer => "integer",
            Self::Float => "float",
            Self::Boolean => "boolean",
            Self::Date => "date",
            Self::Datetime => "datetime",
        })
    }
}

impl FromStr for ColumnType {
    type Err = ClientError;

    fn from_str(val: &str) -> Result<Self, Self::Err> {
        val.try_into()
    }
}

impl TryFrom<&str> for ColumnType {
    type Error = ClientError;

    fn try_from(val: &str) -> Result<Self, Self::Error> {
        if val == "string" {
            Ok(Self::String)
        } else if val == "integer" {
            Ok(Self::Integer)
        } else if val == "float" {
            Ok(Self::Float)
        } else if val == "boolean" {
            Ok(Self::Boolean)
        } else if val == "date" {
            Ok(Self::Date)
        } else if val == "datetime" {
            Ok(Self::Datetime)
        } else {
            Err(ClientError::Internal(format!("Unknown type {val}")))
        }
    }
}

impl ColumnType {
    pub fn to_capitalized(&self) -> String {
        match self {
            ColumnType::String => "String",
            ColumnType::Datetime => "Datetime",
            ColumnType::Date => "Date",
            ColumnType::Integer => "Integer",
            ColumnType::Float => "Float",
            ColumnType::Boolean => "Boolean",
        }
        .into()
    }
}
