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

use std::collections::HashSet;
use std::rc::Rc;

use itertools::Itertools;
use yew::{function_component, html, Html, Properties};

use super::symbol_pairs::KVPair;
use crate::clone;
use crate::components::empty_row::EmptyRow;
use crate::custom_elements::RowDropDownElement;

#[derive(Properties, PartialEq)]
pub struct RowSelectorProps {
    pub selected_row: Option<String>,
    pub on_select: yew::Callback<String>,
    pub row_dropdown: Rc<RowDropDownElement>,
    pub pairs: Vec<KVPair>,
    pub index: usize,
    pub focused: bool,
    pub set_focused_index: yew::Callback<Option<usize>>,
}

#[function_component(RowSelector)]
pub fn row_selector(p: &RowSelectorProps) -> Html {
    let on_select = {
        clone!(p.row_dropdown, p.index, p.set_focused_index);
        p.on_select.reform(move |key| {
            row_dropdown.hide().unwrap();
            set_focused_index.emit(Some(index + 1));
            key
        })
    };

    let ondblclick = {
        clone!(p.set_focused_index, p.index);
        yew::Callback::from(move |_| {
            set_focused_index.emit(Some(index));
        })
    };

    let err_class = (p.index != p.pairs.len() - 1).then_some("row-selector-errored");

    let inner = if p.selected_row.is_none() || p.focused {
        let mut pairs = p.pairs.clone();
        if let Some(ref rowval) = p.selected_row {
            if let Some((i, _)) = pairs.iter().find_position(|pair| {
                pair.key
                    .as_ref()
                    .map(|keyval| keyval == rowval)
                    .unwrap_or_default()
            }) {
                pairs.remove(i);
            }
        }
        let exclude: HashSet<_> = pairs
            .into_iter()
            .filter_map(|KVPair { key, .. }| key)
            .collect();
        html! {
            <div class={err_class}>
                <EmptyRow
                    row_dropdown={p.row_dropdown.clone()}
                    { exclude }
                    {on_select}
                    focused={p.focused}
                    index={p.index}
                    set_focused_index={p.set_focused_index.clone()}
                    value={p.selected_row.clone().unwrap_or_default()}
                />
            </div>
        }
    } else {
        html! {
            <div class="row-selector column-selector-column">
                <div class="column-selector-column-border">
                    <span class="column_name none" {ondblclick}>
                        {p.selected_row.clone().unwrap()}
                    </span>
                </div>
            </div>
        }
    };

    html! {
        <div class="row-selector">
            {inner}
        </div>
    }
}
