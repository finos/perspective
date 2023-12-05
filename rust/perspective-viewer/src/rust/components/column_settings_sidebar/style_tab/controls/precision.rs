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
use yew::{function_component, html, use_callback, use_state, Html, Properties, TargetCast};

use crate::config::{ColumnConfig, ColumnConfigUpdate, FloatColumnConfig, IntColumnConfig, Type};
use crate::presentation::Presentation;

#[derive(Properties, PartialEq, Clone)]
pub struct PrecisionControlProps {
    pub presentation: Presentation,
    pub column_name: String,
    pub view_type: Type,
}

fn make_label(value: u32) -> String {
    if value > 0 {
        format!("Precision: 0.{}1", "0".repeat((value - 1) as usize))
    } else {
        "Precision: 1".to_string()
    }
}

#[function_component(PrecisionControl)]
pub fn precision_control(p: &PrecisionControlProps) -> Html {
    let restored_value = p
        .presentation
        .get_column_config(&p.column_name)
        .and_then(|t| match t {
            ColumnConfig::Float(val) => val.precision,
            ColumnConfig::Int(val) => val.precision,
            _ => {
                tracing::error!(
                    "CONTROL ERROR: Tried to create precision control for non-numeric type!"
                );
                None
            },
        })
        .unwrap_or_default();

    let value = use_state(|| restored_value);
    let label = use_state(|| make_label(restored_value));

    let oninput = use_callback(
        (value.clone(), label.clone(), p.clone()),
        move |event: InputEvent, (value, label, p)| {
            let raw_value = event.target_unchecked_into::<HtmlInputElement>().value();
            let parsed_value = raw_value
                .split_once('.')
                .map(|(int, _)| int.parse::<u32>())
                .unwrap_or(raw_value.parse::<u32>())
                .unwrap_or_default()
                .min(15);

            value.set(parsed_value);
            label.set(make_label(parsed_value));

            let config = match p.view_type {
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
            };

            if let Some(config) = config {
                p.presentation
                    .update_column_config(p.column_name.clone(), ColumnConfigUpdate(config));
            }
        },
    );
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
