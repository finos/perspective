////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::export_dropdown::*;
use crate::custom_elements::modal::*;
use crate::model::*;
use crate::utils::*;
use crate::*;

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;
use web_sys::*;
use yew::*;

use super::viewer::PerspectiveViewerElement;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ExportDropDownMenuElement {
    elem: HtmlElement,
    modal: Rc<RefCell<Option<ModalElement<ExportDropDownMenu>>>>,
}

#[wasm_bindgen]
impl ExportDropDownMenuElement {
    #[wasm_bindgen(constructor)]
    pub fn new(elem: HtmlElement) -> ExportDropDownMenuElement {
        ExportDropDownMenuElement {
            elem,
            modal: Default::default(),
        }
    }

    pub fn open(&self, target: HtmlElement) {
        if let Some(x) = &*self.modal.borrow() {
            x.open(target, None);
        }
    }

    pub fn hide(&self) -> Result<(), JsValue> {
        let borrowed = self.modal.borrow();
        borrowed.as_ref().into_jserror()?.hide()
    }

    #[allow(clippy::not_unsafe_ptr_arg_deref)]
    pub fn unsafe_set_model(&self, ptr: *const PerspectiveViewerElement) {
        let model = unsafe { ptr.as_ref().unwrap() };
        self.set_model(model);
    }

    pub fn connected_callback(&self) {}
}

impl ExportDropDownMenuElement {
    pub fn new_from_model<A: GetViewerConfigModel>(model: &A) -> ExportDropDownMenuElement {
        let document = window().unwrap().document().unwrap();
        let dropdown = document
            .create_element("perspective-export-menu")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        let elem = Self::new(dropdown);
        elem.set_model(model);
        elem
    }

    pub fn set_model<A: GetViewerConfigModel>(&self, model: &A) {
        let callback = Callback::from({
            let model = model.cloned();
            let modal_rc = self.modal.clone();
            move |x: ExportFile| {
                if !x.name.is_empty() {
                    clone!(modal_rc, model);
                    spawn_local(async move {
                        let val = model.export_method_to_jsvalue(x.method).await.unwrap();
                        download(&x.as_filename(), &val).unwrap();
                        modal_rc.borrow().clone().unwrap().hide().unwrap();
                    })
                }
            }
        });

        let renderer = model.renderer().clone();
        let props = props!(ExportDropDownMenuProps { renderer, callback });
        let modal = ModalElement::new(self.elem.clone(), props, true);
        *self.modal.borrow_mut() = Some(modal);
    }
}
