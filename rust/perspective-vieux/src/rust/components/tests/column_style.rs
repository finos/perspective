////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::{cell::RefCell, rc::Rc};

use wasm_bindgen::JsCast;
use wasm_bindgen_test::*;
use web_sys::*;
use yew::prelude::*;

use crate::components::column_style::*;
use crate::utils::WeakComponentLink;
use crate::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
pub fn test_set_pos() {
    let link: WeakComponentLink<ColumnStyle> = WeakComponentLink::default();
    let panel_div = NodeRef::default();
    test_html! {
        <ColumnStyle
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

/// Find a node relatie to `ColumnStyle` ref's root, which is a
/// DocumentFragment.
fn cs_query(node: &NodeRef, query: &str) -> HtmlElement {
    node.cast::<HtmlElement>()
        .unwrap()
        .next_sibling()
        .as_ref()
        .unwrap()
        .unchecked_ref::<HtmlElement>()
        .query_selector(query)
        .unwrap()
        .as_ref()
        .unwrap()
        .clone()
        .unchecked_into::<HtmlElement>()
}

#[wasm_bindgen_test]
pub fn test_initial_fixed() {
    let panel_div = NodeRef::default();
    let mut config = ColumnStyleConfig::default();
    config.fixed = Some(4);
    test_html! {
        <ColumnStyle
            config=config
            ref=panel_div.clone() >
        </ColumnStyle>
    };

    assert_eq!(
        cs_query(&panel_div, "#fixed-examples").inner_text(),
        "Prec 0.0001"
    );
}

#[wasm_bindgen_test]
pub fn test_fixed_msg_overrides_default() {
    let link: WeakComponentLink<ColumnStyle> = WeakComponentLink::default();
    let panel_div = NodeRef::default();
    let mut default_config = ColumnStyleDefaultConfig::default();
    default_config.fixed = 4;
    test_html! {
        <ColumnStyle
            default_config=default_config
            ref=panel_div.clone()
            weak_link=link.clone() >
        </ColumnStyle>
    };

    assert_eq!(
        cs_query(&panel_div, "#fixed-examples").inner_text(),
        "Prec 0.0001"
    );

    let column_style = link.borrow().clone().unwrap();
    column_style.send_message(ColumnStyleMsg::FixedChanged("2".to_owned()));
    assert_eq!(
        cs_query(&panel_div, "#fixed-examples").inner_text(),
        "Prec 0.01"
    );
}

#[wasm_bindgen_test]
pub fn test_fixed_is_0() {
    let panel_div = NodeRef::default();
    let mut config = ColumnStyleConfig::default();
    config.fixed = Some(0);
    test_html! {
        <ColumnStyle
            config=config
            ref=panel_div.clone() >
        </ColumnStyle>
    };

    assert_eq!(
        cs_query(&panel_div, "#fixed-examples").inner_text().trim(),
        "Prec 1"
    );
}

#[wasm_bindgen_test]
pub fn test_color_enabled() {
    let link: WeakComponentLink<ColumnStyle> = WeakComponentLink::default();
    let result: Rc<RefCell<ColumnStyleConfig>> =
        Rc::new(RefCell::new(ColumnStyleConfig::default()));
    let on_change = {
        clone!(result);
        Callback::from(move |config| {
            *result.borrow_mut() = config;
        })
    };

    test_html! {
        <ColumnStyle
            on_change=on_change
            weak_link=link.clone() >
        </ColumnStyle>
    };

    let column_style = link.borrow().clone().unwrap();
    column_style.send_message(ColumnStyleMsg::ColorEnabledChanged(true));
    assert_eq!(result.borrow().color_mode, Some(ColorMode::Foreground));
}

#[wasm_bindgen_test]
pub fn test_color_mode_changed() {
    let link: WeakComponentLink<ColumnStyle> = WeakComponentLink::default();
    let result: Rc<RefCell<ColumnStyleConfig>> =
        Rc::new(RefCell::new(ColumnStyleConfig::default()));
    let mut default_config = ColumnStyleDefaultConfig::default();
    default_config.pos_color = "#123".to_owned();
    let on_change = {
        clone!(result);
        Callback::from(move |config| {
            *result.borrow_mut() = config;
        })
    };

    test_html! {
        <ColumnStyle
            default_config=default_config
            on_change=on_change
            weak_link=link.clone() >
        </ColumnStyle>
    };

    let column_style = link.borrow().clone().unwrap();
    assert_eq!(result.borrow().color_mode, None);
    assert_eq!(result.borrow().pos_color, None);
    column_style.send_message(ColumnStyleMsg::ColorEnabledChanged(true));
    assert_eq!(result.borrow().color_mode, Some(ColorMode::Foreground));
    assert_eq!(result.borrow().pos_color, Some("#123".to_owned()));
    column_style.send_message(ColumnStyleMsg::ColorModeChanged(ColorMode::Background));
    assert_eq!(result.borrow().color_mode, Some(ColorMode::Background));
    assert_eq!(result.borrow().pos_color, Some("#123".to_owned()));
}
