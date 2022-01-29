////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod aggregates;
mod column_type;
mod filters;
mod sort;
mod view_config;

use crate::renderer::Renderer;

pub use aggregates::*;
pub use column_type::*;
pub use filters::*;
pub use sort::*;
pub use view_config::*;

use serde::Deserialize;
use serde::Deserializer;
use serde::Serialize;
use serde_json::Value;

#[derive(Serialize)]
#[serde(deny_unknown_fields)]
pub struct ViewerConfig {
    pub plugin: String,
    pub plugin_config: Value,
    pub settings: bool,
    pub theme: Option<String>,

    #[serde(flatten)]
    pub view_config: ViewConfig,
}

impl ViewerConfig {
    pub fn new(renderer: &Renderer) -> ViewerConfig {
        ViewerConfig {
            plugin: renderer.get_active_plugin().unwrap().name(),
            view_config: ViewConfig::default(),
            plugin_config: Value::Null,
            theme: None,
            settings: false,
        }
    }
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ViewerConfigUpdate {
    #[serde(default)]
    pub plugin: PluginUpdate,

    #[serde(default)]
    pub theme: ThemeUpdate,

    #[serde(default)]
    pub settings: SettingsUpdate,

    #[serde(default)]
    pub plugin_config: Option<Value>,

    #[serde(flatten)]
    pub view_config: ViewConfigUpdate,
}

#[derive(Clone)]
pub enum OptionalUpdate<T: Clone> {
    SetDefault,
    Missing,
    Update(T),
}

pub type PluginUpdate = OptionalUpdate<String>;
pub type SettingsUpdate = OptionalUpdate<bool>;
pub type ThemeUpdate = OptionalUpdate<String>;

/// Handles `{}` when included as a field with `#[serde(default)]`.
impl<T: Clone> Default for OptionalUpdate<T> {
    fn default() -> Self {
        Self::Missing
    }
}

/// Handles `{plugin: null}` and `{plugin: val}` by treating this type as an
/// option.
impl<T: Clone> From<Option<T>> for OptionalUpdate<T> {
    fn from(opt: Option<T>) -> OptionalUpdate<T> {
        match opt {
            Some(v) => OptionalUpdate::<T>::Update(v),
            None => OptionalUpdate::SetDefault,
        }
    }
}

/// Treats `PluginUpdate` enum as an `Option<T>` when present during deserialization.
impl<'a, T> Deserialize<'a> for OptionalUpdate<T>
where
    T: Deserialize<'a> + Clone,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'a>,
    {
        Option::deserialize(deserializer).map(Into::into)
    }
}
