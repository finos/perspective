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

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::custom_format::CustomDatetimeFormat;

#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize, TS)]
pub enum FormatUnit {
    #[serde(rename = "custom")]
    #[default]
    FormatUnit,
}

const fn is_zero(x: &u32) -> bool {
    *x == 0
}

const fn is_true(x: &bool) -> bool {
    *x
}

const fn is_disabled(x: &CustomDatetimeFormat) -> bool {
    matches!(x, CustomDatetimeFormat::Disabled)
}

const fn is_numeric(x: &CustomDatetimeFormat) -> bool {
    matches!(x, CustomDatetimeFormat::Numeric)
}

const fn is_two_digit(x: &CustomDatetimeFormat) -> bool {
    matches!(x, CustomDatetimeFormat::TwoDigit)
}

const fn second_default() -> CustomDatetimeFormat {
    CustomDatetimeFormat::Numeric
}

const fn weekday_default() -> CustomDatetimeFormat {
    CustomDatetimeFormat::Disabled
}

const fn year_default() -> CustomDatetimeFormat {
    CustomDatetimeFormat::TwoDigit
}

const fn hour12_default() -> bool {
    true
}

const fn numeric_default() -> u32 {
    0
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize, TS)]
pub struct CustomDatetimeStyleConfig {
    format: FormatUnit,

    #[serde(default)]
    #[serde(rename = "timeZone", skip_serializing_if = "Option::is_none")]
    pub time_zone: Option<String>,

    #[serde(
        skip_serializing_if = "is_zero",
        rename = "fractionalSecondDigits",
        default = "numeric_default"
    )]
    pub fractional_seconds: u32,

    #[serde(skip_serializing_if = "is_numeric", default = "second_default")]
    pub second: CustomDatetimeFormat,

    #[serde(skip_serializing_if = "is_numeric", default = "second_default")]
    pub minute: CustomDatetimeFormat,

    #[serde(skip_serializing_if = "is_numeric", default = "second_default")]
    pub hour: CustomDatetimeFormat,

    #[serde(skip_serializing_if = "is_numeric", default = "second_default")]
    pub day: CustomDatetimeFormat,

    #[serde(skip_serializing_if = "is_disabled", default = "weekday_default")]
    pub weekday: CustomDatetimeFormat,

    #[serde(skip_serializing_if = "is_numeric", default = "second_default")]
    pub month: CustomDatetimeFormat,

    #[serde(skip_serializing_if = "is_two_digit", default = "year_default")]
    pub year: CustomDatetimeFormat,

    #[serde(skip_serializing_if = "is_true", default = "hour12_default")]
    pub hour12: bool,
}

impl Default for CustomDatetimeStyleConfig {
    fn default() -> Self {
        CustomDatetimeStyleConfig {
            format: FormatUnit::FormatUnit,
            fractional_seconds: 0,
            time_zone: None,
            second: CustomDatetimeFormat::Numeric,
            minute: CustomDatetimeFormat::Numeric,
            hour: CustomDatetimeFormat::Numeric,
            weekday: CustomDatetimeFormat::Disabled,
            day: CustomDatetimeFormat::Numeric,
            month: CustomDatetimeFormat::Numeric,
            year: CustomDatetimeFormat::TwoDigit,
            hour12: true,
        }
    }
}
