////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

#![recursion_limit = "256"]

pub mod components;
pub mod session;
pub mod utils;

use crate::components::perspective_vieux::*;
use crate::utils::perspective::*;

use futures::channel::oneshot::*;
use utils::WeakComponentLink;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use yew::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// A `customElements` external API.
#[wasm_bindgen]
pub struct PerspectiveVieuxElement {
    root: ComponentLink<PerspectiveVieux>,
}

#[wasm_bindgen]
impl PerspectiveVieuxElement {
    #[wasm_bindgen(constructor)]
    pub fn new(elem: web_sys::HtmlElement) -> PerspectiveVieuxElement {
        let children = elem.children();
        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = elem
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        let props = PerspectiveVieuxProps {
            elem,
            panels: (
                children.item(0).unwrap().unchecked_into(),
                children.item(1).unwrap().unchecked_into(),
            ),
            weak_link: WeakComponentLink::default(),
        };

        let app = App::<PerspectiveVieux>::new();
        let root = app.mount_with_props(shadow_root, props);
        PerspectiveVieuxElement { root }
    }

    pub fn connected_callback(&self) {}

    pub fn load(&self, table: js_sys::Promise) -> js_sys::Promise {
        assert!(!table.is_undefined());

        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        self.root.send_message(Msg::LoadTable(table, sender));
        future_to_promise(async move { receiver.await.unwrap() })
    }

    pub fn set_view(&self, view: PerspectiveJsView) {
        self.root.send_message(Msg::ViewLoaded(view));
    }

    pub fn delete_view(&self) {
        self.root.send_message(Msg::ViewDeleted);
    }

    pub fn toggle_config(&self, force: Option<bool>) -> js_sys::Promise {
        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        let msg = Msg::ToggleConfig(force, Some(sender));
        self.root.send_message(msg);
        future_to_promise(async move { receiver.await.unwrap() })
    }
}
