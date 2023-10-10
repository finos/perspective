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

use std::rc::Rc;

use itertools::Itertools;
use serde::{Deserialize, Serialize};
use yew::{html, Html, Properties};

use crate::components::column_settings_sidebar::style_tab::symbol::symbol_pairs::{
    KVPair, PairsList,
};
use crate::components::style::LocalStyle;
use crate::config::plugin::{PluginConfig, SymbolAttributes};
use crate::config::Type;
use crate::custom_elements::RowDropDownElement;
use crate::custom_events::CustomEvents;
use crate::model::UpdatePluginConfig;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::{css, derive_model, html_template};

#[derive(Properties, PartialEq, Clone)]
pub struct SymbolAttrProps {
    pub attr_type: Type,
    pub attrs: SymbolAttributes,
    pub column_name: String,
    pub config: PluginConfig,
    pub session: Session,
    pub renderer: Renderer,
    pub custom_events: CustomEvents,
}
derive_model!(CustomEvents, Session, Renderer for SymbolAttrProps);

#[derive(Serialize, Deserialize)]
struct SymbolConfig {
    symbols: Vec<KVPair>,
}

pub enum SymbolAttrMsg {
    UpdatePairs(Vec<KVPair>),
}

pub struct SymbolAttr {
    pairs: Vec<KVPair>,
    all_symbol_names: Vec<String>,
    row_dropdown: Rc<RowDropDownElement>,
}

impl yew::Component for SymbolAttr {
    type Message = SymbolAttrMsg;
    type Properties = SymbolAttrProps;

    fn create(ctx: &yew::Context<Self>) -> Self {
        let p = ctx.props();
        let all_symbol_names = p.attrs.symbols.iter().map(|s| s.name.clone()).collect_vec();
        let mut pairs = p
            .config
            .columns
            .get(&p.column_name)
            .and_then(|json_val| {
                serde_json::from_value::<SymbolConfig>(json_val.clone())
                    .ok()
                    .map(|s| s.symbols)
            })
            .unwrap_or_default();
        pairs.push(KVPair::new(None, all_symbol_names.first().cloned()));
        let row_dropdown = Rc::new(RowDropDownElement::new(
            p.session.clone(),
            p.column_name.clone(),
        ));
        Self {
            pairs,
            all_symbol_names,
            row_dropdown,
        }
    }

    fn update(&mut self, ctx: &yew::Context<Self>, msg: Self::Message) -> bool {
        let p = ctx.props();
        match msg {
            SymbolAttrMsg::UpdatePairs(mut new_pairs) => {
                let serialized = new_pairs
                    .iter()
                    .filter(|KVPair { key, .. }| key.is_some())
                    .cloned()
                    .collect();
                p.send_plugin_config(
                    p.column_name.clone(),
                    serde_json::to_value(SymbolConfig {
                        symbols: serialized,
                    })
                    .unwrap(),
                );
                if new_pairs
                    .last()
                    .map(|pair| pair.key.is_some())
                    .unwrap_or_default()
                {
                    new_pairs.push(KVPair::new(None, self.all_symbol_names.first().cloned()))
                }
                self.pairs = new_pairs;
                true
            }
        }
    }

    fn view(&self, ctx: &yew::Context<Self>) -> Html {
        let update_pairs = ctx.link().callback(SymbolAttrMsg::UpdatePairs);
        html_template! {
            <LocalStyle href={css!("column-symbol-attributes")} />
            <PairsList
                title={ "Symbols" }
                id = {"attributes-symbols"}
                pairs={self.pairs.clone()}
                row_dropdown={self.row_dropdown.clone()}
                values={ctx.props().attrs.symbols.clone()}
                {update_pairs}
            />
        }
    }
}
