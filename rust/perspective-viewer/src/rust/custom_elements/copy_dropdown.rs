////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::copy_dropdown::*;
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
pub struct CopyDropDownMenuElement {
    modal: ModalElement<CopyDropDownMenu>,
}

impl ResizableMessage for <CopyDropDownMenu as Component>::Message {
    fn resize(y: i32, x: i32, _: bool) -> Self {
        CopyDropDownMenuMsg::SetPos(y, x)
    }
}

impl CopyDropDownMenuElement {
    pub fn new(session: Session, renderer: Renderer) -> CopyDropDownMenuElement {
        let document = window().unwrap().document().unwrap();
        let dropdown = document
            .create_element("perspective-copy-dropdown")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        let modal_rc: Rc<RefCell<Option<ModalElement<CopyDropDownMenu>>>> = Default::default();

        let callback = Callback::from({
            let modal_rc = modal_rc.clone();
            let renderer = renderer.clone();
            move |x: ExportMethod| {
                let js_task = (&session, &renderer).export_method_to_jsvalue(x);
                let copy_task = copy_to_clipboard(js_task, x.mimetype());
                let modal = modal_rc.borrow().clone().unwrap();
                spawn_local(async move {
                    let result = copy_task.await;
                    crate::js_log_maybe!({
                        result?;
                        modal.hide()?;
                    })
                })
            }
        });

        let props = CopyDropDownMenuProps { renderer, callback };
        let modal = ModalElement::new(dropdown, props, true);
        *modal_rc.borrow_mut() = Some(modal.clone());
        CopyDropDownMenuElement { modal }
    }

    pub fn open(&self, target: HtmlElement) {
        self.modal.open(target, None);
    }

    pub fn hide(&self) -> Result<(), JsValue> {
        self.modal.hide()
    }

    pub fn connected_callback(&self) {}
}
