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
use serde_with::skip_serializing_none;

use super::{
    CustomNumberFormatConfig, DatetimeColumnStyleConfig, DatetimeColumnStyleDefaultConfig,
    NumberColumnStyleConfig, NumberColumnStyleDefaultConfig, StringColumnStyleConfig,
    StringColumnStyleDefaultConfig,
};

/// The value de/serialized and stored in the viewer config.
/// Also passed to the plugin via `plugin.save()`.
#[skip_serializing_none]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Default)]
pub struct ColumnConfigValues {
    pub datagrid_number_style: Option<NumberColumnStyleConfig>,
    pub datagrid_string_style: Option<StringColumnStyleConfig>,
    pub datagrid_datetime_style: Option<DatetimeColumnStyleConfig>,
    pub symbols: Option<HashMap<String, String>>,
    pub number_string_format: Option<CustomNumberFormatConfig>,
}

pub enum ColumnConfigValueUpdate {
    DatagridNumberStyle(Option<NumberColumnStyleConfig>),
    DatagridStringStyle(Option<StringColumnStyleConfig>),
    DatagridDatetimeStyle(Option<DatetimeColumnStyleConfig>),
    Symbols(Option<HashMap<String, String>>),
    CustomNumberStringFormat(Option<CustomNumberFormatConfig>),
}
impl ColumnConfigValues {
    pub fn update(self, update: ColumnConfigValueUpdate) -> Self {
        match update {
            ColumnConfigValueUpdate::DatagridNumberStyle(update) => Self {
                datagrid_number_style: update,
                ..self
            },
            ColumnConfigValueUpdate::DatagridStringStyle(update) => Self {
                datagrid_string_style: update,
                ..self
            },
            ColumnConfigValueUpdate::DatagridDatetimeStyle(update) => Self {
                datagrid_datetime_style: update,
                ..self
            },
            ColumnConfigValueUpdate::Symbols(update) => Self {
                symbols: update,
                ..self
            },
            ColumnConfigValueUpdate::CustomNumberStringFormat(update) => Self {
                number_string_format: update,
                ..self
            },
        }
    }

    pub fn is_empty(&self) -> bool {
        self.datagrid_number_style.is_none()
            && self.datagrid_string_style.is_none()
            && self.datagrid_datetime_style.is_none()
            && self.symbols.is_none()
            && self.number_string_format.is_none()
    }
}

/// The controls returned by plugin.column_style_controls.
/// This is a way to fill out default values for the given controls.
/// If a control is not given, it will not be rendered. I would like to
/// eventually show these as inactive values.
#[derive(Serialize, Deserialize, PartialEq, Debug, Default)]
pub struct ColumnStyleOpts {
    pub datagrid_number_style: Option<NumberColumnStyleDefaultConfig>,
    pub datagrid_string_style: Option<StringColumnStyleDefaultConfig>,
    pub datagrid_datetime_style: Option<DatetimeColumnStyleDefaultConfig>,
    pub symbols: Option<KeyValueOpts>,
    pub number_string_format: Option<bool>,
}
#[derive(Serialize, Deserialize, Debug, PartialEq, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum KvPairKeyValue {
    Row,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(untagged)]
pub enum KvPairKeys {
    String(KvPairKeyValue),
    Vec(Vec<String>),
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct KeyValueOpts {
    pub keys: KvPairKeys,
    pub values: Vec<String>,
}

#[test]
fn serialize_layout() {
    use crate::config::*;
    let default_color = "#abc".to_string();
    let original = ColumnConfigValues {
        datagrid_number_style: Some(NumberColumnStyleConfig {
            number_fg_mode: crate::config::NumberForegroundMode::Bar,
            number_bg_mode: crate::config::NumberBackgroundMode::Gradient,
            fixed: Some(3),
            pos_fg_color: Some(default_color.clone()),
            neg_fg_color: Some(default_color.clone()),
            pos_bg_color: None,
            neg_bg_color: None,
            fg_gradient: Some(1.),
            bg_gradient: Some(2.),
        }),
        datagrid_string_style: Some(StringColumnStyleConfig {
            format: Some(crate::config::FormatMode::Italics),
            string_color_mode: Some(crate::config::StringColorMode::Foreground),
            color: Some(default_color.clone()),
        }),
        datagrid_datetime_style: Some(DatetimeColumnStyleConfig {
            _format: crate::config::DatetimeFormatType::Simple(
                crate::config::SimpleDatetimeStyleConfig {
                    date_style: crate::config::SimpleDatetimeFormat::Long,
                    time_style: crate::config::SimpleDatetimeFormat::Medium,
                },
            ),
            time_zone: Some(default_color.to_string()),
            datetime_color_mode: Some(crate::config::DatetimeColorMode::Background),
            color: Some(default_color.to_string()),
        }),
        symbols: Some(HashMap::from_iter([
            ("a".into(), "b".into()),
            ("c".into(), "d".into()),
        ])),
        number_string_format: Some(CustomNumberFormatConfig {
            _style: Some(NumberFormatStyle::Currency(CurrencyNumberFormatStyle {
                currency: CurrencyCode::XXX,
                currency_display: Some(CurrencyDisplay::Code),
                currency_sign: Some(CurrencySign::Accounting),
            })),
            ..Default::default()
        }),
    };
    let json = serde_json::to_string(&original).unwrap();
    let new: ColumnConfigValues = serde_json::from_str(&json).unwrap();
    assert_eq!(new, original);
}

#[test]
fn deserialize_layout() {
    let default_color = "#abc".to_string();
    let opts = ColumnStyleOpts {
        datagrid_number_style: Some(NumberColumnStyleDefaultConfig {
            fg_gradient: 1.,
            bg_gradient: 1.,
            fixed: 3,
            pos_fg_color: default_color.clone(),
            neg_fg_color: default_color.clone(),
            pos_bg_color: default_color.clone(),
            neg_bg_color: default_color.clone(),
            number_fg_mode: crate::config::NumberForegroundMode::Bar,
            number_bg_mode: crate::config::NumberBackgroundMode::Gradient,
        }),
        datagrid_string_style: Some(StringColumnStyleDefaultConfig {
            color: default_color.clone(),
        }),
        datagrid_datetime_style: Some(DatetimeColumnStyleDefaultConfig {
            color: default_color.clone(),
        }),
        symbols: Some(KeyValueOpts {
            keys: KvPairKeys::String(KvPairKeyValue::Row),
            values: vec!["1".into(), "2".into()],
        }),
        number_string_format: Some(true),
    };

    let json_layout = serde_json::json!({
        "datagrid_number_style": {
            "fg_gradient": 1,
            "bg_gradient": 1.,
            "fixed": 3,
            "pos_bg_color": default_color,
            "neg_bg_color": default_color,
            "pos_fg_color": default_color,
            "neg_fg_color": default_color,
            "number_fg_mode": "bar",
            "number_bg_mode": "gradient",
        },
        "datagrid_string_style": {
            "color": default_color,
        },
        "datagrid_datetime_style": {
            "color": default_color,
        },
        "symbols": {
            "keys": "row",
            "values": ["1","2"]
        },
        "number_string_format": true,
    });

    let deserded: ColumnStyleOpts = serde_json::from_value(json_layout).unwrap();
    assert_eq!(deserded, opts);
}
