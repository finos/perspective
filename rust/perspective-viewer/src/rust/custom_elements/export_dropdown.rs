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
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::*;

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;
use web_sys::*;
use yew::prelude::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ExportDropDownMenuElement {
    modal: ModalElement<ExportDropDownMenu>,
}

impl ResizableMessage for <ExportDropDownMenu as Component>::Message {
    fn resize(y: i32, x: i32, _: bool) -> Self {
        ExportDropDownMenuMsg::SetPos(y, x)
    }
}

impl ExportDropDownMenuElement {
    pub fn new(session: Session, renderer: Renderer) -> ExportDropDownMenuElement {
        let document = window().unwrap().document().unwrap();
        let dropdown = document
            .create_element("perspective-export-dropdown")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        let modal_rc: Rc<RefCell<Option<ModalElement<ExportDropDownMenu>>>> = Default::default();

        let callback = Callback::from({
            let modal_rc = modal_rc.clone();
            let renderer = renderer.clone();
            move |x: ExportFile| {
                if !x.name.is_empty() {
                    let session = session.clone();
                    let renderer = renderer.clone();
                    let modal = modal_rc.borrow().clone().unwrap();
                    spawn_local(async move {
                        let val = (&session, &renderer)
                            .export_method_to_jsvalue(x.method)
                            .await
                            .unwrap();
                        download(&x.as_filename(), &val).unwrap();
                        modal.hide().unwrap();
                    })
                }
            }
        });

        let props = ExportDropDownMenuProps { renderer, callback };
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
