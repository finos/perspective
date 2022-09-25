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
pub struct ColorRangeProps {
    pub pos_color: String,
    pub neg_color: String,
    pub on_pos_color: Callback<String>,
    pub on_neg_color: Callback<String>,
}

#[function_component(ColorRangeSelector)]
pub fn color_chooser_component(props: &ColorRangeProps) -> Html {
    let on_pos_color = props.on_pos_color.reform(|event: InputEvent| {
        event
            .target()
            .unwrap()
            .unchecked_into::<HtmlInputElement>()
            .value()
    });

    let on_neg_color = props.on_neg_color.reform(|event: InputEvent| {
        event
            .target()
            .unwrap()
            .unchecked_into::<HtmlInputElement>()
            .value()
    });

    html_template! {
        <input
            id="color-param"
            class="parameter"
            type="color"
            value={ props.pos_color.to_owned() }
            oninput={ on_pos_color }/>
        <input
            id="neg-color-param"
            class="parameter"
            type="color"
            value={ props.neg_color.to_owned() }
            oninput={ on_neg_color }/>
    }
}
