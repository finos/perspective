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

mod row_selector;
mod symbol_pairs;
mod symbol_selector;
mod types;

use std::collections::HashMap;
use std::rc::Rc;

use itertools::Itertools;
use yew::{html, Html, Properties};

use self::types::{SymbolConfig, SymbolKVPair};
use crate::components::column_settings_sidebar::style_tab::symbol::symbol_pairs::PairsList;
use crate::components::style::LocalStyle;
use crate::config::plugin::{PluginConfig, Symbol};
use crate::custom_elements::FilterDropDownElement;
use crate::custom_events::CustomEvents;
use crate::model::{GetPluginConfig, GetViewerConfigModel, UpdatePluginConfig};
use crate::presentation::Presentation;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::ApiFuture;
use crate::{clone, css, derive_model, html_template};

pub fn next_default_symbol(values: &Vec<Symbol>, pairs_len: usize) -> String {
    values
        .get(pairs_len % values.len())
        .map(|s| s.name.clone())
        .unwrap()
}
#[derive(Properties, PartialEq, Clone)]
pub struct SymbolAttrProps {
    pub column_name: String,
    pub session: Session,
    pub renderer: Renderer,
    pub custom_events: CustomEvents,
    pub presentation: Presentation,
}
derive_model!(CustomEvents, Session, Renderer, Presentation for SymbolAttrProps);
impl SymbolAttrProps {
    pub fn get_config(&self) -> (PluginConfig, Vec<Symbol>) {
        let (config, attrs) = (self.get_plugin_config(), self.get_plugin_attrs());
        (
            config.unwrap(),
            attrs
                .ok()
                .and_then(|a| a.symbol.map(|s| s.symbols))
                .unwrap(),
        )
    }
}

pub enum SymbolAttrMsg {
    UpdatePairs(Vec<SymbolKVPair>),
}

pub struct SymbolStyle {
    pairs: Vec<SymbolKVPair>,
    row_dropdown: Rc<FilterDropDownElement>,
}

impl yew::Component for SymbolStyle {
    type Message = SymbolAttrMsg;
    type Properties = SymbolAttrProps;

    fn create(ctx: &yew::Context<Self>) -> Self {
        let p = ctx.props();
        let (config, symbols) = ctx.props().get_config();
        let mut pairs = config
            .columns
            .get(&p.column_name)
            .and_then(|json_val| {
                serde_json::from_value::<SymbolConfig>(json_val.clone())
                    .ok()
                    .map(|s| {
                        s.symbols
                            .into_iter()
                            .map(|s| SymbolKVPair::new(Some(s.0), s.1))
                            .collect_vec()
                    })
            })
            .unwrap_or_default();

        pairs.push(SymbolKVPair::new(
            None,
            next_default_symbol(&symbols, pairs.len()),
        ));
        let row_dropdown = Rc::new(FilterDropDownElement::new(p.session.clone()));
        Self {
            pairs,
            row_dropdown,
        }
    }

    fn update(&mut self, ctx: &yew::Context<Self>, msg: Self::Message) -> bool {
        let p = ctx.props();
        match msg {
            SymbolAttrMsg::UpdatePairs(mut new_pairs) => {
                let serialized = new_pairs
                    .clone()
                    .into_iter()
                    .filter_map(|pair| Some((pair.key?, pair.value)))
                    .collect::<HashMap<_, _>>();
                let serialized = serde_json::to_value(SymbolConfig {
                    symbols: serialized,
                })
                .unwrap();

                if new_pairs
                    .last()
                    .map(|pair| pair.key.is_some())
                    .unwrap_or_default()
                {
                    let (_, symbols) = p.get_config();
                    new_pairs.push(SymbolKVPair::new(
                        None,
                        next_default_symbol(&symbols, new_pairs.len()),
                    ))
                }

                self.pairs = new_pairs;

                clone!(p);
                ApiFuture::spawn(async move {
                    p.send_plugin_config(
                        p.column_name.clone(),
                        Some(serialized),
                        p.get_viewer_config().await?,
                    )?
                    .await
                });
                true
            },
        }
    }

    fn view(&self, ctx: &yew::Context<Self>) -> Html {
        let update_pairs = ctx.link().callback(SymbolAttrMsg::UpdatePairs);
        let (_, values) = ctx.props().get_config();
        html_template! {
            <LocalStyle href={ css!("column-symbol-attributes") } />
            <PairsList
                title="Symbols"
                id="attributes-symbols"
                pairs={ self.pairs.clone() }
                row_dropdown={ self.row_dropdown.clone() }
                { values }
                column_name={ ctx.props().column_name.clone() }
                { update_pairs }/>
        }
    }
}
