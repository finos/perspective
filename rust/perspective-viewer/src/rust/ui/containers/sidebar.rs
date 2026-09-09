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

use perspective_client::clone;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::Closure;
use web_sys::HtmlElement;
use yew::{
    Callback, Children, Html, Properties, function_component, html, use_effect_with, use_mut_ref,
    use_node_ref,
};

use crate::js::{ResizeObserver, ResizeObserverEntry};
use crate::ui::containers::sidebar_close_button::SidebarCloseButton;

#[derive(PartialEq, Clone, Properties)]
pub struct SidebarProps {
    pub children: Children,

    pub on_close: Callback<()>,
    pub id_prefix: String,
    pub width_override: Option<i32>,
    pub selected_tab: Option<usize>,
    pub header: Html,

    #[prop_or_default]
    pub auto_width: f64,

    #[prop_or_default]
    pub on_auto_width: Callback<f64>,

    #[prop_or_default]
    pub is_pinned: bool,

    #[prop_or_default]
    pub on_toggle_pin: Option<Callback<()>>,
}

/// Sidebars are designed to live in a `SplitPanel`.
#[function_component]
pub fn Sidebar(p: &SidebarProps) -> Html {
    let id = &p.id_prefix;
    let noderef = use_node_ref();

    let live_props = use_mut_ref(|| (Callback::<f64>::default(), None::<i32>));
    *live_props.borrow_mut() = (p.on_auto_width.clone(), p.width_override);
    use_effect_with((), {
        clone!(noderef, live_props);
        move |_| {
            let closure =
                Closure::<dyn FnMut(js_sys::Array)>::new(move |entries: js_sys::Array| {
                    let (on_auto_width, width_override) = live_props.borrow().clone();
                    if width_override.is_none() {
                        for entry in entries.iter() {
                            let entry: ResizeObserverEntry = entry.unchecked_into();
                            on_auto_width.emit(entry.content_rect().width());
                        }
                    }
                });

            let observer = ResizeObserver::new(closure.as_ref().unchecked_ref());
            let elem = noderef.cast::<HtmlElement>();
            if let Some(elem) = &elem {
                observer.observe(elem);
            }

            move || {
                if let Some(elem) = &elem {
                    observer.unobserve(elem);
                }

                drop(closure);
            }
        }
    });

    let auto_width = if p.width_override.is_none() {
        p.auto_width
    } else {
        0.0
    };

    let width_style = format!("min-width: 200px; width: {}px", auto_width);
    let pin_button = p.on_toggle_pin.as_ref().map(|cb| {
        let onclick = {
            let cb = cb.clone();
            Callback::from(move |_: web_sys::MouseEvent| cb.emit(()))
        };

        let mut class = yew::classes!("sidebar_pin_button");
        if p.is_pinned {
            class.push("is-pinned");
        }

        html! {
            <span
                id={format!("{id}_pin_button")}
                {class}
                title={if p.is_pinned { "Unpin" } else { "Pin" }}
                {onclick}
            />
        }
    });

    html! {
        <>
            <SidebarCloseButton id={format!("{id}_close_button")} on_close_sidebar={&p.on_close} />
            <div class="sidebar_column" id={format!("{id}_sidebar")} ref={noderef}>
                <div class="sidebar_header">{ p.header.clone() }{ pin_button }</div>
                <div class="sidebar_border" id={format!("{id}_border")} />
                { p.children.iter().collect::<Html>() }
                <div class="sidebar-auto-width" style={width_style} />
            </div>
        </>
    }
}
