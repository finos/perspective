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
mod symbol;

use yew::{function_component, html, Html, Properties};

use crate::components::column_settings_sidebar::style_tab::column_style::ColumnStyle;
use crate::components::column_settings_sidebar::style_tab::symbol::SymbolAttr;
use crate::config::plugin::{PluginAttributes, PluginConfig};
use crate::config::Type;
use crate::custom_events::CustomEvents;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::JsValueSerdeExt;

#[derive(Clone, PartialEq, Properties)]
pub struct StyleTabProps {
    pub custom_events: CustomEvents,
    pub session: Session,
    pub renderer: Renderer,

    pub ty: Type,
    pub column_name: String,
    pub config: PluginConfig,
    pub attrs: PluginAttributes,
}

#[function_component]
pub fn StyleTab(p: &StyleTabProps) -> Html {
    let plugin = p.renderer.get_active_plugin().expect("No active plugins!");
    let plugin_column_names = plugin
        .config_column_names()
        .map(|arr| {
            arr.into_serde_ext::<Vec<Option<String>>>()
                .expect("Could not deserialize config_column_names into Vec<Option<String>>")
        })
        .unwrap_or_default();

    let view_config = p.session.get_view_config();

    let components = plugin_column_names
        .iter()
        .zip(&view_config.columns)
        .filter_map(|(ty, name)| {
            let attr_type = p
                .session
                .metadata()
                .get_column_view_type(&p.column_name)
                .expect("Couldn't get column type for {column_name}");
            let zipped = ty.as_deref().zip(name.as_deref());
            match zipped {
                Some(("Symbol", name)) if name == p.column_name => {
                    let attrs = p.attrs.symbol.clone().unwrap();
                    Some(html! {
                        <SymbolAttr
                            { attr_type }
                            column_name={ p.column_name.clone() }
                            session={ &p.session }
                            renderer={ &p.renderer }
                            custom_events={ &p.custom_events }
                            { attrs }
                            config={ p.config.clone() }
                        />
                    })
                }
                _ => None,
            }
        })
        .map(|html| html! {<div class="tab-section">{html}</div>})
        .collect::<Html>();

    html! {
        <div id="style-tab">
            <div class="tab-section">
                <ColumnStyle
                    custom_events={p.custom_events.clone()}
                    session={p.session.clone()}
                    renderer={p.renderer.clone()}
                    ty = {p.ty}
                    column_name = {p.column_name.clone()}
                    config ={  p.config.clone() }
                    attrs = {p.attrs.clone()}
                />
            </div>
            {components}
        </div>
    }
}
