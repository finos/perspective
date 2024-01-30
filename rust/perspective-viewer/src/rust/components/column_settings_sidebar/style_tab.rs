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

// pub mod color;
// pub mod numeric_precision;
// pub mod radio;
pub mod stub;
mod symbol;

use yew::{function_component, html, Html, Properties};

use crate::components::column_settings_sidebar::style_tab::stub::Stub;
use crate::components::column_settings_sidebar::style_tab::symbol::SymbolStyle;
use crate::components::datetime_column_style::DatetimeColumnStyle;
use crate::components::number_column_style::NumberColumnStyle;
use crate::components::string_column_style::StringColumnStyle;
use crate::config::{ColumnStyleOpts, ColumnStyleValue, Type, ViewConfigUpdate};
use crate::custom_events::CustomEvents;
use crate::model::{PluginColumnStyles, UpdateAndRender};
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
    fn send_plugin_config(
        &self,
        column_name: String,
        label: String,
        config: Option<ColumnStyleValue>,
    ) {
        clone!(props = self);
        ApiFuture::spawn(async move {
            // unwrapping the type is safe, we're guaranteed to have a view type by now
            let detail = serde_wasm_bindgen::to_value(&config).unwrap();
            props
                .presentation
                .update_column_styles(column_name, props.ty.unwrap(), label, config);
            let column_configs = props.presentation.all_column_configs();
            let plugin_config = props.renderer.get_active_plugin()?.save();
            props
                .renderer
                .get_active_plugin()?
                .restore(&plugin_config, Some(&column_configs));
            props.update_and_render(ViewConfigUpdate::default()).await?;
            props.custom_events.dispatch_column_style_changed(&detail);
            Ok(())
        })
    }
}

#[function_component]
pub fn StyleTab(props: &StyleTabProps) -> Html {
    let on_change = yew::use_callback(
        props.clone(),
        |(label, config): (String, Option<ColumnStyleValue>), props| {
            props.send_plugin_config(props.column_name.clone(), label, config);
        },
    );

    let control_opts = props.get_column_style_control_options(&props.column_name);
    let components = match control_opts {
        Ok(opts) => opts
            .into_iter()
            .map(|(label, layout)| {
                let on_change = {
                    clone!(label);
                    on_change.reform(move |config| {(label.clone(), config)})
                };
                match layout {
                    ColumnStyleOpts::NumberColumnStyle(default_config) => {
                        html! {
                            <NumberColumnStyle
                                session={props.session.clone()}
                                column_name={props.column_name.clone()}
                                config={None}
                                {default_config}
                                {on_change} />
                        }
                    },
                    ColumnStyleOpts::StringColumnStyle(default_config) => {
                        html! {
                            <StringColumnStyle config={None} {default_config} {on_change} />
                        }
                    },
                    ColumnStyleOpts::DatetimeColumnStyle(default_config) => {
                        let enable_time_config = props.ty.unwrap() == Type::Datetime;
                        html! {
                            <DatetimeColumnStyle {enable_time_config} config={None} {default_config} {on_change} />
                        }
                    },
                    ColumnStyleOpts::KeyValuePair { keys, values } => {
                        let current_config = props.presentation.get_column_styles(&props.column_name);
                        let restored_config = current_config.and_then(|config| {
                            let value = config.get(props.ty.as_ref().unwrap())?.get(&label)?.clone();
                            if let ColumnStyleValue::KeyValuePair(val) = value {
                                Some(val)
                            } else {
                                None
                            }
                        }).unwrap_or_default();
                        
                        html! {
                            <SymbolStyle
                                {keys}
                                {values}
                                {restored_config}
                                {on_change}
                                column_name={props.column_name.clone()}
                                session={props.session.clone()}
                                />
                        }
                    }
                }
            })
            .collect::<Html>(),
        Err(e) => {
            html! {
                <Stub message="No plugin styles available" error={format!("{e:?}")} />
            }
        },
    };

    html! {
        <div
            id="style-tab"
        >
            <div id="column-style-container" class="tab-section">{ components }</div>
        </div>
    }
}
