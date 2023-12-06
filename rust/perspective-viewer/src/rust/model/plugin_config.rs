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

use serde::de::DeserializeOwned;
use wasm_bindgen::JsValue;

use super::{HasCustomEvents, HasRenderer, HasSession};
use crate::clone;
use crate::config::plugin::{PluginAttributes, PluginConfig};
use crate::config::ViewerConfig;
use crate::utils::{ApiFuture, ApiResult, JsValueSerdeExt};

pub trait GetPluginConfig: HasRenderer {
    /// This function will get the results of calling plugin.save()
    fn get_plugin_config(&self) -> ApiResult<PluginConfig> {
        let plugin = self.renderer().get_active_plugin()?;
        let config = plugin.save();
        jsval_to_type(&config)
    }
    /// This function will get the results of calling plugin.plugin_attrs.
    /// Plugin attrs should not change during the lifetime of the plugin.
    fn get_plugin_attrs(&self) -> ApiResult<PluginAttributes> {
        let plugin = self.renderer().get_active_plugin()?;
        let default_config = JsValue::from(plugin.plugin_attributes());
        jsval_to_type(&default_config)
    }
}

impl<T: HasRenderer> GetPluginConfig for T {}

pub trait UpdatePluginConfig: HasRenderer + HasCustomEvents + HasSession + GetPluginConfig {
    /// This function sends the config to the plugin using its `restore` method.
    /// It will return an ApiFuture which calls renderer.update().
    /// It will also send a config update event in case we need to listen for it
    /// outside of the viewer
    fn send_plugin_config(
        &self,
        column_name: String,
        column_config: Option<serde_json::Value>,
        viewer_config: ViewerConfig,
    ) -> ApiResult<ApiFuture<()>> {
        let plugin = self.renderer().get_active_plugin()?;
        let plugin_config = plugin.save();
        let plugin_config = column_config
            .and_then(|column_config| {
                (|| -> ApiResult<JsValue> {
                    let mut plugin_config: serde_json::Map<String, serde_json::Value> =
                        plugin_config.clone().into_serde_ext()?;
                    let columns = if let Some(columns) = plugin_config.get_mut("columns") {
                        columns
                    } else {
                        plugin_config.insert("columns".to_string(), serde_json::json!({}));
                        plugin_config.get_mut("columns").unwrap()
                    };
                    columns
                        .as_object_mut()
                        .ok_or("Non-object columns property!")?
                        .insert(column_name, column_config);

                    let plugin_config = serde_json::to_value(plugin_config)?;
                    Ok(JsValue::from_serde_ext(&plugin_config)?)
                })()
                .ok()
            })
            .unwrap_or(plugin_config);

        let plugin_elem = self.renderer().get_active_plugin()?;
        plugin_elem.restore(&plugin_config, &viewer_config);
        self.custom_events()
            .dispatch_column_style_changed(&plugin_config);

        clone!(self.renderer(), self.session());
        Ok(ApiFuture::new(
            async move { renderer.update(&session).await },
        ))
    }
}

/// This function will convert a JsValue to a rust-native type. It uses
/// serde_json to do this, so use it with caution!
fn jsval_to_type<T: DeserializeOwned>(val: &JsValue) -> ApiResult<T> {
    let stringval = js_sys::JSON::stringify(val)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();
    Ok(serde_json::from_str(&stringval)?)
}

impl<T: HasRenderer + HasCustomEvents + HasSession> UpdatePluginConfig for T {}
