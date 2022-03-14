////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::number_column_style::*;
use crate::custom_elements::modal::*;
use crate::*;

use wasm_bindgen::prelude::*;
use web_sys::*;
use yew::prelude::*;

#[cfg(test)]
use crate::utils::WeakScope;

#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveNumberColumnStyleElement {
    modal: ModalElement<NumberColumnStyle>,
}

fn on_change(elem: &web_sys::HtmlElement, config: &NumberColumnStyleConfig) {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&JsValue::from_serde(config).unwrap());
    let event =
        CustomEvent::new_with_event_init_dict("perspective-column-style-change", &event_init);

    elem.dispatch_event(&event.unwrap()).unwrap();
}

impl ResizableMessage for <NumberColumnStyle as Component>::Message {
    fn resize(y: i32, x: i32, _: bool) -> Self {
        NumberColumnStyleMsg::SetPos(y, x)
    }
}

#[wasm_bindgen]
impl PerspectiveNumberColumnStyleElement {
    #[wasm_bindgen(constructor)]
    pub fn new(
        elem: web_sys::HtmlElement,
        js_config: JsValue,
        js_def_config: JsValue,
    ) -> PerspectiveNumberColumnStyleElement {
        let config = js_config.into_serde().unwrap();
        let default_config = js_def_config.into_serde().unwrap();
        let on_change = {
            clone!(elem);
            Callback::from(move |x: NumberColumnStyleConfig| on_change(&elem, &x))
        };

        let props = NumberColumnStyleProps {
            config,
            on_change,
            default_config,
            #[cfg(test)]
            weak_link: WeakScope::default(),
        };

        let modal = ModalElement::new(elem, props, true);
        PerspectiveNumberColumnStyleElement { modal }
    }

    /// Reset to a provided JSON config, to be used in place of `new()` when
    /// re-using this component.
    ///
    /// # Arguments
    /// * `config` - a `ColumnStyle` config in JSON form.
    /// * `default_config` - the default `ColumnStyle` config for this column
    ///   type, in JSON form.
    pub fn reset(&mut self, config: JsValue, default_config: JsValue) {
        let msg = NumberColumnStyleMsg::Reset(
            config.into_serde().unwrap(),
            default_config.into_serde().unwrap(),
        );

        self.modal.send_message(msg);
    }

    /// Dispatches to `ModalElement::open(target)`
    ///
    /// # Arguments
    /// `target` - the relative target to pin this `ModalElement` to.
    pub fn open(&mut self, target: web_sys::HtmlElement) {
        self.modal.open(target, None);
    }

    /// Remove this `ModalElement` from the DOM.
    pub fn close(&mut self) -> Result<(), JsValue> {
        self.modal.hide()
    }

    pub fn destroy(self) -> Result<(), JsValue> {
        self.modal.destroy()
    }

    /// DOM lifecycle method when connected.  We don't use this, as it can fire
    /// during innocuous events like re-parenting.
    pub fn connected_callback(&self) {}
}
