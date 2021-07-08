////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::custom_elements::modal::*;
use crate::*;
use crate::{components::expression_editor::*, session::Session};

use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
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
        session: Session,
        on_save: Rc<dyn Fn(JsValue)>,
        monaco_theme: String,
    ) -> PerspectiveExpressionEditorElement {
        let document = window().unwrap().document().unwrap();
        let editor = document
            .create_element("perspective-expression-editor")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        editor
            .toggle_attribute_with_force("initializing", true)
            .unwrap();

        let on_init = {
            clone!(editor);
            Rc::new(move || {
                editor
                    .toggle_attribute_with_force("initializing", false)
                    .unwrap();
            })
        };

        let on_validate = {
            clone!(editor);
            Rc::new(move |valid| {
                editor
                    .toggle_attribute_with_force("validating", valid)
                    .unwrap();
            })
        };

        let props = ExpressionEditorProps {
            on_save,
            on_init,
            on_validate,
            monaco_theme,
            session,
        };

        let modal = ModalElement::new(editor, props);
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
