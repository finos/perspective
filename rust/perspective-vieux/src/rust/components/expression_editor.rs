/////////////////////////////////////////////////////////, kind: (), insert_text: (), insert_text_rules: (), documentation: () ///////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

// use crate::*;
// use crate::utils::WeakComponentLink;
use crate::utils::monaco::*;
use crate::{exprtk::*, session::Session};

use std::rc::Rc;

use wasm_bindgen::{prelude::*, JsCast};
use wasm_bindgen_futures::future_to_promise;
use web_sys::*;
use yew::prelude::*;

pub static CSS: &str = include_str!("../../../dist/css/expression-editor.css");

pub enum ExpressionEditorMsg {
    SetPos(u32, u32),
    Validate(JsValue),
    EnableSave(bool),
    SaveExpr,
}

#[derive(Properties, Clone)]
pub struct ExpressionEditorProps {
    pub callback: Rc<dyn Fn(JsValue)>,
    pub session: Session,
}

/// A label widget which displays a row count and a "projection" count, the number of
/// rows in the `View` which includes aggregate rows.
pub struct ExpressionEditor {
    top: u32,
    left: u32,
    container: NodeRef,
    editor: Option<MonacoEditor>,
    props: ExpressionEditorProps,
    link: ComponentLink<Self>,
    save_enabled: bool,
    on_validate_callback: Closure<dyn Fn(JsValue)>,
    on_save_callback: Closure<dyn Fn(JsValue)>,
}

async fn proc(
    session: Session,
    expr: JsValue,
    callback: Callback<bool>,
) -> Result<JsValue, JsValue> {
    let result = session.clone().validate_expr(expr).await?;
    // web_sys::console::log_1(&result);
    let error_count = js_sys::Object::keys(&result.errors()).length();
    callback.emit(error_count == 0);
    Ok(JsValue::UNDEFINED)
}

impl Component for ExpressionEditor {
    type Message = ExpressionEditorMsg;
    type Properties = ExpressionEditorProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        let cb = link.callback(|x| ExpressionEditorMsg::Validate(x));
        let on_validate_callback = Closure::wrap(Box::new(move |x| {
            cb.emit(x);
        }) as Box<dyn Fn(JsValue)>);

        let cb = link.callback(|_| ExpressionEditorMsg::SaveExpr);
        let on_save_callback = Closure::wrap(Box::new(move |x| {
            cb.emit(x);
        }) as Box<dyn Fn(JsValue)>);

        ExpressionEditor {
            top: 0,
            left: 0,
            container: NodeRef::default(),
            editor: None,
            props,
            link,
            save_enabled: false,
            on_validate_callback,
            on_save_callback,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            ExpressionEditorMsg::SetPos(top, left) => {
                self.top = top;
                self.left = left;
                match self.editor.as_ref() {
                    Some(x) => x.set_value(""),
                    None => {}
                }

                true
            }
            ExpressionEditorMsg::Validate(_val) => {
                // web_sys::console::log_1(&val);
                let expr = self.editor.as_ref().unwrap().get_value();
                let callback = self
                    .link
                    .callback_once(|x| ExpressionEditorMsg::EnableSave(x));
                let _ =
                    future_to_promise(proc(self.props.session.clone(), expr, callback));
                false
            }
            ExpressionEditorMsg::EnableSave(x) => {
                self.save_enabled = x;
                true
            }
            ExpressionEditorMsg::SaveExpr => {
                if self.save_enabled {
                    match self.editor.as_ref() {
                        None => {}
                        Some(x) => {
                            let expr = x.get_value();
                            (self.props.callback)(expr);
                            x.set_value("");
                        }
                    }
                }
                false
            }
        }
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        true
    }

    fn rendered(&mut self, first_render: bool) {
        if first_render {
            init_monaco().unwrap();
            let args = EditorArgs {
                theme: "exprtk-theme",
                value: "",
                language: "exprtk",
                automatic_layout: true,
                minimap: MinimapArgs { enabled: false },
            };

            let container = self.container.cast::<HtmlElement>().unwrap();
            let editor = Editor::create(container, JsValue::from_serde(&args).unwrap());
            editor.add_command(
                (KeyMod::Shift as u32) | (KeyCode::Enter as u32),
                self.on_save_callback.as_ref().unchecked_ref(),
            );

            let model = editor.get_model();
            model.on_did_change_content(
                self.on_validate_callback.as_ref().unchecked_ref(),
            );

            self.editor = Some(editor.clone());
            let on_init = Closure::once_into_js(move || editor.focus());
            web_sys::window()
                .unwrap()
                .request_animation_frame(on_init.unchecked_ref())
                .unwrap();
        } else {
            self.editor.as_ref().unwrap().focus();
        }
    }

    fn view(&self) -> Html {
        let click = self.link.callback_once(|_| ExpressionEditorMsg::SaveExpr);
        html! {
            <>
                <style>
                    { &CSS }
                    { format!(":host{{left:{}px;top:{}px;}}", self.left, self.top) }
                </style>
                <div ref={ self.container.clone() } style="width:400px;height:200px;resize:both;overflow:auto"></div>
                <div id="psp-expression-editor-actions">
                    <button
                        id="psp-expression-editor-button-save"
                        class="psp-expression-editor__button"
                        onclick={ click }
                        disabled={ !self.save_enabled }>
                        { "Save" }
                    </button>
                </div>
            </>
        }
    }
}
