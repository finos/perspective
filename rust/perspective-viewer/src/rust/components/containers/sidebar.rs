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

use yew::{function_component, html, AttrValue, Callback, Children, Html, Properties};

#[derive(PartialEq, Clone, Properties)]
pub struct SidebarProps {
    /// The component's children.
    pub children: Children,
    /// When this callback is called, the sidebar will close
    pub on_close: Callback<()>,
    pub title: String,
    pub id_prefix: String,
    pub icon: Option<String>,
}

/// Sidebars are designed to live in a [SplitPanel]
#[function_component]
pub fn Sidebar(p: &SidebarProps) -> Html {
    let id = &p.id_prefix;
    html! {
        <div class="sidebar_column" id={format!("{id}_sidebar")}>
            <SidebarCloseButton
                id={ format!("{id}_close_button") }
                on_close_sidebar={ &p.on_close }
                />
            <div class="sidebar_header" id={format!("{id}_header")}>
                if let Some(id) = p.icon.clone() {
                    <span {id}></span>
                }
                <span class="sidebar_header_title" id={format!("{id}_header_title")}>
                    {p.title.clone()}
                </span>
            </div>
            <div class="sidebar_border" id={format!("{id}_border")}></div>
            <div class="sidebar_content" id={format!("{id}_content")}>
                {p.children.iter().collect::<Html>()}
            </div>
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
