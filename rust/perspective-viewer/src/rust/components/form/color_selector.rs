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

    #[prop_or_default]
    pub title: Option<String>,
}

#[function_component(ColorSelector)]
pub fn color_component(props: &ColorProps) -> Html {
    let changed = use_state(|| props.color.clone());
    let oninput = use_callback(
        (changed.clone(), props.on_color.clone()),
        |event: InputEvent, deps| {
            let color = event
                .target()
                .unwrap()
                .unchecked_into::<HtmlInputElement>()
                .value();
            deps.0.set(color.clone());
            deps.1.emit(color);
        },
    );

    html! {
        <>
            <label style="font-size: 9px">{ props.title.as_deref().unwrap_or("Color") }</label>
            <div class="color-gradient-container">
                <input class="parameter" type="color" value={props.color.to_owned()} {oninput} />
                if *changed != props.color {
                    <span class="reset-default-style" />
                    // onclick={props.on_check.clone()}
                    // id={format!("{}-checkbox", props.label.replace(' ', "-"))}
                } else {
                    <span class="reset-default-style-disabled" />
                    // id={format!("{}-checkbox", props.label.replace(' ', "-"))}
                }
            </div>
        </>
    }
}
