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

#[wasm_bindgen]
#[derive(Clone)]
pub struct ExportDropDownMenuElement {
    modal: ModalElement<ExportDropDownMenu>,
}

impl ExportDropDownMenuElement {
    pub fn new<A: GetViewerConfigModel>(model: &A) -> ExportDropDownMenuElement {
        let document = window().unwrap().document().unwrap();
        let dropdown = document
            .create_element("perspective-export-dropdown")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        let modal_rc: Rc<RefCell<Option<ModalElement<ExportDropDownMenu>>>> = Default::default();

        let callback = Callback::from({
            let model = model.cloned();
            let modal_rc = modal_rc.clone();
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
        let modal = ModalElement::new(dropdown, props, true);
        *modal_rc.borrow_mut() = Some(modal.clone());
        ExportDropDownMenuElement { modal }
    }

    pub fn open(&self, target: HtmlElement) {
        self.modal.open(target, None);
    }

    pub fn hide(&self) -> Result<(), JsValue> {
        self.modal.hide()
    }

    pub fn connected_callback(&self) {}
}
