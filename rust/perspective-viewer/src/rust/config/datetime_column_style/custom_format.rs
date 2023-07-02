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

use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum CustomDatetimeFormat {
    #[serde(rename = "long")]
    Long,

    #[serde(rename = "short")]
    Short,

    #[serde(rename = "narrow")]
    Narrow,

    #[serde(rename = "numeric")]
    Numeric,

    #[serde(rename = "2-digit")]
    TwoDigit,

    #[serde(rename = "disabled")]
    Disabled,
}

impl CustomDatetimeFormat {
    pub const fn values() -> &'static [Self] {
        &[
            Self::Long,
            Self::Short,
            Self::Narrow,
            Self::Numeric,
            Self::TwoDigit,
            Self::Disabled,
        ]
    }

    pub fn values_1() -> &'static [Self] {
        &[Self::Numeric, Self::TwoDigit, Self::Disabled]
    }

    pub fn values_2() -> &'static [Self] {
        &[Self::Long, Self::Narrow, Self::Short, Self::Disabled]
    }
}

impl Display for CustomDatetimeFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Long => "long",
            Self::Short => "short",
            Self::Narrow => "narrow",
            Self::Numeric => "numeric",
            Self::TwoDigit => "2-digit",
            Self::Disabled => "disabled",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for CustomDatetimeFormat {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "long" => Ok(Self::Long),
            "short" => Ok(Self::Short),
            "narrow" => Ok(Self::Narrow),
            "numeric" => Ok(Self::Numeric),
            "2-digit" => Ok(Self::TwoDigit),
            "disabled" => Ok(Self::Disabled),
            x => Err(format!("Unknown DatetimeFormat::{}", x)),
        }
    }
}
