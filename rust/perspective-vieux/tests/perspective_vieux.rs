////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

extern crate perspective_vieux;

use crate::utils::perspective::*;
use perspective_vieux::components::perspective_vieux::*;
use perspective_vieux::utils::*;
use perspective_vieux::*;
use wasm_bindgen_futures::JsFuture;

use futures::channel::oneshot::*;
use std::cell::RefCell;
use std::iter::FromIterator;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_test::*;
use web_sys::*;
use yew::prelude::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen(inline_js = "

    export async function worker() {
        await import('/pkg/perspective.inline.js');
        return window.perspective.worker();
    }

")]
extern "C" {
    fn worker() -> js_sys::Promise;
}

fn set_up_html() -> (WeakComponentLink<PerspectiveVieux>, web_sys::ShadowRoot) {
    let link: WeakComponentLink<PerspectiveVieux> = WeakComponentLink::default();
    let root = NodeRef::default();
    let document = window().unwrap().document().unwrap();
    let elem: HtmlElement = document.create_element("div").unwrap().unchecked_into();
    let div1: HtmlElement = document.create_element("div").unwrap().unchecked_into();
    let div2: HtmlElement = document.create_element("div").unwrap().unchecked_into();
    test_html! {
        <PerspectiveVieux
            weak_link=link.clone()
            ref=root.clone()
            elem=elem
            panels= (div1, div2)>
        </PerspectiveVieux>
    };

    let root: web_sys::ShadowRoot = root
        .cast::<HtmlElement>()
        .unwrap()
        .parent_node()
        .unwrap()
        .unchecked_into();

    (link, root)
}

#[wasm_bindgen_test]
pub fn test_settings_closed() {
    let (_, root) = set_up_html();
    for selector in ["slot[name=main_panel", "#config_button"].iter() {
        assert!(root
            .query_selector(selector)
            .unwrap()
            .unwrap()
            .is_connected());
    }

    assert_eq!(root.query_selector("#app_panel").unwrap(), None);
}

#[wasm_bindgen_test]
pub fn test_settings_open() {
    let (link, root) = set_up_html();
    let vieux = link.borrow().clone().unwrap();
    vieux.send_message(Msg::ToggleConfig(Some(true), None));
    for selector in [
        "#app_panel",
        "slot[name=main_panel",
        "#config_button",
        "#status_bar",
    ]
    .iter()
    {
        assert!(root
            .query_selector(selector)
            .unwrap()
            .unwrap()
            .is_connected());
    }
}

/// Generate a test `Table`, but only create teh webworker once or the tests will
/// figuratively literally run forever.
async fn get_table() -> PerspectiveJsTable {
    thread_local! {
        static WORKER: RefCell<Option<PerspectiveJsWorker>> = RefCell::new(None);
    }

    let worker: PerspectiveJsWorker = match WORKER.with(|x| x.borrow().clone()) {
        Some(x) => x,
        None => JsFuture::from(worker()).await.unwrap().unchecked_into(),
    };

    WORKER.with(|x| {
        *x.borrow_mut() = Some(worker.clone());
    });

    worker
        .table(js_object!(
            "A",
            js_sys::Array::from_iter(
                [JsValue::from(1), JsValue::from(2), JsValue::from(3)].iter()
            )
        ))
        .await
        .unwrap()
}

#[wasm_bindgen_test]
pub async fn test_load_table() {
    let (link, root) = set_up_html();
    let table = get_table().await;
    let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
    let vieux = link.borrow().clone().unwrap();
    vieux.send_message(Msg::ToggleConfig(Some(true), None));
    vieux.send_message(Msg::LoadTable(js_sys::Promise::resolve(&table), sender));
    receiver.await.unwrap().unwrap();
    assert_eq!(
        root.query_selector("#rows").unwrap().unwrap().inner_html(),
        "<span>3 rows</span>"
    );
}

#[wasm_bindgen_test]
pub async fn test_export_button() {
    let document = window().unwrap().document().unwrap();
    let (link, _) = set_up_html();
    let table = get_table().await;
    let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
    let vieux = link.borrow().clone().unwrap();
    vieux.send_message(Msg::ToggleConfig(Some(true), None));
    vieux.send_message(Msg::LoadTable(js_sys::Promise::resolve(&table), sender));
    let _ = receiver.await.unwrap().unwrap();

    // Create a `MutationListener` and async channel to signal us when the download
    // button attaches the invisible button to `document.body`.
    let (sender, receiver) = channel::<String>();
    let b: Box<dyn FnOnce(js_sys::Array, web_sys::MutationObserver)> =
        Box::new(|_mut_list, _observer| {
            let elem = _mut_list
                .get(0)
                .unchecked_into::<web_sys::MutationRecord>()
                .added_nodes()
                .get(0)
                .unwrap()
                .unchecked_into::<web_sys::HtmlElement>();
            let href = elem.get_attribute("href").unwrap();
            sender.send(href).unwrap();
        });

    let mut config = web_sys::MutationObserverInit::new();
    config.child_list(true);
    web_sys::MutationObserver::new(&Closure::once(b).into_js_value().unchecked_into())
        .unwrap()
        .observe_with_options(&document.body().unwrap(), &config)
        .unwrap();

    vieux.send_message(Msg::Export(true));

    // Await the `MutationObserver` we set up earlier, and validate that its `href`
    // attribute is at least a blob.
    assert_eq!(&receiver.await.unwrap()[..5], "blob:");
}
