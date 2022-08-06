////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::*;
use wasm_bindgen::*;
use web_sys::*;
use yew::prelude::*;

#[derive(Properties, PartialEq)]
pub struct NumberInputProps {
    pub max_value: f64,
    pub on_max_value: Callback<String>,
}

#[function_component(NumberInput)]
pub fn number_input(props: &NumberInputProps) -> Html {
    let oninput = props.on_max_value.reform(|event: InputEvent| {
        event
            .target()
            .unwrap()
            .unchecked_into::<HtmlInputElement>()
            .value()
    });

    html_template! {
        <label>{ "Max" }</label>
        <input
            value={ format!("{}", props.max_value) }
            class="parameter"
            type="number"
            min="0"
            oninput={ oninput } />
    }
}
