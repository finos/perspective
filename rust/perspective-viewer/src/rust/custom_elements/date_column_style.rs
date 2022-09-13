////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::datetime_column_style::*;
use crate::config::*;
use crate::custom_elements::modal::*;
use crate::utils::CustomElementMetadata;
use crate::utils::*;
use crate::*;
use wasm_bindgen::prelude::*;
use web_sys::*;
use yew::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveDateColumnStyleElement {
    elem: HtmlElement,
    modal: Option<ModalElement<DatetimeColumnStyle>>,
}

fn on_change(elem: &web_sys::HtmlElement, config: &DatetimeColumnStyleConfig) {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&JsValue::from_serde(config).unwrap());
    let event =
        CustomEvent::new_with_event_init_dict("perspective-column-style-change", &event_init);

    elem.dispatch_event(&event.unwrap()).unwrap();
}

impl CustomElementMetadata for PerspectiveDateColumnStyleElement {
    const CUSTOM_ELEMENT_NAME: &'static str = "perspective-date-column-style";
}

#[wasm_bindgen]
impl PerspectiveDateColumnStyleElement {
    #[wasm_bindgen(constructor)]
    pub fn new(elem: web_sys::HtmlElement) -> Self {
        Self { elem, modal: None }
    }

    /// Reset to a provided JSON config, to be used in place of `new()` when
    /// re-using this component.
    ///
    /// # Arguments
    /// * `config` - a `ColumnStyle` config in JSON form.
    pub fn reset(&mut self, config: JsValue) -> ApiResult<()> {
        let msg = DatetimeColumnStyleMsg::Reset(config.into_serde().unwrap());
        self.modal.as_apierror()?.send_message(msg);
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
        js_default_config: JsValue,
    ) -> ApiResult<()> {
        if self.modal.is_some() {
            self.reset(js_config)?;
        } else {
            let config: DatetimeColumnStyleConfig = js_config.into_serde().unwrap();
            let default_config: DatetimeColumnStyleDefaultConfig =
                js_default_config.into_serde().unwrap();

            let on_change = {
                clone!(self.elem);
                Callback::from(move |x: DatetimeColumnStyleConfig| on_change(&elem, &x))
            };

            let props = props!(DatetimeColumnStyleProps {
                enable_time_config: false,
                config,
                default_config,
                on_change,
            });

            self.modal = Some(ModalElement::new(self.elem.clone(), props, true));
        }

        ApiFuture::spawn(self.modal.as_apierror()?.clone().open(target, None));
        Ok(())
    }

    /// Remove this `ModalElement` from the DOM.
    pub fn close(&mut self) -> ApiResult<()> {
        self.modal.as_apierror()?.hide()
    }

    pub fn destroy(self) -> ApiResult<()> {
        self.modal.into_apierror()?.destroy()
    }

    /// DOM lifecycle method when connected.  We don't use this, as it can fire
    /// during innocuous events like re-parenting.
    pub fn connected_callback(&self) {}
}
