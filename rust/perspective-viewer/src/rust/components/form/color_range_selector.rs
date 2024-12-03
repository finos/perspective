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
pub struct ColorRangeProps {
    pub id: String,
    pub pos_color: String,
    pub neg_color: String,
    pub is_gradient: bool,
    pub on_pos_color: Callback<String>,
    pub on_neg_color: Callback<String>,
}

fn infer_fg(color: &str) -> &'static str {
    let r = i32::from_str_radix(&color[1..3], 16).unwrap() as f64;
    let g = i32::from_str_radix(&color[3..5], 16).unwrap() as f64;
    let b = i32::from_str_radix(&color[5..7], 16).unwrap() as f64;
    if (r * r * 0.299 + g * g * 0.587 + b * b * 0.114).sqrt() > 130.0 {
        "--sign--color:#161616"
    } else {
        "--sign--color:#FFFFFF"
    }
}

#[function_component(ColorRangeSelector)]
pub fn color_chooser_component(props: &ColorRangeProps) -> Html {
    let gradient = use_state_eq(|| {
        (
            props.pos_color.to_owned(),
            props.neg_color.to_owned(),
            false,
        )
    });

    {
        let gradient = gradient.clone();

        use_effect_with(
            (props.neg_color.clone(), props.pos_color.clone()),
            move |(neg_color, pos_color)| {
                let current_gradient = gradient.clone();
                if &current_gradient.0 != pos_color || &current_gradient.1 != neg_color {
                    gradient.set((pos_color.clone(), neg_color.clone(), true));
                }
                || ()
            },
        );
    }

    let on_pos_color = use_callback(
        (gradient.clone(), props.on_pos_color.clone()),
        |event: InputEvent, (gradient, on_pos_color)| {
            let color = event
                .target()
                .unwrap()
                .unchecked_into::<HtmlInputElement>()
                .value();
            gradient.set((color.clone(), gradient.1.to_owned(), true));
            on_pos_color.emit(color);
        },
    );

    let on_neg_color = use_callback(
        (gradient.clone(), props.on_neg_color.clone()),
        |event: InputEvent, (gradient, on_neg_color)| {
            let color = event
                .target()
                .unwrap()
                .unchecked_into::<HtmlInputElement>()
                .value();
            gradient.set((gradient.0.to_owned(), color.clone(), true));
            on_neg_color.emit(color);
        },
    );

    let fg_pos = infer_fg(&gradient.0);
    let fg_neg = infer_fg(&gradient.1);
    let style = if props.is_gradient {
        format!(
            "background:linear-gradient(to right, {} 0%, transparent 50%, {} 100%)",
            gradient.0, gradient.1
        )
    } else {
        format!(
            "background:linear-gradient(to right, {} 0%, {} 50%, {} 50%,  {} 100%)",
            gradient.0, gradient.0, gradient.1, gradient.1
        )
    };

    html! {
        <>
            <label id="color-range-label" />
            <div class="color-gradient-container">
                <div style={fg_pos} class="color-selector">
                    <input
                        id={format!("{}-pos", props.id)}
                        class="parameter pos-color-param"
                        type="color"
                        value={gradient.0.to_owned()}
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
                        value={gradient.1.to_owned()}
                        oninput={on_neg_color}
                    />
                    <label for={format!("{}-neg", props.id)} class="color-label">{ "-" }</label>
                </div>
                if gradient.2 {
                    <span class="reset-default-style" // onclick={props.on_check.clone()}
                    // id={format!("{}-checkbox", props.label.replace(' ', "-"))}
                    />
                } else {
                    <span class="reset-default-style-disabled" // id={format!("{}-checkbox", props.label.replace(' ', "-"))}
                    />
                }
            </div>
        </>
    }
}
