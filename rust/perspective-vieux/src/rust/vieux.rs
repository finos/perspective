////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

// Required by yew's `html` macro.
#![recursion_limit = "256"]

pub mod components;
pub mod session;
pub mod utils;

use std::{cell::RefCell, rc::Rc};

use crate::components::column_style::*;
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

/// A `customElements` external API.
#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveColumnStyleElement {
    root: ComponentLink<ColumnStyle>,
    elem: web_sys::HtmlElement,
    blurhandler: Rc<RefCell<Option<Closure<dyn Fn(FocusEvent)>>>>,
}

#[wasm_bindgen]
impl PerspectiveColumnStyleElement {
    #[wasm_bindgen(constructor)]
    pub fn new(
        elem: web_sys::HtmlElement,
        js_config: JsValue,
        js_def_config: JsValue,
    ) -> PerspectiveColumnStyleElement {
        let config = js_config.into_serde().unwrap();
        let default_config = js_def_config.into_serde().unwrap();
        elem.set_attribute("tabindex", "0").unwrap();
        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = elem
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        let props = ColumnStyleProps {
            elem: elem.clone(),
            weak_link: WeakComponentLink::default(),
            config,
            default_config,
        };

        let app = App::<ColumnStyle>::new();
        let root = app.mount_with_props(shadow_root, props);
        let blurhandler = Rc::new(RefCell::new(None));
        PerspectiveColumnStyleElement {
            root,
            elem,
            blurhandler,
        }
    }

    /// Open this menu by attaching directly to `document.body` with position
    /// absolutely positioned relative to an alread-connected `target`
    /// element.
    pub fn open(&mut self, target: web_sys::HtmlElement) -> Result<(), JsValue> {
        let rect = target.get_bounding_client_rect();
        self.root.send_message(ColumnStyleMsg::SetPos(
            rect.bottom().round() as u32,
            rect.left().round() as u32,
        ));

        web_sys::window()
            .unwrap()
            .document()
            .unwrap()
            .body()
            .unwrap()
            .append_child(&self.elem)?;

        let this = self.clone();
        *self.blurhandler.borrow_mut() =
            Some(Closure::wrap(Box::new(move |_event: FocusEvent| {
                this.close().unwrap();
            }) as Box<dyn Fn(FocusEvent)>));

        self.elem.add_event_listener_with_callback(
            "blur",
            self.blurhandler
                .borrow()
                .as_ref()
                .unwrap()
                .as_ref()
                .unchecked_ref(),
        )?;

        self.elem.focus()
    }

    /// Remove from document and cleanup.
    pub fn close(&self) -> Result<(), JsValue> {
        self.elem.remove_event_listener_with_callback(
            "blur",
            self.blurhandler
                .borrow()
                .as_ref()
                .unwrap()
                .as_ref()
                .unchecked_ref(),
        )?;

        // TODO this would happen automatically if we drop() from JS
        *self.blurhandler.borrow_mut() = None;
        web_sys::window()
            .unwrap()
            .document()
            .unwrap()
            .body()
            .unwrap()
            .remove_child(&self.elem)?;

        Ok(())
    }

    pub fn connected_callback(&self) {}
}
