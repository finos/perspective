////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::column_style::*;
use crate::custom_elements::modal::*;
use crate::utils::WeakComponentLink;

use wasm_bindgen::prelude::*;
use yew::prelude::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveColumnStyleElement {
    modal: ModalElement<ColumnStyle>,
}

fn on_change(elem: &web_sys::HtmlElement, config: &ColumnStyleConfig) {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&JsValue::from_serde(config).unwrap());
    let event = web_sys::CustomEvent::new_with_event_init_dict(
        "perspective-column-style-change",
        &event_init,
    );

    elem.dispatch_event(&event.unwrap()).unwrap();
}

impl ResizableMessage for <ColumnStyle as Component>::Message {
    fn resize(y: u32, x: u32) -> Self {
        ColumnStyleMsg::SetPos(y, x)
    }
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
        let on_change = {
            let _elem = elem.clone();
            Callback::from(move |x: ColumnStyleConfig| on_change(&_elem, &x.clone()))
        };

        let props = ColumnStyleProps {
            weak_link: WeakComponentLink::default(),
            config,
            on_change,
            default_config,
        };

        let modal = ModalElement::new(elem, props);
        PerspectiveColumnStyleElement {
            modal
        }
    }

    pub fn open(&mut self, target: web_sys::HtmlElement) -> Result<(), JsValue> {
        self.modal.open(target)
    }

    pub fn close(&mut self) -> Result<(), JsValue> {
        self.modal.close()
    }

    pub fn connected_callback(&self) {}
}
