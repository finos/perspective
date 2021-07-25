////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::expression_editor::*;
use crate::custom_elements::modal::*;
use crate::session::Session;
use crate::*;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::prelude::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ExpressionEditorElement {
    modal: ModalElement<ExpressionEditor>,
}

impl ResizableMessage for <ExpressionEditor as Component>::Message {
    fn resize(y: u32, x: u32) -> Self {
        ExpressionEditorMsg::SetPos(y, x)
    }
}

impl ExpressionEditorElement {
    pub fn new(
        session: Session,
        on_save: Callback<JsValue>,
    ) -> ExpressionEditorElement {
        let document = window().unwrap().document().unwrap();
        let editor = document
            .create_element("perspective-expression-editor")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        editor
            .toggle_attribute_with_force("initializing", true)
            .unwrap();

        let on_init = Callback::from({
            clone!(editor);
            move |_| {
                editor
                    .toggle_attribute_with_force("initializing", false)
                    .unwrap();
            }
        });

        let on_validate = Callback::from({
            clone!(editor);
            move |valid| {
                editor
                    .toggle_attribute_with_force("validating", valid)
                    .unwrap();
            }
        });

        let props = ExpressionEditorProps {
            on_save,
            on_init,
            on_validate,
            session,
        };

        let modal = ModalElement::new(editor, props, true);
        ExpressionEditorElement { modal }
    }

    pub fn open(&mut self, target: HtmlElement) {
        let monaco_theme = get_theme(&target);
        self.modal
            .send_message(ExpressionEditorMsg::SetTheme(monaco_theme));
        self.modal.open(target);
    }

    pub fn destroy(self) -> Result<(), JsValue> {
        self.modal.destroy()
    }

    pub fn set_content(&self, content: &str) {
        self.modal
            .send_message(ExpressionEditorMsg::SetContent(content.to_owned()));
    }

    pub fn connected_callback(&self) {}
}

fn get_theme(elem: &HtmlElement) -> String {
    let styles = window().unwrap().get_computed_style(elem).unwrap().unwrap();
    match &styles.get_property_value("--monaco-theme") {
        Err(_) => "vs",
        Ok(ref s) if s.trim() == "" => "vs",
        Ok(x) => x.trim(),
    }
    .to_owned()
}
