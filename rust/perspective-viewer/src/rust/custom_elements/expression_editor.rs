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
use crate::utils::*;
use crate::*;

use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ExpressionEditorElement {
    modal: ModalElement<ExpressionEditor>,
    resize_pubsub: Rc<PubSub<()>>,
}

impl ExpressionEditorElement {
    pub fn new(
        session: Session,
        on_save: Callback<JsValue>,
        alias: Option<String>,
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

        let resize_pubsub: PubSub<()> = PubSub::default();
        let props = props!(ExpressionEditorProps {
            on_save,
            on_init,
            on_validate,
            on_resize: resize_pubsub.callback(),
            session,
            alias,
        });

        let modal = ModalElement::new(editor, props, true);
        ExpressionEditorElement {
            modal,
            resize_pubsub: Rc::new(resize_pubsub),
        }
    }

    pub fn open(&mut self, target: HtmlElement) {
        let monaco_theme = get_theme(&target);
        self.modal
            .send_message(ExpressionEditorMsg::SetTheme(monaco_theme));
        self.modal.open(target, Some(&*self.resize_pubsub));
    }

    pub fn hide(&self) -> ApiResult<()> {
        self.modal.hide()
    }

    pub fn destroy(self) -> ApiResult<()> {
        self.modal.destroy()
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
