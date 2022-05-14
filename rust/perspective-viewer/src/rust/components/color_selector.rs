////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::*;

use wasm_bindgen::JsCast;
use web_sys::*;
use yew::prelude::*;

#[derive(Properties, PartialEq)]
pub struct ColorProps {
    pub color: String,
    pub on_color: Callback<String>,
}

#[function_component(ColorSelector)]
pub fn color_component(props: &ColorProps) -> Html {
    let oninput = props.on_color.reform(|event: InputEvent| {
        event
            .target()
            .unwrap()
            .unchecked_into::<HtmlInputElement>()
            .value()
    });

    html_template! {
        <label>{ "Color" }</label>
        <input
            class="parameter"
            type="color"
            value={ props.color.to_owned() }
            oninput={ oninput }/>
    }
}
