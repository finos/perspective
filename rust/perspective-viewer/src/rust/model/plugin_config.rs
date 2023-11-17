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
use crate::utils::{ApiFuture, JsValueSerdeExt};

pub trait GetPluginConfig: HasRenderer {
    /// This function will get the results of calling plugin.save()
    fn get_plugin_config(&self) -> Option<PluginConfig> {
        let plugin = self.renderer().get_active_plugin().unwrap();
        let config = plugin.save();
        jsval_to_type(&config).ok()
    }
    /// This function will get the results of calling plugin.plugin_attrs.
    /// Plugin attrs should not change during the lifetime of the plugin.
    fn get_plugin_attrs(&self) -> Option<PluginAttributes> {
        let plugin = self.renderer().get_active_plugin().unwrap();
        let default_config = JsValue::from(plugin.plugin_attributes());
        jsval_to_type(&default_config).ok()
    }
}
impl<T: HasRenderer> GetPluginConfig for T {}

pub trait UpdatePluginConfig: HasRenderer + HasCustomEvents + HasSession + GetPluginConfig {
    /// This function sends the config to the plugin using its `restore` method.
    /// It will also send a config update event in case we need to listen for it
    /// outside of the viewer
    fn send_plugin_config(&self, column_name: String, column_config: serde_json::Value) {
        let custom_events = self.custom_events();
        let renderer = self.renderer();
        let current_config = self.get_plugin_config();
        let elem = renderer.get_active_plugin().unwrap();
        if let Some(mut current_config) = current_config {
            current_config.columns.insert(column_name, column_config);
            let js_config = JsValue::from_serde_ext(&current_config).unwrap();
            elem.restore(&js_config);
            let session = self.session().clone();
            clone!(renderer);
            ApiFuture::spawn(async move { renderer.update(&session).await });
            custom_events.dispatch_column_style_changed(&js_config)
        } else {
            tracing::warn!("Could not restore and restyle plugin!");
        }
    }
}

/// This function will convert a JsValue to a rust-native type. It uses
/// serde_json to do this, so use it with caution!
fn jsval_to_type<T: DeserializeOwned>(val: &JsValue) -> Result<T, serde_json::Error> {
    let stringval = js_sys::JSON::stringify(val)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();
    serde_json::from_str(&stringval)
}

impl<T: HasRenderer + HasCustomEvents + HasSession> UpdatePluginConfig for T {}
