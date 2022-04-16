////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::number_column_style::*;
use crate::utils::{await_animation_frame, WeakScope};
use crate::*;

use std::{cell::RefCell, rc::Rc};
use wasm_bindgen::JsCast;
use wasm_bindgen_test::*;
use web_sys::*;
use yew::prelude::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

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
pub async fn test_initial_fixed() {
    let panel_div = NodeRef::default();
    let config = NumberColumnStyleConfig {
        fixed: Some(4),
        ..NumberColumnStyleConfig::default()
    };

    test_html! {
        <NumberColumnStyle
            config={config}
            ref={ panel_div.clone() }>
        </NumberColumnStyle>
    };

    await_animation_frame().await.unwrap();
    assert_eq!(
        cs_query(&panel_div, "#fixed-examples").inner_text(),
        "Prec 0.0001"
    );
}

#[wasm_bindgen_test]
pub async fn test_fixed_msg_overrides_default() {
    let link: WeakScope<NumberColumnStyle> = WeakScope::default();
    let panel_div = NodeRef::default();
    let default_config = NumberColumnStyleDefaultConfig {
        fixed: 4,
        ..NumberColumnStyleDefaultConfig::default()
    };

    test_html! {
        <NumberColumnStyle
            default_config={default_config}
            ref={ panel_div.clone() }
            weak_link={ link.clone() }>
        </NumberColumnStyle>
    };

    await_animation_frame().await.unwrap();
    assert_eq!(
        cs_query(&panel_div, "#fixed-examples").inner_text(),
        "Prec 0.0001"
    );

    let column_style = link.borrow().clone().unwrap();
    column_style.send_message(NumberColumnStyleMsg::FixedChanged("2".to_owned()));
    await_animation_frame().await.unwrap();

    assert_eq!(
        cs_query(&panel_div, "#fixed-examples").inner_text(),
        "Prec 0.01"
    );
}

#[wasm_bindgen_test]
pub async fn test_fixed_is_0() {
    let panel_div = NodeRef::default();
    let config = NumberColumnStyleConfig {
        fixed: Some(0),
        ..NumberColumnStyleConfig::default()
    };
    test_html! {
        <NumberColumnStyle
            config={ config }
            ref={ panel_div.clone() }>
        </NumberColumnStyle>
    };

    await_animation_frame().await.unwrap();
    assert_eq!(
        cs_query(&panel_div, "#fixed-examples").inner_text().trim(),
        "Prec 1"
    );
}

#[wasm_bindgen_test]
pub async fn test_color_enabled() {
    let link: WeakScope<NumberColumnStyle> = WeakScope::default();
    let result: Rc<RefCell<NumberColumnStyleConfig>> =
        Rc::new(RefCell::new(NumberColumnStyleConfig::default()));
    let on_change = {
        clone!(result);
        Callback::from(move |config| {
            *result.borrow_mut() = config;
        })
    };

    test_html! {
        <NumberColumnStyle
            on_change={ on_change }
            weak_link={ link.clone() }>
        </NumberColumnStyle>
    };

    await_animation_frame().await.unwrap();

    let column_style = link.borrow().clone().unwrap();
    column_style.send_message(NumberColumnStyleMsg::ColorEnabledChanged(true));
    await_animation_frame().await.unwrap();

    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Foreground
    );
    column_style.send_message(NumberColumnStyleMsg::ColorEnabledChanged(false));
    await_animation_frame().await.unwrap();

    assert_eq!(result.borrow().number_color_mode, NumberColorMode::Disabled);
}

#[wasm_bindgen_test]
pub async fn test_color_mode_changed() {
    let link: WeakScope<NumberColumnStyle> = WeakScope::default();
    let result: Rc<RefCell<NumberColumnStyleConfig>> =
        Rc::new(RefCell::new(NumberColumnStyleConfig::default()));
    let default_config = NumberColumnStyleDefaultConfig {
        pos_color: "#123".to_owned(),
        ..NumberColumnStyleDefaultConfig::default()
    };

    let on_change = {
        clone!(result);
        Callback::from(move |config| {
            *result.borrow_mut() = config;
        })
    };

    test_html! {
        <NumberColumnStyle
            default_config={ default_config }
            on_change={ on_change }
            weak_link={ link.clone() }>
        </NumberColumnStyle>
    };

    await_animation_frame().await.unwrap();
    let column_style = link.borrow().clone().unwrap();
    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Foreground
    );
    assert_eq!(result.borrow().pos_color, None);
    column_style.send_message(NumberColumnStyleMsg::ColorEnabledChanged(false));
    await_animation_frame().await.unwrap();

    assert_eq!(result.borrow().number_color_mode, NumberColorMode::Disabled);
    assert_eq!(result.borrow().pos_color, None);
    column_style.send_message(NumberColumnStyleMsg::NumberColorModeChanged(
        NumberColorMode::Background,
    ));
    await_animation_frame().await.unwrap();

    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Background
    );
    assert_eq!(result.borrow().pos_color, None);
}

