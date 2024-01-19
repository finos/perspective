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

use std::collections::HashMap;

use serde::{Deserialize, Serialize};

/// This struct describes global column style configurations.
/// Global column configurations are column configurations that apply to the
/// column regardless of which plugin it is instantiated in. These styles stick
/// with the column regardless of its active state.
/// ```
/// viewer_config: {column_config: {column_name: {type: properties}}}
///                                               ^^^^^^^^^^^^^^^^   
/// ```
#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
#[serde(untagged)]
pub enum ColumnConfig {
    Float(FloatColumnConfig),
    Int(IntColumnConfig),
    Bool(BoolColumnConfig),
    String(StringColumnConfig),
    Date(DateColumnConfig),
    Datetime(DatetimeColumnConfig),
}
impl ColumnConfig {
    // If types match, update the values.
    // Otherwise, just use the updated value.
    pub fn update(self, other: ColumnConfigValueUpdate) -> Self {
        match (self, other.0) {
            (Self::Float(this), Self::Float(other)) => Self::Float(this.update(other)),
            (Self::Int(this), Self::Int(other)) => Self::Int(this.update(other)),
            (Self::Bool(this), Self::Bool(other)) => Self::Bool(this.update(other)),
            (Self::String(this), Self::String(other)) => Self::String(this.update(other)),
            (Self::Date(this), Self::Date(other)) => Self::Date(this.update(other)),
            (Self::Datetime(this), Self::Datetime(other)) => Self::Datetime(this.update(other)),
            (_, other) => other,
        }
    }
}
pub struct ColumnConfigValueUpdate(pub ColumnConfig);
pub type ColumnConfigMap = HashMap<String, ColumnConfig>;

pub trait ColumnConfigTrait {
    fn update(self, other: Self) -> Self;
}

// More complex options can be encapsulated in structs and shared
// across configs. These should probably get their own mod.
// #[derive(Serialize, Deserialize)]
// pub struct FontConfig {
//     pub font: Option<String>,
//     pub font_size: Option<String>,
//     pub bold: Option<bool>,
//     pub italic: Option<bool>,
//     pub underline: Option<bool>,
//     pub color: Option<ColorConfig>,
// }

#[derive(Serialize, Deserialize, PartialEq, Default, Clone, Debug)]
pub struct FloatColumnConfig {
    #[serde(rename = "numeric-precision")]
    pub precision: Option<u32>,
}
impl ColumnConfigTrait for FloatColumnConfig {
    fn update(self, other: FloatColumnConfig) -> Self {
        Self {
            precision: other.precision.or(self.precision),
        }
    }
}

#[derive(Serialize, Deserialize, PartialEq, Default, Clone, Debug)]
pub struct IntColumnConfig {
    #[serde(rename = "numeric-precision")]
    pub precision: Option<u32>,
}
impl ColumnConfigTrait for IntColumnConfig {
    fn update(self, other: IntColumnConfig) -> Self {
        Self {
            precision: other.precision.or(self.precision),
        }
    }
}

#[derive(Serialize, Deserialize, PartialEq, Default, Clone, Debug)]
pub struct BoolColumnConfig {}
impl ColumnConfigTrait for BoolColumnConfig {
    fn update(self, _other: Self) -> Self {
        Self {}
    }
}

#[derive(Serialize, Deserialize, PartialEq, Default, Clone, Debug)]
pub struct StringColumnConfig {
    // #[serde(flatten)]
    // pub font_config: FontConfig
}
impl ColumnConfigTrait for StringColumnConfig {
    fn update(self, _other: Self) -> Self {
        Self {}
    }
}

#[derive(Serialize, Deserialize, PartialEq, Default, Clone, Debug)]
pub struct DateColumnConfig {}
impl ColumnConfigTrait for DateColumnConfig {
    fn update(self, _other: Self) -> Self {
        Self {}
    }
}

#[derive(Serialize, Deserialize, PartialEq, Default, Clone, Debug)]
pub struct DatetimeColumnConfig {}
impl ColumnConfigTrait for DatetimeColumnConfig {
    fn update(self, _other: Self) -> Self {
        Self {}
    }
}
