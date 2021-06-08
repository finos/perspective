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
        custom_element: HtmlElement,
        session: Session,
        on_save: Rc<dyn Fn(JsValue)>,
        on_init: Rc<dyn Fn()>,
        on_validate: Rc<dyn Fn(bool)>,
        monaco_theme: String
    ) -> PerspectiveExpressionEditorElement {
        let props = ExpressionEditorProps {
            on_save,
            on_init,
            on_validate,
            monaco_theme,
            session,
        };

        let modal = ModalElement::new(custom_element, props);
        PerspectiveExpressionEditorElement { modal }
    }

    pub fn open(&mut self, target: HtmlElement) -> Result<(), JsValue> {
        self.modal.open(target)
    }

    pub fn close(&mut self) -> Result<(), JsValue> {
        self.modal.close()
    }

    pub fn connected_callback(&self) {}
}
