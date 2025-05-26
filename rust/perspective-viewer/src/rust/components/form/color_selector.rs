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

use wasm_bindgen::JsCast;
use web_sys::*;
use yew::prelude::*;

#[derive(Properties, PartialEq)]
pub struct ColorProps {
    pub color: String,
    pub on_color: Callback<String>,
    pub on_reset: Callback<()>,
    pub is_modified: bool,

    #[prop_or_default]
    pub title: Option<String>,
}

#[function_component(ColorSelector)]
pub fn color_component(props: &ColorProps) -> Html {
    let oninput = use_callback(props.on_color.clone(), |event: InputEvent, deps| {
        let color = event
            .target()
            .unwrap()
            .unchecked_into::<HtmlInputElement>()
            .value();
        deps.emit(color);
    });

    let on_reset = use_callback(props.on_reset.clone(), |_: MouseEvent, on_reset| {
        on_reset.emit(())
    });

    html! {
        <>
            <label id={props.title.as_deref().unwrap_or("color-label").to_owned()} />
            <div class="color-gradient-container">
                <input class="parameter" type="color" value={props.color.to_owned()} {oninput} />
                if props.is_modified { <span class="reset-default-style" onclick={on_reset} /> } else {
                    <span class="reset-default-style-disabled" />
                }
            </div>
        </>
    }
}
