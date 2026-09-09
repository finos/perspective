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

use web_sys::MouseEvent;
use yew::prelude::*;

/// A single command row in a `ContextMenu`.
#[derive(Clone, PartialEq)]
pub struct ContextMenuItem {
    pub label: String,
    pub on_select: Callback<()>,
    pub disabled: bool,
}

/// A row in a `ContextMenu`: a plain command `ContextMenuItem`, a
/// non-interactive group label, or a row with a hover-opened sub-menu flyout.
#[derive(Clone, PartialEq)]
pub enum ContextMenuEntry {
    Item(ContextMenuItem),
    Header(String),

    /// Arbitrary content rendered in place, whose own handlers must close
    /// the menu.
    Custom(Html),
    Submenu {
        label: String,

        on_select: Option<Callback<()>>,
        entries: Vec<ContextMenuEntry>,
    },
}

#[derive(Properties, PartialEq)]
pub struct ContextMenuProps {
    pub entries: Vec<ContextMenuEntry>,

    #[prop_or_default]
    pub on_close: Callback<()>,
}

/// The command-item list of a panel context menu.
pub struct ContextMenu;

impl Component for ContextMenu {
    type Message = ();
    type Properties = ContextMenuProps;

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let props = ctx.props();
        let entries = props
            .entries
            .iter()
            .map(|entry| render_entry(entry, &props.on_close));

        html! { <div class="context-menu">{ for entries }</div> }
    }
}

fn render_entry(entry: &ContextMenuEntry, on_close: &Callback<()>) -> Html {
    match entry {
        ContextMenuEntry::Item(item) => {
            let disabled = item.disabled;
            let onclick = {
                let on_select = item.on_select.clone();
                let on_close = on_close.clone();
                Callback::from(move |e: MouseEvent| {
                    e.stop_propagation();
                    if !disabled {
                        on_select.emit(());
                        on_close.emit(());
                    }
                })
            };

            let mut class = classes!("context-menu-item");
            if disabled {
                class.push("disabled");
            }

            html! { <span {class} {onclick}>{ item.label.clone() }</span> }
        },
        ContextMenuEntry::Header(label) => {
            html! { <span class="context-menu-header">{ label.clone() }</span> }
        },
        ContextMenuEntry::Custom(content) => content.clone(),
        ContextMenuEntry::Submenu {
            label,
            on_select,
            entries,
        } => {
            let onclick = {
                let on_select = on_select.clone();
                let on_close = on_close.clone();
                Callback::from(move |e: MouseEvent| {
                    e.stop_propagation();
                    if let Some(on_select) = &on_select {
                        on_select.emit(());
                        on_close.emit(());
                    }
                })
            };

            let children = entries.iter().map(|entry| render_entry(entry, on_close));
            html! {
                <span class="context-menu-item has-submenu" {onclick}>
                    { label.clone() }
                    <div class="context-menu context-menu-submenu">{ for children }</div>
                </span>
            }
        },
    }
}
