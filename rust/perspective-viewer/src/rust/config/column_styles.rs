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
use yew::html;

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct ColumnStyleOpts {
    pub label: Option<String>,
    pub control: ControlName,
    pub options: Option<ControlOptions>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ControlName {
    NumericPrecision,
    Color,
    Radio,
    Dropdown,
    DatetimeStringFormat,
    KeyValuePair,
}
#[derive(Serialize, Deserialize, Debug, PartialEq)]
#[serde(untagged)]
pub enum ControlOptions {
    Color(ColorOpts),
    Vec(Vec<String>),
    KvPair(KvPairOpts),
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct ColorPickerOpts {
    label: Option<String>,
    value: String, // TODO: deserialize into a CSS color
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct ColorMode {
    label: Option<String>,
    colors: Vec<ColorPickerOpts>,
    max: Option<ColorMaxValue>,
    #[serde(default)]
    gradient: bool,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ColorMaxValue {
    Column,
}
#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct ColorOpts {
    modes: Vec<ColorMode>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "kebab-case")]
enum KvPairKeyStringValue {
    Row,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
#[serde(untagged)]
enum KvPairKeys {
    Value(KvPairKeyStringValue),
    Vec(Vec<String>),
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct KvPairOpts {
    keys: KvPairKeys,
    values: Vec<String>,
}

impl ColumnStyleOpts {
    // /// Interprets the control option, returning an instance of the associated
    // /// yew component.
    // pub fn into_component(self) -> yew::Html {
    //     match (self.control, self.options) {
    //         (ControlName::NumericPrecision, ControlOptions::Empty(..)) => {
    //             html! {<NumericPrecisionControl label={self.label} />}
    //         },
    //         (ControlName::DatetimeStringFormat, ControlOptions::Empty(..)) => {
    //             html! {<DatetimeStringFormatControl label={self.label} />}
    //         },
    //         (ControlName::Color, ControlOptions::Color(options)) => {
    //             html! {<ColorControl {options} label={self.label} />}
    //         },
    //         (ControlName::Radio, ControlOptions::Vec(options)) => {
    //             html! {<RadioControl {options} label={self.label} />}
    //         },
    //         (ControlName::Dropdown, ControlOptions::Vec(options)) => {
    //             html! {<DropdownControl {options} label={self.label} />}
    //         },
    //         _ => {
    //             html! {<Stub />}
    //         },
    //     }
    // }
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
                    max: Some(ColorMaxValue::Column),
                    gradient: true,
                },
                ColorMode {
                    label: Some("2".into()),
                    colors: vec![ColorPickerOpts {
                        label: None,
                        value: "blue".into(),
                    }],
                    max: None,
                    gradient: false,
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
                        max: Some(ColorMaxValue::Column),
                        gradient: true,
                    },
                    ColorMode {
                        label: Some("2".into()),
                        colors: vec![ColorPickerOpts {
                            label: None,
                            value: "blue".into(),
                        }],
                        max: None,
                        gradient: false,
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
