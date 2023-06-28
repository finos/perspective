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

use crate::*;

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub enum DatetimeColorMode {
    #[default]
    #[serde(rename = "foreground")]
    Foreground,

    #[serde(rename = "background")]
    Background,
}

impl Display for DatetimeColorMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Foreground => "foreground",
            Self::Background => "background",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for DatetimeColorMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "foreground" => Ok(Self::Foreground),
            "background" => Ok(Self::Background),
            x => Err(format!("Unknown DatetimeColorMode::{}", x)),
        }
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum DatetimeFormat {
    #[serde(rename = "full")]
    Full,

    #[serde(rename = "long")]
    Long,

    #[serde(rename = "medium")]
    Medium,

    #[serde(rename = "short")]
    Short,

    #[serde(rename = "disabled")]
    Disabled,
}

impl DatetimeFormat {
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

impl Display for DatetimeFormat {
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

impl FromStr for DatetimeFormat {
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

const fn date_style_default() -> DatetimeFormat {
    DatetimeFormat::Short
}

const fn time_style_default() -> DatetimeFormat {
    DatetimeFormat::Medium
}

#[cfg_attr(test, derive(Debug))]
#[derive(Clone, Deserialize, Eq, PartialEq, Serialize)]
pub struct DatetimeColumnStyleConfig {
    #[serde(rename = "timeZone", skip_serializing_if = "Option::is_none")]
    pub time_zone: Option<String>,

    #[serde(
        default = "date_style_default",
        rename = "dateStyle",
        skip_serializing_if = "DatetimeFormat::is_short"
    )]
    pub date_style: DatetimeFormat,

    #[serde(
        default = "time_style_default",
        rename = "timeStyle",
        skip_serializing_if = "DatetimeFormat::is_medium"
    )]
    pub time_style: DatetimeFormat,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub datetime_color_mode: Option<DatetimeColorMode>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

impl Default for DatetimeColumnStyleConfig {
    fn default() -> Self {
        Self {
            date_style: DatetimeFormat::Short,
            time_style: DatetimeFormat::Medium,
            time_zone: Default::default(),
            datetime_color_mode: Default::default(),
            color: Default::default(),
        }
    }
}

derive_wasm_abi!(DatetimeColumnStyleConfig, FromWasmAbi, IntoWasmAbi);

#[derive(Clone, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct DatetimeColumnStyleDefaultConfig {
    pub color: String,
}

derive_wasm_abi!(DatetimeColumnStyleDefaultConfig, FromWasmAbi);
