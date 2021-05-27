////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::rc::Rc;

use crate::custom_elements::modal::*;
use crate::{components::expression_editor::*, session::Session};

use wasm_bindgen::prelude::*;
use web_sys::*;
use yew::prelude::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveExpressionEditorElement {
    modal: ModalElement<ExpressionEditor>,
}

impl ResizableMessage for <ExpressionEditor as Component>::Message {
    fn resize(y: u32, x: u32) -> Self {
        ExpressionEditorMsg::SetPos(y, x)
    }
}

impl PerspectiveExpressionEditorElement {
    pub fn new(
        target: HtmlElement,
        session: Session,
        callback: Rc<dyn Fn(JsValue)>,
    ) -> PerspectiveExpressionEditorElement {
        let props = ExpressionEditorProps { callback, session };
        let modal = ModalElement::new(target, props);
        PerspectiveExpressionEditorElement {
            modal,
        }
    }

    pub fn open(&mut self, target: HtmlElement) -> Result<(), JsValue> {
        self.modal.open(target)
    }

    pub fn close(&mut self) -> Result<(), JsValue> {
        self.modal.close()
    }

    pub fn connected_callback(&self) {}
}
