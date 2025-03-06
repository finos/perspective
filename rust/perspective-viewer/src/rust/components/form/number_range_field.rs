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

use web_sys::HtmlInputElement;
use yew::{Callback, Properties, function_component, html, use_callback, use_node_ref};

use crate::components::form::optional_field::OptionalField;

#[derive(Properties, Debug, PartialEq, Clone)]
pub struct NumberRangeFieldProps {
    pub label: String,
    pub current_value: Option<(f64, f64)>,
    pub default: (f64, f64),
    pub on_change: Callback<Option<(f64, f64)>>,

    #[prop_or_default]
    pub min: Option<f64>,

    #[prop_or_default]
    pub max: Option<f64>,

    #[prop_or_default]
    pub step: Option<f64>,
}

#[function_component(NumberRangeField)]
pub fn number_range_field(props: &NumberRangeFieldProps) -> yew::Html {
    let ref1 = use_node_ref();
    let ref2 = use_node_ref();
    let parse_number_input = use_callback(
        (ref1.clone(), ref2.clone(), props.on_change.clone()),
        |_, deps| {
            deps.2.emit(Some((
                deps.0.cast::<HtmlInputElement>().unwrap().value_as_number(),
                deps.1.cast::<HtmlInputElement>().unwrap().value_as_number(),
            )));
        },
    );

    html! {
        <OptionalField
            label={props.label.clone()}
            on_check={props.on_change.reform(|_| None)}
            checked={props.current_value.map(|val| val != props.default).unwrap_or_default()}
        >
            <input
                type="number"
                class="parameter parameter-min"
                ref={ref1}
                min={props.min.map(|val| val.to_string())}
                max={props.max.map(|val| val.to_string())}
                step={props.step.map(|val| val.to_string())}
                value={props.current_value.unwrap_or(props.default).0.to_string()}
                oninput={parse_number_input.clone()}
            />
            <input
                type="number"
                class="parameter parameter-max"
                ref={ref2}
                min={props.min.map(|val| val.to_string())}
                max={props.max.map(|val| val.to_string())}
                step={props.step.map(|val| val.to_string())}
                value={props.current_value.unwrap_or(props.default).1.to_string()}
                oninput={parse_number_input}
            />
        </OptionalField>
    }
}
