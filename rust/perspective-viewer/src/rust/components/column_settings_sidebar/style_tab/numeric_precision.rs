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

use web_sys::{HtmlInputElement, InputEvent};
use yew::{function_component, html, use_state, Callback, Html, Properties, TargetCast};

use crate::config::ColumnStyleValue;

#[derive(Properties, PartialEq, Clone)]
pub struct PrecisionControlProps {
    pub label: String,
    pub default: u32,
    pub on_update: Callback<(String, Option<ColumnStyleValue>)>,
}

fn make_label(label: &str, value: u32) -> String {
    if value > 0 {
        format!("{label}: 0.{}1", "0".repeat((value - 1) as usize))
    } else {
        format!("{label}: 1")
    }
}

#[function_component(NumericPrecision)]
pub fn numeric_precision(props: &PrecisionControlProps) -> Html {
    let default_value = props.default;

    // these should be restored_value
    let value = use_state(|| default_value);
    let label = use_state(|| make_label(&props.label, default_value));

    let plabel = props.label.clone();
    let oninput = props.on_update.reform(move |event: InputEvent| {
        let raw_value = event.target_unchecked_into::<HtmlInputElement>().value();
        let parsed_value = raw_value
            .split_once('.')
            .map(|(int, _)| int.parse::<u32>())
            .unwrap_or(raw_value.parse::<u32>())
            .unwrap_or_default()
            .min(15);

        (
            plabel.clone(),
            (parsed_value != default_value)
                .then_some(ColumnStyleValue::NumericPrecision(parsed_value)),
        )
    });

    html! {
            <div id="precision-control">
                <label for="precision-control-input">{(*label).clone()}</label>
                <div class="row section">
                    <input
                        id="fixed-param"
                        class="parameter"
                        type="number"
                        min={0}
                        max={15}
                        {oninput}
                        value={(*value).to_string()} />
                </div>
            </div>
    }
}
