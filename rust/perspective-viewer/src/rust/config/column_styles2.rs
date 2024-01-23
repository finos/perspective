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

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use super::Type;

//////////////// Value
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(untagged)]
pub enum ColumnStyleValue {
    NumericPrecision(u32),
    Color(String),
    Radio(String),
    Dropdown(String),
    DatetimeStringFormat(DatetimeValue),
    KeyValuePair(String),
}
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct DatetimeValue {
    // todo
}

/// Maps view_type to control labels to control values. Expressed in typescript:
/// ```ts
/// type viewer_config = {column_config: {[ty: psp.Type]: {[control_label: string]: value}}}
///                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
/// ```
pub type ColumnStyleMap = HashMap<Type, HashMap<String, ColumnStyleValue>>;

/////////////// Layout

#[derive(Deserialize, PartialEq, Debug)]
#[serde(tag = "control", rename_all = "kebab-case")]
pub enum ColumnStyleOpts {
    NumericPrecision {
        default: u32,
    },
    Color {
        modes: IndexMap<String, ColorMode>,
    },
    Radio {
        values: Vec<String>,
    },
    Dropdown {
        values: Vec<String>,
    },
    DatetimeStringFormat,
    KeyValuePair {
        keys: KvPairKeys,
        values: Vec<String>,
    },
}

#[derive(Deserialize, Default, Debug, PartialEq, Clone)]
pub struct ColorMode {
    // TODO: This should be a vec; labels should be optional
    pub colors: IndexMap<String, String>,
    pub max: Option<ColorMax>,
    #[serde(default)]
    pub gradient: bool,
    // If no default is specified, the control is disabled by default.
    #[serde(default)]
    pub default: bool,
}

#[derive(Deserialize, Debug, PartialEq, Eq, Hash, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum ColorMaxStringValue {
    Column,
}

#[derive(Deserialize, Debug, PartialEq, Clone, Copy)]
#[serde(untagged)]
pub enum ColorMax {
    String(ColorMaxStringValue),
    Number(f64),
}
impl Default for ColorMax {
    fn default() -> Self {
        Self::Number(0.0)
    }
}

#[derive(Deserialize, Debug, PartialEq, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum KvPairKeyValue {
    Row,
}

#[derive(Deserialize, Debug, PartialEq, Clone)]
#[serde(untagged)]
pub enum KvPairKeys {
    String(KvPairKeyValue),
    Vec(Vec<String>),
}

//////////// tests

#[test]
fn test_values() {
    let manual = HashMap::from([
        (
            "Precision Label".to_string(),
            ColumnStyleValue::NumericPrecision(3),
        ),
        (
            "Color Label".to_string(),
            ColumnStyleValue::Color("#abc".into()),
        ),
        (
            "Radio Label".to_string(),
            ColumnStyleValue::Radio("radio".into()),
        ),
        (
            "Dropdown Label".to_string(),
            ColumnStyleValue::Dropdown("dropdown".into()),
        ),
        (
            "KvPair Label".to_string(),
            ColumnStyleValue::KeyValuePair("kvpair".into()),
        ),
        (
            "Datetime Label".to_string(),
            ColumnStyleValue::DatetimeStringFormat(DatetimeValue {}),
        ),
    ]);
    let json = serde_json::json!({
        "Precision Label": 3,
        "Color Label": "#abc",
        "Radio Label": "radio",
        "Dropdown Label": "dropdown",
        "KvPair Label": "kvpair",
        "Datetime Label": {},
    });
    assert_eq!(serde_json::to_value(manual).unwrap(), json);
}

#[test]
pub fn test_layout() {
    let values = vec!["a".to_string(), "b".to_string(), "c".to_string()];
    let manual = IndexMap::from([
        ("Precision".to_string(), ColumnStyleOpts::NumericPrecision {
            default: 3,
        }),
        ("Color".to_string(), ColumnStyleOpts::Color {
            modes: IndexMap::from([("mode".to_string(), ColorMode {
                colors: IndexMap::from([("color".to_string(), "#abc".into())]),
                ..Default::default()
            })]),
        }),
        ("Radio".into(), ColumnStyleOpts::Radio {
            values: values.clone(),
        }),
        ("Dropdown".into(), ColumnStyleOpts::Dropdown {
            values: values.clone(),
        }),
        ("Datetime".into(), ColumnStyleOpts::DatetimeStringFormat),
        ("KvPair".into(), ColumnStyleOpts::KeyValuePair {
            keys: KvPairKeys::String(KvPairKeyValue::Row),
            values: values.clone(),
        }),
    ]);
    let json = serde_json::json!({
        "Precision": {
            "control": "numeric-precision",
            "default": 3
        },
        "Color": {
            "control": "color",
            "modes": {
                "mode": {
                    "colors": {
                        "color": {
                            "value": "#abc"
                        }
                    }
                }
            }
        },
        "Radio": {
            "control": "radio",
            "values": ["a","b","c"]
        },
        "Dropdown": {
            "control": "dropdown",
            "values": ["a","b","c"]
        },
        "Datetime": {"control": "datetime-string-format"},
        "KvPair": {
            "control": "key-value-pair",
            "keys": "row",
            "values": ["a","b","c"]
        }
    });
    let output: IndexMap<String, ColumnStyleOpts> = serde_json::from_value(json).unwrap();
    assert_eq!(manual, output);
}
