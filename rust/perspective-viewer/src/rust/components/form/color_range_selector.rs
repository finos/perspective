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

#[derive(Properties, PartialEq, Clone)]
pub struct ColorRangeProps {
    pub id: String,
    pub pos_color: String,
    pub neg_color: String,
    pub is_gradient: bool,
    pub on_pos_color: Callback<String>,
    pub on_neg_color: Callback<String>,
    pub on_reset: Callback<()>,
    pub is_modified: bool,
}

fn infer_fg(color: &str) -> &'static str {
    let r = i32::from_str_radix(&color[1..3], 16).unwrap_or(255) as f64;
    let g = i32::from_str_radix(&color[3..5], 16).unwrap_or(0) as f64;
    let b = i32::from_str_radix(&color[5..7], 16).unwrap_or(0) as f64;
    if (r * r * 0.299 + g * g * 0.587 + b * b * 0.114).sqrt() > 130.0 {
        "--sign--color:#161616"
    } else {
        "--sign--color:#FFFFFF"
    }
}

#[function_component(ColorRangeSelector)]
pub fn color_chooser_component(props: &ColorRangeProps) -> Html {
    let on_pos_color = use_callback(
        props.on_pos_color.clone(),
        |event: InputEvent, on_pos_color| {
            let color = event
                .target()
                .unwrap()
                .unchecked_into::<HtmlInputElement>()
                .value();
            on_pos_color.emit(color);
        },
    );

    let on_neg_color = use_callback(
        props.on_neg_color.clone(),
        |event: InputEvent, on_neg_color| {
            let color = event
                .target()
                .unwrap()
                .unchecked_into::<HtmlInputElement>()
                .value();
            on_neg_color.emit(color);
        },
    );

    let fg_pos = infer_fg(&props.pos_color);
    let fg_neg = infer_fg(&props.neg_color);
    let style = if props.is_gradient {
        format!(
            "background:linear-gradient(to right, {} 0%, transparent 50%, {} 100%)",
            props.pos_color, props.neg_color
        )
    } else {
        format!(
            "background:linear-gradient(to right, {} 0%, {} 50%, {} 50%,  {} 100%)",
            props.pos_color, props.pos_color, props.neg_color, props.neg_color
        )
    };

    let on_reset = use_callback(props.clone(), |_: MouseEvent, deps| deps.on_reset.emit(()));

    html! {
        <>
            <label id="color-range-label" />
            <div class="color-gradient-container">
                <div style={fg_pos} class="color-selector">
                    <input
                        id={format!("{}-pos", props.id)}
                        class="parameter pos-color-param"
                        type="color"
                        value={props.pos_color.to_owned()}
                        data-value={props.pos_color.to_owned()}
                        oninput={on_pos_color}
                    />
                    <label for={format!("{}-pos", props.id)} class="color-label">{ "+" }</label>
                </div>
                <div class="color-thermometer" {style} />
                <div style={fg_neg} class="color-selector">
                    <input
                        id={format!("{}-neg", props.id)}
                        class="parameter neg-color-param"
                        type="color"
                        value={props.neg_color.to_owned()}
                        data-value={props.neg_color.to_owned()}
                        oninput={on_neg_color}
                    />
                    <label for={format!("{}-neg", props.id)} class="color-label">{ "-" }</label>
                </div>
                if props.is_modified { <span class="reset-default-style" onclick={on_reset} /> } else {
                    <span class="reset-default-style-disabled" />
                }
            </div>
        </>
    }
}
