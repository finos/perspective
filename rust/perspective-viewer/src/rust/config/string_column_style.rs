////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::fmt::Display;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum StringColorMode {
    #[serde(rename = "foreground")]
    Foreground,

    #[serde(rename = "background")]
    Background,

    #[serde(rename = "series")]
    Series,
}

impl Default for StringColorMode {
    fn default() -> Self {
        StringColorMode::Foreground
    }
}

impl Display for StringColorMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            StringColorMode::Foreground => "foreground",
            StringColorMode::Background => "background",
            StringColorMode::Series => "series",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for StringColorMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "foreground" => Ok(StringColorMode::Foreground),
            "background" => Ok(StringColorMode::Background),
            "series" => Ok(StringColorMode::Series),
            x => Err(format!("Unknown StringColorMode::{}", x)),
        }
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum FormatMode {
    #[serde(rename = "link")]
    Link,

    #[serde(rename = "image")]
    Image,

    #[serde(rename = "bold")]
    Bold,

    #[serde(rename = "italics")]
    Italics,
}

impl Default for FormatMode {
    fn default() -> Self {
        FormatMode::Bold
    }
}

impl Display for FormatMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            FormatMode::Link => "link",
            FormatMode::Image => "image",
            FormatMode::Bold => "bold",
            FormatMode::Italics => "italics",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for FormatMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "link" => Ok(FormatMode::Link),
            "image" => Ok(FormatMode::Image),
            "bold" => Ok(FormatMode::Bold),
            "italics" => Ok(FormatMode::Italics),
            x => Err(format!("Unknown format mode {}", x)),
        }
    }
}

#[cfg_attr(test, derive(Debug))]
#[derive(Clone, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct StringColumnStyleConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<FormatMode>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub string_color_mode: Option<StringColorMode>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

#[derive(Clone, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct StringColumnStyleDefaultConfig {
    pub color: String,
}
