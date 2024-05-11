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

use super::simple_format::*;

const fn date_style_default() -> SimpleDatetimeFormat {
    SimpleDatetimeFormat::Short
}

const fn time_style_default() -> SimpleDatetimeFormat {
    SimpleDatetimeFormat::Medium
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize, TS)]
pub struct SimpleDatetimeStyleConfig {
    #[serde(default)]
    #[serde(rename = "timeZone", skip_serializing_if = "Option::is_none")]
    pub time_zone: Option<String>,

    #[serde(
        default = "date_style_default",
        rename = "dateStyle",
        skip_serializing_if = "SimpleDatetimeFormat::is_short"
    )]
    pub date_style: SimpleDatetimeFormat,

    #[serde(
        default = "time_style_default",
        rename = "timeStyle",
        skip_serializing_if = "SimpleDatetimeFormat::is_medium"
    )]
    pub time_style: SimpleDatetimeFormat,
}

impl Default for SimpleDatetimeStyleConfig {
    fn default() -> Self {
        Self {
            time_zone: None,
            date_style: SimpleDatetimeFormat::Short,
            time_style: SimpleDatetimeFormat::Medium,
        }
    }
}
