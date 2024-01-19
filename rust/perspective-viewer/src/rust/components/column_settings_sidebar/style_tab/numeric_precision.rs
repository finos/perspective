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

use crate::clone;
use crate::config::{ColumnConfig, FloatColumnConfig, IntColumnConfig, NumericPrecisionOpts, Type};

#[derive(Properties, PartialEq, Clone)]
pub struct PrecisionControlProps {
    pub label: Option<String>,
    pub opts: NumericPrecisionOpts,
    pub on_update: Callback<Option<ColumnConfig>>,
    pub view_type: Type,
}

fn make_label(value: u32) -> String {
    if value > 0 {
        format!("Precision: 0.{}1", "0".repeat((value - 1) as usize))
    } else {
        "Precision: 1".to_string()
    }
}

#[function_component(NumericPrecision)]
pub fn numeric_precision(props: &PrecisionControlProps) -> Html {
    let default_value = props.opts.default;

    // these should be restored_value
    let value = use_state(|| default_value);
    let label = use_state(|| make_label(default_value));

    clone!(props.view_type);
    let oninput = props.on_update.reform(move |event: InputEvent| {
        let raw_value = event.target_unchecked_into::<HtmlInputElement>().value();
        let parsed_value = raw_value
            .split_once('.')
            .map(|(int, _)| int.parse::<u32>())
            .unwrap_or(raw_value.parse::<u32>())
            .unwrap_or_default()
            .min(15);

        match view_type {
            Type::Integer => {
                Some(ColumnConfig::Int(IntColumnConfig {
                    precision: Some(parsed_value),
                    //..Default::default()
                }))
            },
            Type::Float => Some(ColumnConfig::Float(FloatColumnConfig {
                precision: Some(parsed_value),
                //..Default::default(),
            })),
            _ => {
                tracing::error!("CONTROL ERROR: Tried to set precision of non-numeric type!");
                None
            },
        }
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
