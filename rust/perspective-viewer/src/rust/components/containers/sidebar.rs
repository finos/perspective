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

use web_sys::Element;
use yew::{
    function_component, html, use_effect_with, use_node_ref, use_state_eq, AttrValue, Callback,
    Children, Html, Properties,
};

use crate::clone;

#[derive(PartialEq, Clone, Properties)]
pub struct SidebarProps {
    /// The component's children.
    pub children: Children,

    /// When this callback is called, the sidebar will close
    pub on_close: Callback<()>,
    pub title: String,
    pub id_prefix: String,
    pub icon: Option<String>,
    pub width_override: Option<i32>,
    pub selected_tab: Option<usize>,
}

/// Sidebars are designed to live in a [SplitPanel]
#[function_component]
pub fn Sidebar(p: &SidebarProps) -> Html {
    let id = &p.id_prefix;
    let noderef = use_node_ref();
    let auto_width = use_state_eq(|| 0f64);

    // this gets the last calculated width and ensures that
    // the auto-width element is at least that big.
    // this ensures the panel grows but does not shrink.
    use_effect_with((p.children.clone(), p.selected_tab), {
        clone!(noderef, auto_width, p.width_override);
        move |_| {
            if width_override.is_none() {
                let updated_width = noderef
                    .cast::<Element>()
                    .map(|el| el.get_bounding_client_rect().width())
                    .unwrap_or_default();
                auto_width.set((*auto_width).max(updated_width));
            } else {
                auto_width.set(0f64);
            }
        }
    });

    let width_style = format!("min-width: 200px; width: {}px", *auto_width);
    html! {
        <div class="sidebar_column" id={ format!("{id}_sidebar") } ref={ noderef }>
            <SidebarCloseButton
                id={ format!("{id}_close_button") }
                on_close_sidebar={ &p.on_close }/>
            <div class="sidebar_header" id={ format!("{id}_header") }>
                if let Some(id) = p.icon.clone() {
                    <span { id }></span>
                }

                <span class="sidebar_header_title" id={ format!("{id}_header_title") }>
                    { p.title.clone() }
                </span>
            </div>
            <div class="sidebar_border" id={ format!("{id}_border") }></div>
            <div class="sidebar_content" id={ format!("{id}_content") }>
                { p.children.iter().collect::<Html>() }
            </div>
            <div class="sidebar-auto-width" style={ width_style }></div>
        </div>
    }
}

#[derive(PartialEq, Clone, Properties)]
pub struct SidebarCloseButtonProps {
    pub on_close_sidebar: Callback<()>,
    pub id: AttrValue,
}

#[function_component]
pub fn SidebarCloseButton(p: &SidebarCloseButtonProps) -> Html {
    let onclick = yew::use_callback(p.on_close_sidebar.clone(), |_, cb| cb.emit(()));
    let id = &p.id;
    html! {
        <div { onclick } { id } class="sidebar_close_button"></div>
    }
}
