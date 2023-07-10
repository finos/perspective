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
pub enum NumberForegroundMode {
    #[serde(rename = "disabled")]
    Disabled,

    #[default]
    #[serde(rename = "color")]
    Color,

    #[serde(rename = "bar")]
    Bar,
}

/// `Display` and `FromStr` are only used for rendering these types as HTML
/// attributes, where `disabled` will never be rendered as it represents the
/// options being unavailable.
impl Display for NumberForegroundMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Color => Ok("color"),
            Self::Bar => Ok("bar"),
            _ => Err(std::fmt::Error),
        }?;

        write!(f, "{}", text)
    }
}

impl FromStr for NumberForegroundMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "color" => Ok(Self::Color),
            "bar" => Ok(Self::Bar),
            x => Err(format!("Unknown NumberForegroundMode::{}", x)),
        }
    }
}

impl NumberForegroundMode {
    fn is_color(&self) -> bool {
        *self == Self::Color
    }

    pub fn is_enabled(&self) -> bool {
        *self != Self::Disabled
    }

    pub fn needs_gradient(&self) -> bool {
        *self == Self::Bar
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub enum NumberBackgroundMode {
    #[default]
    #[serde(rename = "disabled")]
    Disabled,

    #[serde(rename = "color")]
    Color,

    #[serde(rename = "gradient")]
    Gradient,

    #[serde(rename = "pulse")]
    Pulse,
}

impl Display for NumberBackgroundMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Color => Ok("color"),
            Self::Gradient => Ok("gradient"),
            Self::Pulse => Ok("pulse"),
            _ => Err(std::fmt::Error),
        }?;

        write!(f, "{}", text)
    }
}

impl FromStr for NumberBackgroundMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "color" => Ok(Self::Color),
            "gradient" => Ok(Self::Gradient),
            "pulse" => Ok(Self::Pulse),
            x => Err(format!("Unknown NumberBackgroundMode::{}", x)),
        }
    }
}

impl NumberBackgroundMode {
    pub fn is_disabled(&self) -> bool {
        *self == Self::Disabled
    }

    pub fn needs_gradient(&self) -> bool {
        *self == Self::Gradient
    }
}

#[cfg_attr(test, derive(Debug))]
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct NumberColumnStyleConfig {
    #[serde(default = "NumberForegroundMode::default")]
    #[serde(skip_serializing_if = "NumberForegroundMode::is_color")]
    pub number_fg_mode: NumberForegroundMode,

    #[serde(default = "NumberBackgroundMode::default")]
    #[serde(skip_serializing_if = "NumberBackgroundMode::is_disabled")]
    pub number_bg_mode: NumberBackgroundMode,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub fixed: Option<u32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub pos_fg_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub neg_fg_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub pos_bg_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub neg_bg_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub fg_gradient: Option<f64>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub bg_gradient: Option<f64>,
}

derive_wasm_abi!(NumberColumnStyleConfig, FromWasmAbi, IntoWasmAbi);

/// Exactly like a `ColumnStyleConfig`, except without `Option<>` fields, as
/// this struct represents the default values we should use in the GUI when they
/// are `None` in the real config.  It is also used to decide when to omit a
/// field when serialized a `ColumnStyleConfig` to JSON.
#[derive(Deserialize, Clone, Default, Debug)]
pub struct NumberColumnStyleDefaultConfig {
    pub fg_gradient: f64,
    pub bg_gradient: f64,
    pub fixed: u32,
    pub pos_fg_color: String,
    pub neg_fg_color: String,
    pub pos_bg_color: String,
    pub neg_bg_color: String,
    pub number_fg_mode: NumberForegroundMode,
    pub number_bg_mode: NumberBackgroundMode,
}

derive_wasm_abi!(NumberColumnStyleDefaultConfig, FromWasmAbi);
