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
use yew::*;

#[derive(Properties)]
pub struct TrapDoorPanelProps {
    pub id: Option<&'static str>,
    pub class: Option<&'static str>,
    pub children: Children,
}

impl PartialEq for TrapDoorPanelProps {
    fn eq(&self, _other: &Self) -> bool {
        false
    }
}

/// A simple panel with an invisible inner `<div>` which stretches to fit the
/// width of the container, but will not shrink (unless the state is reset).
#[function_component(TrapDoorPanel)]
pub fn trap_door_panel(props: &TrapDoorPanelProps) -> Html {
    let sizer = use_node_ref();
    let width = use_state_eq(|| 0.0);
    use_effect({
        clone!(width, sizer);
        move || {
            width.set(
                sizer
                    .cast::<web_sys::HtmlElement>()
                    .unwrap()
                    .get_bounding_client_rect()
                    .width(),
            )
        }
    });

    html! {
        <div id={props.id} class={props.class} ref={sizer}>
            { props.children.clone() }
            <div class="scroll-panel-auto-width" style={format!("width:{}px", *width)} />
        </div>
    }
}
