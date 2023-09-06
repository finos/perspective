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
use crate::config::Type;
use crate::presentation::Presentation;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::JsValueSerdeExt;
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
    default_config: Option<DefaultConfig>,
}

/// This function sends the config to the plugin using its `restore` method
fn send_config<T: Serialize + Debug>(
    renderer: Renderer,
    presentation: Presentation,
    view: JsValue,
    column_name: String,
    column_config: T,
) {
    let current_config = get_config(&renderer);
    let elem = renderer.get_active_plugin().unwrap();
    if let Some(mut current_config) = current_config {
        current_config
            .columns
            .insert(column_name, serde_json::to_value(column_config).unwrap());
        let js_config = JsValue::from_serde_ext(&current_config).unwrap();
        elem.restore(&js_config);
        // we don't need to block yew's rendering to restyle the element,
        // nor do we need any returned result, nor do we care if it fails.
        wasm_bindgen_futures::spawn_local(async move {
            let view = view.unchecked_into();
            elem.update(&view, None, None, false)
                .await
                .expect("Unable to call update!");
        });
        // send a config update event in case we need to listen for it outside of the
        // viewer
        presentation.column_settings_updated.emit_all(js_config);
    } else {
        tracing::warn!("Could not restore and restyle plugin!");
    }
}

/// This function retrieves the plugin's config using its `save` method.
fn get_config(renderer: &Renderer) -> Option<Config> {
    let config = renderer.get_active_plugin().unwrap().save();
    let stringval = js_sys::JSON::stringify(&config)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();
    serde_json::from_str(&stringval).ok()
}

fn get_column_config<T: DeserializeOwned + Debug, D: DeserializeOwned + Debug>(
    renderer: &Renderer,
    column_name: &str,
    ty: Type,
) -> Option<(Option<T>, Option<D>)> {
    get_config(renderer).map(|mut config| {
        (
            config.columns.remove(column_name).and_then(|val| {
                serde_json::from_value(val)
                    .map_err(|e| tracing::warn!("Could not deserialize config with error {e:?}"))
                    .ok()
            }),
            config
                .default_config
                .map(|dc| match ty {
                    Type::String => dc.string,
                    Type::Datetime => dc.datetime,
                    Type::Date => dc.date,
                    Type::Integer => dc.integer,
                    Type::Float => dc.float,
                    Type::Bool => dc.bool,
                })
                .and_then(|val| {
                    serde_json::from_value(val)
                        .map_err(|e| {
                            tracing::warn!("Could not deserialize default_config with error {e:?}")
                        })
                        .ok()
                }),
        )
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
    let opt_html = match ty {
        Type::String => {
            get_column_config(&renderer, &column_name, ty).map(|(config, default_config)| {
                let on_change = Callback::from(move |config| {
                    send_config(
                        renderer.clone(),
                        presentation.clone(),
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
            })
        }
        Type::Datetime | Type::Date => {
            get_column_config(&renderer, &column_name, ty).map(|(config, default_config)| {
                let on_change = Callback::from(move |config| {
                    send_config(
                        renderer.clone(),
                        presentation.clone(),
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
            })
        }
        Type::Integer | Type::Float => {
            get_column_config(&renderer, &column_name, ty).map(|(config, default_config)| {
                let on_change = Callback::from(move |config| {
                    send_config(
                        renderer.clone(),
                        presentation.clone(),
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
            })
        }
        _ => None,
    };
    let inner = opt_html.unwrap_or(html_template! {
        <div class="item_title">{title}</div>
        <div class="style_contents">
            <LocalStyle href={ css!("column-style") } />
            <div id="column-style-container" class="no-style">
                <div class="style-contents">{ "No styles available" }</div>
            </div>
        </div>
    });

    html! {
        <div id="style-tab">{inner}</div>
    }
}
