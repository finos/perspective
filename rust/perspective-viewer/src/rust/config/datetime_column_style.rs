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

mod color_mode;
mod custom;
mod custom_format;
mod simple;
mod simple_format;

pub use color_mode::*;
pub use custom::*;
pub use custom_format::*;
use serde::{Deserialize, Serialize};
pub use simple::*;
pub use simple_format::*;

use crate::*;

/// `Simple` case has all default-able keys and must be last!
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(untagged)]
pub enum DatetimeFormatType {
    Custom(CustomDatetimeStyleConfig),
    Simple(SimpleDatetimeStyleConfig),
}


/// A model for the JSON serialized style configuration for a column of type
/// `datetime`.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct DatetimeColumnStyleConfig {
    #[serde(flatten)]
    pub _format: DatetimeFormatType,

    #[serde(rename = "timeZone", skip_serializing_if = "Option::is_none")]
    pub time_zone: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub datetime_color_mode: Option<DatetimeColorMode>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

impl Default for DatetimeColumnStyleConfig {
    fn default() -> Self {
        Self {
            _format: DatetimeFormatType::Simple(SimpleDatetimeStyleConfig {
                date_style: SimpleDatetimeFormat::Short,
                time_style: SimpleDatetimeFormat::Medium,
            }),
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
