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

use crate::components::column_settings_sidebar::style_tab::symbol::SymbolAttr;
use crate::components::datetime_column_style::DatetimeColumnStyle;
use crate::components::number_column_style::NumberColumnStyle;
use crate::components::string_column_style::StringColumnStyle;
use crate::components::style::LocalStyle;
use crate::config::plugin::*;
use crate::config::*;
use crate::custom_events::CustomEvents;
use crate::model::*;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::*;
use crate::{clone, css, derive_model, html_template};

/// This function retrieves the plugin's config using its `save` method.
/// It also introduces the `default_config` field for the plugin.
/// If this field does not exist, the plugin is considered to be un-style-able.
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
}
derive_model!(CustomEvents, Session, Renderer for ColumnStyleProps);
#[function_component]
pub fn ColumnStyle(p: &ColumnStyleProps) -> Html {
    let props = p.clone();
    let (config, attrs) = (props.get_plugin_config(), props.get_plugin_attrs());
    let (config, attrs) = (config.unwrap(), attrs.unwrap());
    let title = format!("{} Styling", props.ty.to_capitalized());
    let opt_html = match props.ty {
        Type::String => get_column_style::<_, StringColumnStyleDefaultConfig>(
            config.clone(),
            attrs.clone(),
            &props.column_name,
            props.ty,
        )
        .map(|(config, default_config)| {
            let on_change = Callback::from(move |config| {
                props.send_plugin_config(
                    props.column_name.clone(),
                    serde_json::to_value(config).unwrap(),
                )
            });

            html_template! {
                <div class="item_title">{ title.clone() }</div>
                <div class="style_contents">
                    <StringColumnStyle
                        { config }
                        { default_config }
                        { on_change }/>
                </div>
            }
        }),

        Type::Datetime | Type::Date => get_column_style::<_, DatetimeColumnStyleDefaultConfig>(
            config.clone(),
            attrs.clone(),
            &props.column_name,
            props.ty,
        )
        .map(|(config, default_config)| {
            let enable_time_config = matches!(props.ty, Type::Datetime);
            let on_change = Callback::from(move |config| {
                props.send_plugin_config(
                    props.column_name.clone(),
                    serde_json::to_value(config).unwrap(),
                )
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
            config.clone(),
            attrs.clone(),
            &props.column_name,
            props.ty,
        )
        .map(|(config, default_config)| {
            let on_change = {
                clone!(props);
                Callback::from(move |config| {
                    props.send_plugin_config(
                        props.column_name.clone(),
                        serde_json::to_value(config).unwrap(),
                    )
                })
            };

            html_template! {
                <div class="item_title">{ title.clone() }</div>
                <div class="style_contents">
                    <NumberColumnStyle
                        session={ props.session.clone() }
                        column_name={ props.column_name.clone() }
                        { config }
                        { default_config }
                        { on_change }/>
                </div>
            }
        }),
        _ => Err("Booleans aren't styled yet.".into()),
    };

    let props = p;
    let plugin = props
        .renderer
        .get_active_plugin()
        .expect("No active plugins!");

    let plugin_column_names = plugin
        .config_column_names()
        .map(|arr| {
            arr.into_serde_ext::<Vec<Option<String>>>()
                .expect("Could not deserialize config_column_names into Vec<Option<String>>")
        })
        .unwrap_or_default();

    let view_config = props.session.get_view_config();
    let mut is_symbol = false;
    let components = plugin_column_names
        .iter()
        .zip(&view_config.columns)
        .filter_map(|(ty, name)| {
            let attr_type = props
                .session
                .metadata()
                .get_column_view_type(&props.column_name)
                .expect("Couldn't get column type for {column_name}");

            let zipped = ty.as_deref().zip(name.as_deref());
            match zipped {
                Some(("Symbol", name)) if name == props.column_name && p.ty == Type::String => {
                    is_symbol = true;
                    Some(html! {
                        <SymbolAttr
                            { attr_type }
                            column_name={ props.column_name.clone() }
                            session={ &props.session }
                            renderer={ &props.renderer }
                            custom_events={ &props.custom_events }
                        />
                    })
                }
                _ => None,
            }
        })
        .collect::<Html>();

    let is_ok = opt_html.is_ok();
    html_template! {
        <LocalStyle href={ css!("column-style") } />
        if is_ok {
            { opt_html.unwrap() }
        }

        { components }
        if !is_ok && !is_symbol {
            <div class="style_contents">
                <div id="column-style-container" class="no-style">
                    <div class="style-contents">{ "No styles available" }</div>
                </div>
            </div>
        }
    }
}