#[wasm_bindgen_test]
pub async fn test_pos_color_changed_override_defaults() {
    let link: WeakScope<NumberColumnStyle> = WeakScope::default();
    let result: Rc<RefCell<NumberColumnStyleConfig>> =
        Rc::new(RefCell::new(NumberColumnStyleConfig::default()));
    let default_config = NumberColumnStyleDefaultConfig {
        pos_color: "#123".to_owned(),
        neg_color: "#321".to_owned(),
        ..NumberColumnStyleDefaultConfig::default()
    };

    let on_change = {
        clone!(result);
        Callback::from(move |config| {
            *result.borrow_mut() = config;
        })
    };

    test_html! {
        <NumberColumnStyle
            default_config={ default_config }
            on_change={ on_change }
            weak_link={ link.clone() }>
        </NumberColumnStyle>
    };
    await_animation_frame().await.unwrap();

    let column_style = link.borrow().clone().unwrap();
    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Foreground
    );
    assert_eq!(result.borrow().neg_color, None);
    assert_eq!(result.borrow().pos_color, None);
    column_style.send_message(NumberColumnStyleMsg::PosColorChanged("#666".to_owned()));
    await_animation_frame().await.unwrap();

    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Foreground
    );
    assert_eq!(result.borrow().pos_color, Some("#666".to_owned()));
    assert_eq!(result.borrow().neg_color, Some("#321".to_owned()));
    column_style.send_message(NumberColumnStyleMsg::PosColorChanged("#123".to_owned()));
    await_animation_frame().await.unwrap();

    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Foreground
    );
    assert_eq!(result.borrow().pos_color, None);
    assert_eq!(result.borrow().neg_color, None);
}

#[wasm_bindgen_test]
pub async fn test_pos_color_and_mode_changed_override_defaults() {
    let link: WeakScope<NumberColumnStyle> = WeakScope::default();
    let result: Rc<RefCell<NumberColumnStyleConfig>> =
        Rc::new(RefCell::new(NumberColumnStyleConfig::default()));
    let default_config = NumberColumnStyleDefaultConfig {
        pos_color: "#123".to_owned(),
        neg_color: "#321".to_owned(),
        ..NumberColumnStyleDefaultConfig::default()
    };

    let on_change = {
        clone!(result);
        Callback::from(move |config| {
            *result.borrow_mut() = config;
        })
    };

    test_html! {
        <NumberColumnStyle
            default_config={default_config}
            on_change={on_change}
            weak_link={ link.clone() }>
        </NumberColumnStyle>
    };

    await_animation_frame().await.unwrap();

    let column_style = link.borrow().clone().unwrap();
    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Foreground
    );
    assert_eq!(result.borrow().neg_color, None);
    assert_eq!(result.borrow().pos_color, None);
    column_style.send_message(NumberColumnStyleMsg::NumberColorModeChanged(
        NumberColorMode::Background,
    ));

    await_animation_frame().await.unwrap();
    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Background
    );
    assert_eq!(result.borrow().pos_color, None);
    assert_eq!(result.borrow().neg_color, None);
    column_style.send_message(NumberColumnStyleMsg::PosColorChanged("#666".to_owned()));

    await_animation_frame().await.unwrap();
    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Background
    );
    assert_eq!(result.borrow().pos_color, Some("#666".to_owned()));
    assert_eq!(result.borrow().neg_color, Some("#321".to_owned()));
    column_style.send_message(NumberColumnStyleMsg::PosColorChanged("#123".to_owned()));

    await_animation_frame().await.unwrap();
    assert_eq!(
        result.borrow().number_color_mode,
        NumberColorMode::Background
    );
    assert_eq!(result.borrow().pos_color, None);
    assert_eq!(result.borrow().neg_color, None);
}
