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
use crate::*;

use wasm_bindgen::prelude::*;
use yew::prelude::*;
use web_sys::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveColumnStyleElement {
    modal: ModalElement<ColumnStyle>,
    weak_link: WeakComponentLink<ColumnStyle>,
    props: ColumnStyleProps,
}

fn on_change(elem: &web_sys::HtmlElement, config: &ColumnStyleConfig) {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&JsValue::from_serde(config).unwrap());
    let event = CustomEvent::new_with_event_init_dict(
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
            clone!(elem);
            Callback::from(move |x: ColumnStyleConfig| on_change(&elem, &x.clone()))
        };

        let weak_link = WeakComponentLink::default();
        let props = ColumnStyleProps {
            weak_link: weak_link.clone(),
            config,
            on_change,
            default_config,
        };

        let modal = ModalElement::new(elem, props.clone());
        PerspectiveColumnStyleElement {
            modal,
            weak_link,
            props,
        }
    }

    /// Reset to a provided JSON config, to be used in place of `new()` when 
    /// re-using this component.
    /// 
    /// # Arguments
    /// * `config` - a `ColumnStyle` config in JSON form.
    pub fn reset(&mut self, config: JsValue) {
        let msg = ColumnStyleMsg::Reset(config.into_serde().unwrap());
        self.weak_link.borrow().as_ref().map(|elem| elem.send_message(msg));
    }

    /// Dispatches to `ModalElement::open(target)`
    /// 
    /// # Arguments
    /// `target` - the relative target to pin this `ModalElement` to.
    pub fn open(&mut self, target: web_sys::HtmlElement) -> Result<(), JsValue> {
        self.modal.open(target)
    }

    /// Remove this `ModalElement` from the DOM.
    pub fn close(&mut self) -> Result<(), JsValue> {
        self.modal.close()
    }

    /// DOM lifecycle method when connected.  We don't use this, as it can fire during
    /// innocuous events like re-parenting.
    pub fn connected_callback(&self) {}
}
