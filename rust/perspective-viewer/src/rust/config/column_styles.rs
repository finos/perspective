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

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct ColumnStyleOpts {
    pub label: Option<String>,
    pub control: ControlName,
    pub options: Option<ControlOptions>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum ControlName {
    NumericPrecision,
    Color,
    Radio,
    Dropdown,
    DatetimeStringFormat,
    KeyValuePair,
}
#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(untagged)]
pub enum ControlOptions {
    Color(ColorOpts),
    NumericPrecision(NumericPrecisionOpts),
    Vec(Vec<String>),
    KvPair(KvPairOpts),
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct ColorPickerOpts {
    pub label: Option<String>,
    pub value: String, // TODO: deserialize into a CSS color
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct ColorMode {
    pub label: Option<String>,
    pub colors: Vec<ColorPickerOpts>,
    pub max: Option<ColorMaxValue>,
    #[serde(default)]
    pub gradient: bool,
    // If no default is specified, the control is disabled by default.
    #[serde(default)]
    pub default: bool,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum ColorMaxStringValue {
    Column,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone, Copy)]
#[serde(untagged)]
pub enum ColorMaxValue {
    String(ColorMaxStringValue),
    Number(f64),
}
impl Default for ColorMaxValue {
    fn default() -> Self {
        Self::Number(0.0)
    }
}
#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct ColorOpts {
    pub modes: Vec<ColorMode>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum KvPairKeyStringValue {
    Row,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(untagged)]
pub enum KvPairKeys {
    Value(KvPairKeyStringValue),
    Vec(Vec<String>),
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct KvPairOpts {
    pub keys: KvPairKeys,
    pub values: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct NumericPrecisionOpts {
    pub default: u32,
}

#[test]
fn color_from_json() {
    let example = serde_json::json!(
            {
                "label": "2",
                "control": "color",
                "options": {
                    "modes": [
                        {
                            "label": "1",
                            "colors": [{"label": "+", "value": "blue"}, {"label": "-", "value": "red"}],
                            "gradient": true,
                            "max": "column",
                            "default": true,
                        },
                        {
                            "label": "2",
                            "colors": [{"value": "blue"}]
                        },
                    ],
                }
            }
    );
    let deserde: ColumnStyleOpts = serde_json::from_value(example).unwrap();
    assert_eq!(deserde, ColumnStyleOpts {
        label: Some("2".into()),
        control: ControlName::Color,
        options: Some(ControlOptions::Color(ColorOpts {
            modes: vec![
                ColorMode {
                    label: Some("1".into()),
                    colors: vec![
                        ColorPickerOpts {
                            label: Some("+".into()),
                            value: "blue".into()
                        },
                        ColorPickerOpts {
                            label: Some("-".into()),
                            value: "red".into()
                        }
                    ],
                    max: Some(ColorMaxValue::String(ColorMaxStringValue::Column)),
                    gradient: true,
                    default: true,
                },
                ColorMode {
                    label: Some("2".into()),
                    colors: vec![ColorPickerOpts {
                        label: None,
                        value: "blue".into(),
                    }],
                    max: None,
                    gradient: false,
                    default: false,
                }
            ]
        }))
    },);
}

#[test]
fn test_deserialize_from_json() {
    let example = serde_json::json!([
        {
            "label": "1",
            "control": "numeric-precision",
        },
        {
            "label": "2",
            "control": "color",
            "options": {
                "modes": [
                    {
                        "label": "1",
                        "colors": [{"label": "+", "value": "blue"}, {"label": "-", "value": "red"}],
                        "gradient": true,
                        "max": "column",
                    },
                    {
                        "label": "2",
                        "colors": [{"value": "blue"}]
                    },
                ],

            }
        },
        {
            "label": "3",
            "control": "radio",
            "options": ["a","b","c"]
        },
        {
            "control": "dropdown",
            "options": ["a","b","c"]
        },
        {
            "label": "5",
            "control": "datetime-string-format",
        },
        {
            "label": "6",
            "control": "key-value-pair",
            "options": {
                "keys": "row",
                "values": ["a","b","c"]
            }
        }
    ]);
    let manual_value = vec![
        ColumnStyleOpts {
            label: Some("1".into()),
            control: ControlName::NumericPrecision,
            options: None,
        },
        ColumnStyleOpts {
            label: Some("2".into()),
            control: ControlName::Color,
            options: Some(ControlOptions::Color(ColorOpts {
                modes: vec![
                    ColorMode {
                        label: Some("1".into()),
                        colors: vec![
                            ColorPickerOpts {
                                label: Some("+".into()),
                                value: "blue".into(),
                            },
                            ColorPickerOpts {
                                label: Some("-".into()),
                                value: "red".into(),
                            },
                        ],
                        max: Some(ColorMaxValue::String(ColorMaxStringValue::Column)),
                        gradient: true,
                        default: false,
                    },
                    ColorMode {
                        label: Some("2".into()),
                        colors: vec![ColorPickerOpts {
                            label: None,
                            value: "blue".into(),
                        }],
                        max: None,
                        gradient: false,
                        default: false,
                    },
                ],
            })),
        },
        ColumnStyleOpts {
            label: Some("3".into()),
            control: ControlName::Radio,
            options: Some(ControlOptions::Vec(vec![
                "a".into(),
                "b".into(),
                "c".into(),
            ])),
        },
        ColumnStyleOpts {
            label: None,
            control: ControlName::Dropdown,
            options: Some(ControlOptions::Vec(vec![
                "a".into(),
                "b".into(),
                "c".into(),
            ])),
        },
        ColumnStyleOpts {
            label: Some("5".into()),
            control: ControlName::DatetimeStringFormat,
            options: None,
        },
        ColumnStyleOpts {
            label: Some("6".into()),
            control: ControlName::KeyValuePair,
            options: Some(ControlOptions::KvPair(KvPairOpts {
                keys: KvPairKeys::Value(KvPairKeyStringValue::Row),
                values: vec!["a".into(), "b".into(), "c".into()],
            })),
        },
    ];

    let deserde_value: Vec<ColumnStyleOpts> = serde_json::from_value(example).unwrap();
    assert_eq!(deserde_value, manual_value);
}
