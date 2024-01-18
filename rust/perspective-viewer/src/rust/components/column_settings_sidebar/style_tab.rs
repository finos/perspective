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

mod column_style;
pub mod numeric_precision;
pub mod stub;
mod symbol;

use yew::{function_component, html, Html, Properties};

use crate::components::column_settings_sidebar::style_tab::column_style::ColumnStyle;
use crate::components::column_settings_sidebar::style_tab::numeric_precision::NumericPrecision;
use crate::components::column_settings_sidebar::style_tab::stub::Stub;
use crate::components::column_settings_sidebar::style_tab::symbol::SymbolStyle;
use crate::config::{ControlName, ControlOptions, Type};
use crate::custom_events::CustomEvents;
use crate::derive_model;
use crate::model::PluginColumnStyles;
use crate::presentation::Presentation;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::JsValueSerdeExt;

#[derive(Clone, PartialEq, Properties)]
pub struct StyleTabProps {
    pub custom_events: CustomEvents,
    pub session: Session,
    pub renderer: Renderer,
    pub presentation: Presentation,

    pub ty: Option<Type>,
    pub column_name: String,
}
derive_model!(Session, Renderer, Presentation, CustomEvents for StyleTabProps);

#[function_component]
pub fn StyleTab(props: &StyleTabProps) -> Html {
    // TODO: on_update will send the config back to the plugin
    let on_update = yew::use_callback((), move |_, _| {
        tracing::error!("on_update!");
    });
    let control_opts = props.get_column_style_control_options(&props.column_name);
    let components = match control_opts {
        Ok(opts) => opts
            .into_iter()
            .map(|opt| match (opt.control, opt.options) {
                (ControlName::Color, Some(ControlOptions::Color(opts))) => {
                    html! {}
                },
                (ControlName::DatetimeStringFormat, None) => {
                    html! {}
                },
                (ControlName::NumericPrecision, Some(ControlOptions::NumericPrecision(opts))) => {
                    html! {
                        <NumericPrecision label={opt.label} {opts} on_update={on_update.clone()} />
                    }
                },
                (ControlName::Radio, Some(ControlOptions::Vec(opts))) => {
                    html! {}
                },
                (ControlName::Dropdown, Some(ControlOptions::Vec(opts))) => {
                    html! {}
                },
                (control, opts) => html! {
                    <Stub
                        message="Invalid specification"
                        error={format!("Invalid specification\ncontrol={control:?}\nopts={opts:?}")}/>
                },
            })
            .collect::<Html>(),
        Err(e) => {
            html! {
                <Stub message="No plugin styles available" error={format!("{e:?}")} />
            }
        },
    };

    // let plugin = props.renderer.get_active_plugin().unwrap();
    // let plugin_column_names = plugin
    //     .config_column_names()
    //     .and_then(|arr| arr.into_serde_ext::<Vec<Option<String>>>().ok())
    //     .unwrap();

    // let view_config = props.session.get_view_config();

    // let (col_idx, _) = view_config
    //     .columns
    //     .iter()
    //     .enumerate()
    //     .find(|(_, opt)| {
    //         opt.as_ref()
    //             .map(|s| s == &props.column_name)
    //             .unwrap_or_default()
    //     })
    //     .unwrap();

    // // This mimics the behavior where plugins can take a single value
    // // per column grouping, and any overflow falls into the final heading
    // let col_grp = plugin_column_names
    //     .iter()
    //     .chain(std::iter::repeat(plugin_column_names.last().unwrap()))
    //     .nth(col_idx)
    //     .unwrap()
    //     .to_owned()
    //     .unwrap();

    // // TODO: We need a better way to determine which styling components to show.
    // // This will come with future changes to the plugin API.
    // let components = match col_grp.as_str() {
    //     "Symbol" => Some(html! {
    //         <SymbolStyle
    //             column_name={ props.column_name.clone() }
    //             session={ &props.session }
    //             renderer={ &props.renderer }
    //             custom_events={ &props.custom_events }/>
    //     }),
    //     "Columns" => Some(html! {
    //         <ColumnStyle
    //             custom_events={ props.custom_events.clone() }
    //             session={ props.session.clone() }
    //             renderer={ props.renderer.clone() }
    //             column_name={ props.column_name.clone() }
    //             // This is here so the column styles update on session change.
    //             view_type={ props.ty.unwrap() }/>
    //     }),
    //     _ => None,
    // };

    // let components = components.unwrap_or(html! {
    //     <Stub
    //         message="No plugin styles available"
    //         error="Could not get plugin styles"/>
    // });

    html! {
        <div id="style-tab">
            <div id="column-style-container" class="tab-section">
                { components }
            </div>
        </div>
    }
}
