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

use super::{
    DatetimeColumnStyleConfig, DatetimeColumnStyleDefaultConfig, NumberColumnStyleConfig,
    NumberColumnStyleDefaultConfig, StringColumnStyleConfig, StringColumnStyleDefaultConfig, Type,
};

/// Maps view_type to control labels to control values. Expressed in typescript:
/// ```ts
/// type viewer_config = {column_config: {[ty: psp.Type]: {[control_label: string]: value}}}
///                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
/// ```
pub type ColumnStyleMap = HashMap<Type, HashMap<String, ColumnStyleValue>>;

/// The value de/serialized and stored in the viewer config.
/// Also passed to the plugin via `plugin.save()`.
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(untagged)]
pub enum ColumnStyleValue {
    NumberColumnStyle(NumberColumnStyleConfig),
    StringColumnStyle(StringColumnStyleConfig),
    DatetimeColumnStyle(DatetimeColumnStyleConfig),
    KeyValuePair(HashMap<String, String>),
}

/// The controls returned by plugin.column_style_controls.
/// This forms a layout schema to be populated in the column_settings_sidebar.
/// ```ts
/// type Controls = {[control_label: string]: {control: ControlName, ...control_values}}
/// const my_controls: Controls = {"foobar": {control: "datetime-column-style", color: "#abc"}}
/// ````
// TODO: Rename to ColumnStyleLayout; make corresponding changes in API
#[derive(Deserialize, PartialEq, Debug)]
#[serde(tag = "control", rename_all = "kebab-case")]
pub enum ColumnStyleOpts {
    NumberColumnStyle(NumberColumnStyleDefaultConfig),
    StringColumnStyle(StringColumnStyleDefaultConfig),
    DatetimeColumnStyle(DatetimeColumnStyleDefaultConfig),
    KeyValuePair {
        keys: KvPairKeyValue,
        values: Vec<String>,
    },
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
