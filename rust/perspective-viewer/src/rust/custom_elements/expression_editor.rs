////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::rc::Rc;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::*;

use crate::components::expression_editor::*;
use crate::custom_elements::modal::*;
use crate::session::Session;
use crate::utils::*;
use crate::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ExpressionEditorElement {
    modal: ModalElement<ExpressionEditor>,
    _blur: Rc<Blur>,
}

struct Blur {
    elem: HtmlElement,
    handler: Closure<dyn Fn(web_sys::FocusEvent)>,
}

impl Drop for Blur {
    fn drop(&mut self) {
        let cb = self.handler.as_ref().as_ref().unchecked_ref();
        self.elem
            .remove_event_listener_with_callback("blur", cb)
            .unwrap();
    }
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

        let on_validate = Callback::from({
            clone!(editor);
            move |valid| {
                editor
                    .toggle_attribute_with_force("validating", valid)
                    .unwrap();
            }
        });

        let props = props!(ExpressionEditorProps {
            on_save,
            on_validate,
            session,
            alias,
        });

        let modal = ModalElement::new(editor.clone(), props, true);
        let blurhandler = {
            clone!(modal);
            move |_event: FocusEvent| {
                clone!(modal);
                ApiFuture::spawn(async move {
                    await_animation_frame().await?;
                    modal.send_message(ExpressionEditorMsg::Render);
                    Ok(())
                });
            }
        }
        .into_closure();

        let cb = blurhandler.as_ref().as_ref().unchecked_ref();
        editor.add_event_listener_with_callback("blur", cb).unwrap();
        let _blur = Rc::new(Blur {
            handler: blurhandler,
            elem: editor.clone(),
        });

        ExpressionEditorElement { modal, _blur }
    }

    pub fn open(&mut self, target: HtmlElement) {
        clone!(self.modal);
        ApiFuture::spawn(async move {
            modal.clone().open(target, None).await?;
            modal.send_message(ExpressionEditorMsg::Render);
            Ok(())
        });
    }

    pub fn hide(&self) -> ApiResult<()> {
        self.modal.hide()
    }

    pub fn destroy(self) -> ApiResult<()> {
        self.modal.destroy()
    }

    /// Reset the editor state to "empty" (the "New Column X" title is dependent
    /// on the number of expressions stored in the current `Session`).
    pub fn reset_empty_expr(&self) {
        self.modal.send_message(ExpressionEditorMsg::SetExprDefault);
    }

    pub fn connected_callback(&self) {}
}
