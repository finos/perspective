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

// mod column_style;
pub mod color;
pub mod numeric_precision;
pub mod radio;
pub mod stub;
// mod symbol;

use yew::{function_component, html, Html, Properties};

use crate::components::column_settings_sidebar::style_tab::color::ColorControl;
// use crate::components::column_settings_sidebar::style_tab::column_style::ColumnStyle;
use crate::components::column_settings_sidebar::style_tab::numeric_precision::NumericPrecision;
use crate::components::column_settings_sidebar::style_tab::stub::Stub;
// use crate::components::column_settings_sidebar::style_tab::symbol::SymbolStyle;
use crate::config::{ColumnConfig, ColumnConfigValueUpdate, ControlName, ControlOptions, Type};
use crate::custom_events::CustomEvents;
use crate::model::PluginColumnStyles;
use crate::presentation::Presentation;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::ApiFuture;
use crate::{clone, derive_model};

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

impl StyleTabProps {
    fn send_plugin_config2(&self, column_name: String, config: ColumnConfig) {
        tracing::error!("send_plugin_config2: column_name={column_name:?}\nconfig={config:?}");
        clone!(self.renderer, self.presentation);
        ApiFuture::spawn(async move {
            // NOTE: Column config values should be of form e.g. {"numeric-precision": 3,
            // "color": {blah}}
            presentation.update_column_config_value(
                column_name.to_owned(),
                ColumnConfigValueUpdate(config.clone()),
            );
            let column_configs = presentation.all_column_configs();
            let plugin_config = renderer.get_active_plugin()?.save();
            renderer
                .get_active_plugin()?
                .restore(&plugin_config, Some(&column_configs));
            Ok(())
        })
    }
}

#[function_component]
pub fn StyleTab(props: &StyleTabProps) -> Html {
    // this is safe because we're guaranted to have a view type by now
    let view_type = props.ty.unwrap();

    let on_update = yew::use_callback(props.clone(), |config: Option<ColumnConfig>, props| {
        if let Some(config) = config {
            props.send_plugin_config2(props.column_name.clone(), config);
        }
    });

    let control_opts = props.get_column_style_control_options(&props.column_name);
    let components = match control_opts {
        Ok(opts) => opts
            .into_iter()
            .map(|opt| match (opt.control, opt.options) {
                (ControlName::Color, Some(ControlOptions::Color(opts))) => {
                    html! {
                        <ColorControl label={opt.label} {opts} on_update={on_update.clone()} />
                    }
                },
                (ControlName::DatetimeStringFormat, None) => {
                    html! {<p>{"todo"}</p>}
                },
                (ControlName::NumericPrecision, Some(ControlOptions::NumericPrecision(opts))) => {
                    html! {
                        <NumericPrecision {view_type} label={opt.label} {opts} on_update={on_update.clone()} />
                    }
                },
                (ControlName::Radio, Some(ControlOptions::Vec(opts))) => {
                    html! {<p>{"todo"}</p>}
                },
                (ControlName::Dropdown, Some(ControlOptions::Vec(opts))) => {
                    html! {<p>{"todo"}</p>}
                },
                (ControlName::KeyValuePair, Some(ControlOptions::KvPair(opts))) => {
                    html! {<p>{"todo"}</p>}
                }
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

    html! {
        <div id="style-tab">
            <div id="column-style-container" class="tab-section">
                { components }
            </div>
        </div>
    }
}
