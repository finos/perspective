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

pub mod color;
pub mod numeric_precision;
pub mod radio;
pub mod stub;

use yew::{function_component, html, Html, Properties};

use crate::components::column_settings_sidebar::style_tab::color::ColorControl;
use crate::components::column_settings_sidebar::style_tab::numeric_precision::NumericPrecision;
use crate::components::column_settings_sidebar::style_tab::stub::Stub;
use crate::config::{ColumnStyleOpts, ColumnStyleValue, Type};
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
    fn send_plugin_config2(
        &self,
        column_name: String,
        label: String,
        config: Option<ColumnStyleValue>,
    ) {
        tracing::error!("send_plugin_config2: column_name={column_name:?}\nconfig={config:?}");
        clone!(self.renderer, self.presentation, self.ty);
        ApiFuture::spawn(async move {
            // unwrapping the type is safe, we're guaranteed to have a view type by now
            presentation.update_column_styles(column_name, ty.unwrap(), label, config);
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
    let on_update = yew::use_callback(
        props.clone(),
        |(label, config): (String, Option<ColumnStyleValue>), props| {
            props.send_plugin_config2(props.column_name.clone(), label, config);
        },
    );

    let control_opts = props.get_column_style_control_options(&props.column_name);
    let components = match control_opts {
        Ok(opts) => opts
            .into_iter()
            .map(|(label, opt)| match opt {
                ColumnStyleOpts::Color { modes } => {
                    html! {
                        <ColorControl
                            session={props.session.clone()}
                            column_name={props.column_name.clone()}
                            {label}
                            {modes}
                            on_update={on_update.clone()} />
                    }
                },
                ColumnStyleOpts::DatetimeStringFormat => {
                    html! {<p>{"todo"}</p>}
                },
                ColumnStyleOpts::NumericPrecision { default } => {
                    html! {
                        <NumericPrecision {label} {default} on_update={on_update.clone()} />
                    }
                },
                ColumnStyleOpts::Radio { values } => {
                    html! {<p>{"todo"}</p>}
                },
                ColumnStyleOpts::Dropdown { values } => {
                    html! {<p>{"todo"}</p>}
                },
                ColumnStyleOpts::KeyValuePair { keys, values } => {
                    html! {<p>{"todo"}</p>}
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
