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

use serde::{Deserialize, Deserializer, Serialize, Serializer};
use strum::EnumIter;
use ts_rs::TS;

/// A date or time part's numeric form.
#[derive(Clone, Copy, Debug, Deserialize, EnumIter, Eq, PartialEq, Serialize, TS)]
pub enum DatetimeNumericPart {
    #[serde(rename = "numeric")]
    Numeric,

    #[serde(rename = "2-digit")]
    TwoDigit,
}

impl Display for DatetimeNumericPart {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            Self::Numeric => "numeric",
            Self::TwoDigit => "2-digit",
        })
    }
}

/// The month's numeric or named form.
#[derive(Clone, Copy, Debug, Deserialize, EnumIter, Eq, PartialEq, Serialize, TS)]
pub enum DatetimeMonthPart {
    #[serde(rename = "numeric")]
    Numeric,

    #[serde(rename = "2-digit")]
    TwoDigit,

    #[serde(rename = "long")]
    Long,

    #[serde(rename = "short")]
    Short,

    #[serde(rename = "narrow")]
    Narrow,
}

impl Display for DatetimeMonthPart {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            Self::Numeric => "numeric",
            Self::TwoDigit => "2-digit",
            Self::Long => "long",
            Self::Short => "short",
            Self::Narrow => "narrow",
        })
    }
}

/// The weekday's named form.
#[derive(Clone, Copy, Debug, Deserialize, EnumIter, Eq, PartialEq, Serialize, TS)]
pub enum DatetimeTextPart {
    #[serde(rename = "long")]
    Long,

    #[serde(rename = "short")]
    Short,

    #[serde(rename = "narrow")]
    Narrow,
}

impl Display for DatetimeTextPart {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            Self::Long => "long",
            Self::Short => "short",
            Self::Narrow => "narrow",
        })
    }
}

/// The number of sub-second digits shown, from 1 to 3.
#[derive(Clone, Copy, Debug, Eq, PartialEq, TS)]
#[ts(type = "1 | 2 | 3")]
pub struct FractionalSecondDigits(u8);

impl FractionalSecondDigits {
    /// The digit count, or `None` outside 1 to 3.
    pub fn new(digits: u8) -> Option<Self> {
        (1..=3).contains(&digits).then_some(Self(digits))
    }

    /// The digit count.
    pub fn get(self) -> u8 {
        self.0
    }
}

impl Serialize for FractionalSecondDigits {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_u8(self.0)
    }
}

impl<'de> Deserialize<'de> for FractionalSecondDigits {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let digits = u8::deserialize(deserializer)?;
        Self::new(digits).ok_or_else(|| {
            serde::de::Error::custom(format!(
                "`fractionalSecondDigits` must be 1, 2 or 3, not {digits}"
            ))
        })
    }
}
