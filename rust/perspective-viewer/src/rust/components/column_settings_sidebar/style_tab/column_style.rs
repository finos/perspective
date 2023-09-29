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
use yew::{function_component, html, Callback, Html, Properties};

use crate::components::datetime_column_style::DatetimeColumnStyle;
use crate::components::number_column_style::NumberColumnStyle;
use crate::components::string_column_style::StringColumnStyle;
use crate::components::style::LocalStyle;
use crate::config::plugin::{PluginAttributes, PluginConfig};
use crate::config::{
    DatetimeColumnStyleDefaultConfig, NumberColumnStyleDefaultConfig,
    StringColumnStyleDefaultConfig, Type,
};
use crate::custom_events::CustomEvents;
use crate::model::*;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::{clone, css, derive_model, html_template};

/// This function retrieves the plugin's config using its `save` method.
/// It also introduces the `default_config` field for the plugin.
/// If this field does not exist, the plugin is considered to be unstylable.
fn get_column_style<T, U>(
    mut config: PluginConfig,
    attrs: PluginAttributes,
    column_name: &str,
    ty: Type,
) -> Result<(Option<T>, U), String>
where
    T: DeserializeOwned + std::fmt::Debug,
    U: DeserializeOwned + std::fmt::Debug,
{
    let current_config = if let Some(config) = config.columns.remove(column_name) {
        serde_json::from_value(config)
            .map_err(|e| format!("Could not deserialize config with error {e:?}"))?
    } else {
        None
    };

    let style = attrs
        .style
        .ok_or_else(|| "Styles not implemented".to_string())?;
    let val = match ty {
        Type::String => style.string,
        Type::Datetime => style.datetime,
        Type::Date => style.date,
        Type::Integer => style.integer,
        Type::Float => style.float,
        Type::Bool => style.bool,
    };
    serde_json::from_value(val)
        .map_err(|e| format!("Could not deserialize default_config with error {e:?}"))
        .map(|default_config| (current_config, default_config))
}

#[derive(Clone, PartialEq, Properties)]
pub struct ColumnStyleProps {
    pub custom_events: CustomEvents,
    pub session: Session,
    pub renderer: Renderer,

    pub ty: Type,
    pub column_name: String,
    pub config: PluginConfig,
    pub attrs: PluginAttributes,
}
derive_model!(CustomEvents, Session, Renderer for ColumnStyleProps);
#[function_component]
pub fn ColumnStyle(p: &ColumnStyleProps) -> Html {
    let title = format!("{} Styling", p.ty.to_capitalized());

    clone!(p);
    let opt_html = match p.ty {
        Type::String => get_column_style::<_, StringColumnStyleDefaultConfig>(
            p.config.clone(),
            p.attrs.clone(),
            &p.column_name,
            p.ty,
        )
        .map(|(config, default_config)| {
            let on_change = Callback::from(move |config| {
                p.send_plugin_config(p.column_name.clone(), serde_json::to_value(config).unwrap())
            });
            html_template! {
                <div class="item_title">{title.clone()}</div>
                <div class="style_contents">
                    <StringColumnStyle  { config } {default_config} {on_change} />
                </div>
            }
        }),

        Type::Datetime | Type::Date => get_column_style::<_, DatetimeColumnStyleDefaultConfig>(
            p.config.clone(),
            p.attrs.clone(),
            &p.column_name,
            p.ty,
        )
        .map(|(config, default_config)| {
            let enable_time_config = matches!(p.ty, Type::Datetime);
            let on_change = Callback::from(move |config| {
                p.send_plugin_config(p.column_name.clone(), serde_json::to_value(config).unwrap())
            });
            html_template! {
                <div class="item_title">{title.clone()}</div>
                <div class="style_contents">
                    <DatetimeColumnStyle
                        { enable_time_config }
                        { config }
                        { default_config }
                        { on_change }
                        />
                </div>
            }
        }),

        Type::Integer | Type::Float => get_column_style::<_, NumberColumnStyleDefaultConfig>(
            p.config.clone(),
            p.attrs.clone(),
            &p.column_name,
            p.ty,
        )
        .map(|(config, default_config)| {
            let on_change = {
                clone!(p);
                Callback::from(move |config| {
                    p.send_plugin_config(
                        p.column_name.clone(),
                        serde_json::to_value(config).unwrap(),
                    )
                })
            };
            html_template! {
                <div class="item_title">{title.clone()}</div>
                <div class="style_contents">
                    <NumberColumnStyle
                        session = {p.session.clone()}
                        column_name={p.column_name.clone()}
                        { config }
                        {default_config}
                        {on_change}
                        />
                </div>
            }
        }),
        _ => Err("Booleans aren't styled yet.".into()),
    };
    if let Ok(html) = opt_html {
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
    }
}
