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
use strum::EnumIter;

#[derive(Clone, Copy, Debug, Default, Deserialize, EnumIter, Eq, PartialEq, Serialize)]
pub enum SimpleDatetimeFormat {
    #[serde(rename = "full")]
    Full,

    #[serde(rename = "long")]
    Long,

    #[serde(rename = "medium")]
    Medium,

    #[default]
    #[serde(rename = "short")]
    Short,

    #[serde(rename = "disabled")]
    Disabled,
}

impl SimpleDatetimeFormat {
    pub fn is_short(&self) -> bool {
        self == &Self::Short
    }

    pub fn is_medium(&self) -> bool {
        self == &Self::Medium
    }

    pub const fn values() -> &'static [Self] {
        &[
            Self::Full,
            Self::Long,
            Self::Medium,
            Self::Short,
            Self::Disabled,
        ]
    }
}

impl Display for SimpleDatetimeFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Full => "full",
            Self::Long => "long",
            Self::Medium => "medium",
            Self::Short => "short",
            Self::Disabled => "disabled",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for SimpleDatetimeFormat {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "full" => Ok(Self::Full),
            "long" => Ok(Self::Long),
            "medium" => Ok(Self::Medium),
            "short" => Ok(Self::Short),
            "disabled" => Ok(Self::Disabled),
            x => Err(format!("Unknown DatetimeFormat::{}", x)),
        }
    }
}
