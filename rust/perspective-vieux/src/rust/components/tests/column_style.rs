////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen_test::*;
use web_sys::*;
use yew::prelude::*;

use crate::components::column_style::*;
use crate::utils::WeakComponentLink;
use crate::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
pub fn test_set_pos() {
    let document = window().unwrap().document().unwrap();
    let link: WeakComponentLink<ColumnStyle> = WeakComponentLink::default();
    let panel_div = NodeRef::default();
    let elem: HtmlElement = document.create_element("div").unwrap().unchecked_into();
    let config = ColumnStyleConfig {
        color_mode: Some(ColorMode::Foreground),
        fixed: None,
        pos_color: Some("#aaaaff".to_owned()),
        neg_color: Some("#ffaaaa".to_owned()),
        gradient: Some(432.1),
    };

    let default_config = ColumnStyleDefaultConfig {
        gradient: 123.4,
        fixed: 2,
        pos_color: "#aaaaff".to_owned(),
        neg_color: "#ffaaaa".to_owned(),
    };

    test_html! {
        <ColumnStyle
            config=config
            default_config=default_config
            elem=elem
            ref=panel_div.clone()
            weak_link=link.clone() >
        </ColumnStyle>
    };

    let column_style = link.borrow().clone().unwrap();
    column_style.send_message(ColumnStyleMsg::SetPos(90, 100));
    assert!(panel_div
        .cast::<HtmlElement>()
        .unwrap()
        .inner_html()
        .contains("left:100px;top:90px;"));
}
