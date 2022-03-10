////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use yew::prelude::*;

#[derive(Properties, Clone, PartialEq)]
pub struct ModalAnchorProps {
    pub top: i32,
    pub left: i32,
}

#[function_component(ModalAnchor)]
pub fn split_panel_child(props: &ModalAnchorProps) -> Html {
    html! {
        <style>
            { format!(":host{{left:{}px;top:{}px;}}", props.left, props.top) }
        </style>
    }
}
