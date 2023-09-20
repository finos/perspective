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
use std::fmt::Debug;

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use wasm_bindgen::{JsCast, JsValue};
use yew::{function_component, html, Callback, Html, Properties};

use crate::components::datetime_column_style::DatetimeColumnStyle;
use crate::components::number_column_style::NumberColumnStyle;
use crate::components::string_column_style::StringColumnStyle;
use crate::components::style::LocalStyle;
use crate::config::{
    DatetimeColumnStyleConfig, DatetimeColumnStyleDefaultConfig, NumberColumnStyleConfig,
    NumberColumnStyleDefaultConfig, StringColumnStyleConfig, StringColumnStyleDefaultConfig, Type,
};
use crate::presentation::Presentation;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::{ApiFuture, JsValueSerdeExt};
use crate::{clone, css, html_template};

#[derive(Clone, PartialEq, Properties)]
pub struct StyleTabProps {
    pub session: Session,
    pub renderer: Renderer,
    pub presentation: Presentation,
    pub column_name: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct DefaultConfig {
    string: serde_json::Value,
    datetime: serde_json::Value,
    date: serde_json::Value,
    integer: serde_json::Value,
    float: serde_json::Value,
    bool: serde_json::Value,
}

#[derive(Serialize, Deserialize, Debug)]
struct Config {
    columns: HashMap<String, serde_json::Value>,
}

/// This function sends the config to the plugin using its `restore` method
fn send_config<T: Serialize + Debug>(
    renderer: &Renderer,
    presentation: &Presentation,
    view: JsValue,
    column_name: String,
    column_config: T,
) {
    let current_config = get_config(renderer);
    let elem = renderer.get_active_plugin().unwrap();
    if let Some((mut current_config, _)) = current_config {
        current_config
            .columns
            .insert(column_name, serde_json::to_value(column_config).unwrap());
        let js_config = JsValue::from_serde_ext(&current_config).unwrap();
        elem.restore(&js_config);
        ApiFuture::spawn(async move {
            let view = view.unchecked_into();
            elem.update(&view, None, None, false).await
        });
        // send a config update event in case we need to listen for it outside of the
        // viewer
        presentation.column_settings_updated.emit_all(js_config);
    } else {
        tracing::warn!("Could not restore and restyle plugin!");
    }
}

fn jsval_to_type<T: DeserializeOwned>(val: &JsValue) -> Result<T, serde_json::Error> {
    let stringval = js_sys::JSON::stringify(val)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();
    serde_json::from_str(&stringval)
}

/// This function retrieves the plugin's config using its `save` method.
/// It also introduces the `default_config` field for the plugin.
/// If this field does not exist, the plugin is considered to be unstylable.
fn get_config(renderer: &Renderer) -> Option<(Config, DefaultConfig)> {
    let plugin = renderer.get_active_plugin().unwrap();
    let config = plugin.save();
    let default_config = JsValue::from(plugin.default_config());
    let config = jsval_to_type(&config).ok();
    let default_config = jsval_to_type(&default_config).ok();
    config.zip(default_config)
}

fn get_column_config<
    ConfigType: DeserializeOwned + Debug,
    DefaultConfigType: DeserializeOwned + Debug,
>(
    renderer: &Renderer,
    column_name: &str,
    ty: Type,
) -> Result<(Option<ConfigType>, DefaultConfigType), String> {
    get_config(renderer)
        .ok_or_else(|| "Could not get_config!".into())
        .and_then(|(mut config, default_config)| {
            let current_config = if let Some(config) = config.columns.remove(column_name) {
                serde_json::from_value(config)
                    .map_err(|e| format!("Could not deserialize config with error {e:?}"))?
            } else {
                None
            };

            let val = match ty {
                Type::String => default_config.string,
                Type::Datetime => default_config.datetime,
                Type::Date => default_config.date,
                Type::Integer => default_config.integer,
                Type::Float => default_config.float,
                Type::Bool => default_config.bool,
            };
            serde_json::from_value(val)
                .map_err(|e| format!("Could not deserialize default_config with error {e:?}"))
                .map(|default_config| (current_config, default_config))
        })
}

#[function_component]
pub fn StyleTab(p: &StyleTabProps) -> Html {
    let opts = p
        .session
        .metadata()
        .get_column_view_type(&p.column_name)
        .zip(p.session.get_view());
    if opts.is_none() {
        return html! {};
    }
    let (ty, view) = opts.unwrap();
    let view = (*view).clone();
    let title = format!("{} Styling", ty.to_capitalized());

    clone!(p.renderer, p.presentation, p.column_name);
    let opt_html =
        match ty {
            Type::String => get_column_config::<
                StringColumnStyleConfig,
                StringColumnStyleDefaultConfig,
            >(&renderer, &column_name, ty)
            .map(|(config, default_config)| {
                let on_change = Callback::from(move |config| {
                    send_config(
                        &renderer,
                        &presentation,
                        view.clone(),
                        column_name.clone(),
                        config,
                    );
                });
                html_template! {
                    <div class="item_title">{title.clone()}</div>
                    <div class="style_contents">
                        <StringColumnStyle  { config } {default_config} {on_change} />
                    </div>
                }
            }),
            Type::Datetime | Type::Date => get_column_config::<
                DatetimeColumnStyleConfig,
                DatetimeColumnStyleDefaultConfig,
            >(&renderer, &column_name, ty)
            .map(|(config, default_config)| {
                let on_change = Callback::from(move |config| {
                    send_config(
                        &renderer,
                        &presentation,
                        view.clone(),
                        column_name.clone(),
                        config,
                    );
                });
                html_template! {
                    <div class="item_title">{title.clone()}</div>
                    <div class="style_contents">
                        <DatetimeColumnStyle
                            enable_time_config={matches!(ty, Type::Datetime)}
                            { config }
                            {default_config}
                            {on_change}
                            />
                    </div>
                }
            }),
            Type::Integer | Type::Float => get_column_config::<
                NumberColumnStyleConfig,
                NumberColumnStyleDefaultConfig,
            >(&renderer, &column_name, ty)
            .map(|(config, default_config)| {
                let on_change = Callback::from(move |config| {
                    send_config(
                        &renderer,
                        &presentation,
                        view.clone(),
                        column_name.clone(),
                        config,
                    );
                });
                html_template! {
                    <div class="item_title">{title.clone()}</div>
                    <div class="style_contents">
                        <NumberColumnStyle  { config } {default_config} {on_change} />
                    </div>
                }
            }),
            _ => Err("Booleans aren't styled yet.".into()),
        };
    let inner = if let Ok(html) = opt_html {
        html
    } else {
        // do the tracing logs
        tracing::warn!("{}", opt_html.unwrap_err());
        // return the default impl
        html_template! {
            <div class="item_title">{title}</div>
            <div class="style_contents">
                <LocalStyle href={ css!("column-style") } />
                <div id="column-style-container" class="no-style">
                    <div class="style-contents">{ "No styles available" }</div>
                </div>
            </div>
        }
    };

    html! {
        <div id="style-tab">{inner}</div>
    }
}
