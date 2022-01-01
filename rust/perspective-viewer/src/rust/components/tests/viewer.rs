////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::viewer::*;
use crate::config::*;
use crate::dragdrop::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

use futures::channel::oneshot::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_test::*;
use web_sys::*;
use yew::prelude::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

fn set_up_html() -> (WeakScope<PerspectiveViewer>, web_sys::ShadowRoot, Session) {
    let link: WeakScope<PerspectiveViewer> = WeakScope::default();
    let root = NodeRef::default();
    let document = window().unwrap().document().unwrap();
    let elem: HtmlElement = document.create_element("div").unwrap().unchecked_into();
    let session = Session::default();
    let renderer = Renderer::new(elem.clone(), session.clone());
    let dragdrop = DragDrop::default();
    test_html! {
        <PerspectiveViewer
            weak_link={ link.clone() }
            ref={ root.clone() }
            elem={ elem }
            dragdrop={ dragdrop }
            renderer={ renderer }
            session={ session.clone() }>
        </PerspectiveViewer>
    };

    let root: web_sys::ShadowRoot = root
        .cast::<HtmlElement>()
        .unwrap()
        .parent_node()
        .unwrap()
        .unchecked_into();

    (link, root, session)
}

#[wasm_bindgen_test]
pub fn test_settings_closed() {
    let (_, root, _) = set_up_html();
    for selector in ["slot", "#settings_button"].iter() {
        assert!(root
            .query_selector(selector)
            .unwrap()
            .unwrap()
            .is_connected());
    }

    assert_eq!(root.query_selector("#app_panel").unwrap(), None);
}

#[wasm_bindgen_test]
pub async fn test_settings_open() {
    let (link, root, _) = set_up_html();
    let viewer = link.borrow().clone().unwrap();
    viewer.send_message(Msg::ToggleSettings(
        Some(SettingsUpdate::Update(true)),
        None,
    ));
    let (sender, receiver) = channel::<()>();
    viewer.send_message(Msg::ToggleSettingsFinished(sender));
    receiver.await.unwrap();
    for selector in ["#app_panel", "slot", "#settings_button", "#status_bar"].iter() {
        assert!(root
            .query_selector(selector)
            .unwrap()
            .unwrap()
            .is_connected());
    }
}

#[wasm_bindgen_test]
pub async fn test_load_table() {
    let (link, root, session) = set_up_html();
    let table = get_mock_table().await;
    let viewer = link.borrow().clone().unwrap();
    viewer.send_message(Msg::ToggleSettings(
        Some(SettingsUpdate::Update(true)),
        None,
    ));
    session.set_table(table).await.unwrap();
    assert_eq!(
        root.query_selector("#rows").unwrap().unwrap().inner_html(),
        "<span>3 rows</span>"
    );
}
