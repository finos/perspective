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

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub enum StringColorMode {
    #[serde(rename = "foreground")]
    Foreground,

    #[default]
    #[serde(rename = "background")]
    Background,

    #[serde(rename = "series")]
    Series,
}

impl Display for StringColorMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Foreground => "foreground",
            Self::Background => "background",
            Self::Series => "series",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for StringColorMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "foreground" => Ok(Self::Foreground),
            "background" => Ok(Self::Background),
            "series" => Ok(Self::Series),
            x => Err(format!("Unknown StringColorMode::{}", x)),
        }
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub enum FormatMode {
    #[serde(rename = "link")]
    Link,

    #[serde(rename = "image")]
    Image,

    #[default]
    #[serde(rename = "bold")]
    Bold,

    #[serde(rename = "italics")]
    Italics,
}

impl Display for FormatMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Link => "link",
            Self::Image => "image",
            Self::Bold => "bold",
            Self::Italics => "italics",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for FormatMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "link" => Ok(Self::Link),
            "image" => Ok(Self::Image),
            "bold" => Ok(Self::Bold),
            "italics" => Ok(Self::Italics),
            x => Err(format!("Unknown format mode {}", x)),
        }
    }
}

#[derive(Debug, Clone, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct StringColumnStyleConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(default)]
    pub format: Option<FormatMode>,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(default)]
    pub string_color_mode: Option<StringColorMode>,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(default)]
    pub color: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct StringColumnStyleDefaultConfig {
    pub color: String,
}
