////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::number_column_style::*;
use crate::custom_elements::modal::*;
use crate::utils::CustomElementMetadata;
use crate::*;

use wasm_bindgen::prelude::*;
use web_sys::*;
use yew::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveNumberColumnStyleElement {
    elem: HtmlElement,
    modal: Option<ModalElement<NumberColumnStyle>>,
}

fn on_change(elem: &web_sys::HtmlElement, config: &NumberColumnStyleConfig) {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&JsValue::from_serde(config).unwrap());
    let event =
        CustomEvent::new_with_event_init_dict("perspective-column-style-change", &event_init);

    elem.dispatch_event(&event.unwrap()).unwrap();
}

impl CustomElementMetadata for PerspectiveNumberColumnStyleElement {
    const CUSTOM_ELEMENT_NAME: &'static str = "perspective-number-column-style";
}

#[wasm_bindgen]
impl PerspectiveNumberColumnStyleElement {
    #[wasm_bindgen(constructor)]
    pub fn new(elem: web_sys::HtmlElement) -> PerspectiveNumberColumnStyleElement {
        PerspectiveNumberColumnStyleElement { elem, modal: None }
    }

    /// Reset to a provided JSON config, to be used in place of `new()` when
    /// re-using this component.
    ///
    /// # Arguments
    /// * `config` - a `ColumnStyle` config in JSON form.
    /// * `default_config` - the default `ColumnStyle` config for this column
    ///   type, in JSON form.
    pub fn reset(&mut self, config: JsValue, default_config: JsValue) -> Result<(), JsValue> {
        let msg = NumberColumnStyleMsg::Reset(
            config.into_serde().unwrap(),
            default_config.into_serde().unwrap(),
        );

        self.modal.as_ref().into_jserror()?.send_message(msg);
        Ok(())
    }

    /// Dispatches to `ModalElement::open(target)`
    ///
    /// # Arguments
    /// `target` - the relative target to pin this `ModalElement` to.
    pub fn open(
        &mut self,
        target: web_sys::HtmlElement,
        js_config: JsValue,
        js_def_config: JsValue,
    ) -> Result<(), JsValue> {
        if self.modal.is_some() {
            self.reset(js_config, js_def_config)?;
        } else {
            let config: NumberColumnStyleConfig = js_config.into_serde().unwrap();
            let default_config: NumberColumnStyleDefaultConfig =
                js_def_config.into_serde().unwrap();
            let on_change = {
                clone!(self.elem);
                Callback::from(move |x: NumberColumnStyleConfig| on_change(&elem, &x))
            };

            let props = props!(NumberColumnStyleProps {
                config,
                on_change,
                default_config,
            });

            self.modal = Some(ModalElement::new(self.elem.clone(), props, true));
        }

        self.modal.as_ref().into_jserror()?.open(target, None);
        Ok(())
    }

    /// Remove this `ModalElement` from the DOM.
    pub fn close(&mut self) -> Result<(), JsValue> {
        self.modal.as_ref().into_jserror()?.hide()
    }

    pub fn destroy(self) -> Result<(), JsValue> {
        self.modal.into_jserror()?.destroy()
    }

    /// DOM lifecycle method when connected.  We don't use this, as it can fire
    /// during innocuous events like re-parenting.
    pub fn connected_callback(&self) {}
}
