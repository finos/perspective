////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen_test::*;
use web_sys::HtmlElement;
use yew::prelude::*;

use super::super::split_panel::{SplitPanel, SplitPanelMsg};
use crate::utils::WeakComponentLink;
use crate::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
pub fn test_resizes_larger() {
    let link: WeakComponentLink<SplitPanel> = WeakComponentLink::default();
    let panel_div = NodeRef::default();
    test_html! {
        <SplitPanel id="test" weak_link={ link.clone() }>
            <div ref={ panel_div.clone() } style="background-color: red"></div>
            <div style="background-color: green"></div>
        </SplitPanel>
    };

    let split_panel = link.borrow().clone().unwrap();
    split_panel.send_message(SplitPanelMsg::StartResizing(10));
    split_panel.send_message(SplitPanelMsg::MoveResizing(100));
    split_panel.send_message(SplitPanelMsg::StopResizing);

    let width = panel_div.cast::<HtmlElement>().unwrap().offset_width();
    assert_eq!(width, 90);
}

#[wasm_bindgen_test]
pub async fn test_resizes_narrower() {
    let link: WeakComponentLink<SplitPanel> = WeakComponentLink::default();
    let panel_div = NodeRef::default();
    test_html! {
        <SplitPanel id="test" weak_link={ link.clone() }>
            <div ref={ panel_div.clone() } style="background-color: red"></div>
            <div style="background-color: green"></div>
        </SplitPanel>
    };

    let split_panel = link.borrow().clone().unwrap();
    split_panel.send_message(SplitPanelMsg::StartResizing(10));
    split_panel.send_message(SplitPanelMsg::MoveResizing(100));
    split_panel.send_message(SplitPanelMsg::StopResizing);
    split_panel.send_message(SplitPanelMsg::StartResizing(100));
    split_panel.send_message(SplitPanelMsg::MoveResizing(50));
    split_panel.send_message(SplitPanelMsg::StopResizing);

    let width = panel_div.cast::<HtmlElement>().unwrap().offset_width();
    assert_eq!(width, 40);
}

#[wasm_bindgen_test]
pub async fn test_double_click_reset() {
    let link: WeakComponentLink<SplitPanel> = WeakComponentLink::default();
    let panel_div = NodeRef::default();
    test_html! {
        <SplitPanel id="test" weak_link={ link.clone() }>
            <div ref={ panel_div.clone() } style="background-color: red"></div>
            <div style="background-color: green"></div>
        </SplitPanel>
    };

    let split_panel = link.borrow().clone().unwrap();
    split_panel.send_message(SplitPanelMsg::StartResizing(10));
    split_panel.send_message(SplitPanelMsg::MoveResizing(100));
    split_panel.send_message(SplitPanelMsg::StopResizing);
    split_panel.send_message(SplitPanelMsg::Reset);

    let width = panel_div.cast::<HtmlElement>().unwrap().offset_width();
    assert_eq!(width, 0);
}
