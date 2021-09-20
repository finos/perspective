////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::exprtk::*;
use crate::js::monaco::*;
use crate::js::perspective::*;
use crate::session::Session;
use crate::utils::*;

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::{prelude::*, JsCast};
use wasm_bindgen_futures::future_to_promise;
use web_sys::*;
use yew::prelude::*;

static CSS: &str = include_str!("../../../dist/css/expression-editor.css");

pub enum ExpressionEditorMsg {
    SetPos(i32, i32),
    SetContent(String),
    SetTheme(String),
    Validate(JsValue),
    EnableSave(bool),
    SaveExpr,
}

#[derive(Properties, Clone)]
pub struct ExpressionEditorProps {
    pub on_save: Callback<JsValue>,
    pub on_init: Callback<()>,
    pub on_validate: Callback<bool>,
    pub session: Session,
}

/// A label widget which displays a row count and a "projection" count, the number of
/// rows in the `View` which includes aggregate rows.
#[derive(Clone)]
pub struct ExpressionEditor {
    top: i32,
    left: i32,
    container: NodeRef,
    editor: Rc<RefCell<Option<(Editor, JsMonacoEditor)>>>,
    props: ExpressionEditorProps,
    link: ComponentLink<Self>,
    save_enabled: bool,
    expression: Rc<RefCell<Option<String>>>,
    on_validate: Rc<Closure<dyn Fn(JsValue)>>,
    on_save: Rc<Closure<dyn Fn(JsValue)>>,
    theme: Rc<RefCell<Option<String>>>,
}

impl Component for ExpressionEditor {
    type Message = ExpressionEditorMsg;
    type Properties = ExpressionEditorProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        let on_validate =
            Rc::new(link.callback(ExpressionEditorMsg::Validate).into_closure());
        let on_save = Rc::new(
            link.callback(|_| ExpressionEditorMsg::SaveExpr)
                .into_closure(),
        );

        ExpressionEditor {
            top: 0,
            left: 0,
            container: NodeRef::default(),
            editor: Rc::new(RefCell::new(None)),
            expression: Rc::new(RefCell::new(None)),
            props,
            link,
            save_enabled: false,
            on_validate,
            on_save,
            theme: Rc::new(RefCell::new(None)),
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            ExpressionEditorMsg::SetPos(top, left) => {
                self.top = top;
                self.left = left;
                if let Some((_, x)) = self.editor.borrow().as_ref() {
                    x.set_value("");
                }

                true
            }
            ExpressionEditorMsg::Validate(_val) => {
                let _promise = future_to_promise(self.clone().validate_expr());
                false
            }
            ExpressionEditorMsg::EnableSave(x) => {
                self.props.on_validate.emit(false);
                self.save_enabled = x;
                true
            }
            ExpressionEditorMsg::SetContent(expr) => {
                if let Some((_, ref editor)) = *self.editor.borrow() {
                    editor.set_value(&expr);
                } else {
                    *self.expression.borrow_mut() = Some(expr);
                }

                false
            }
            ExpressionEditorMsg::SetTheme(theme) => {
                if let Some((ref editor, _)) = *self.editor.borrow() {
                    init_theme(theme.as_str(), editor);
                }

                *self.theme.borrow_mut() = Some(theme);
                false
            }
            ExpressionEditorMsg::SaveExpr => {
                if self.save_enabled {
                    match self.editor.borrow().as_ref() {
                        None => {}
                        Some((_, x)) => {
                            let expr = x.get_value();
                            self.props.on_save.emit(expr);
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
            let _promise = future_to_promise(self.clone().init_monaco_editor());
        } else if self.editor.borrow().is_some() {
            self.editor.borrow().as_ref().unwrap().1.focus();
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
                <div id="monaco-container" ref={ self.container.clone() } style=""></div>
                <div id="psp-expression-editor-actions">
                    <button
                        id="psp-expression-editor-button-save"
                        class="psp-expression-editor__button"
                        onmousedown={ click }
                        disabled={ !self.save_enabled }>
                        { "Save" }
                    </button>
                </div>
            </>
        }
    }
}

impl ExpressionEditor {
    /// Initialize the `monaco-editor` for this `<perspective-expression-editor>`.
    /// This method should only be called once per element.
    async fn init_monaco_editor(self) -> Result<JsValue, JsValue> {
        let column_names = self.props.session.metadata().get_table_columns();
        let monaco = init_monaco().await.unwrap();
        if let Some(ref theme) = *self.theme.borrow() {
            init_theme(theme.as_str(), &monaco);
        }

        set_global_completion_column_names(column_names.into_jserror()?);
        let args = EditorArgs {
            theme: "exprtk-theme",
            value: "",
            language: "exprtk",
            automatic_layout: true,
            minimap: MinimapArgs { enabled: false },
        };

        let container = self.container.cast::<HtmlElement>().unwrap();
        let editor_args = JsValue::from_serde(&args).unwrap();
        let editor = monaco.create(container, editor_args);
        let cmd = (KeyMod::Shift as u32) | (KeyCode::Enter as u32);
        editor.add_command(cmd, self.on_save.as_ref().as_ref().unchecked_ref());
        let cb = self.on_validate.as_ref().as_ref().unchecked_ref();
        editor.get_model().on_did_change_content(cb);
        *self.editor.borrow_mut() = Some((monaco, editor.clone()));
        await_animation_frame().await?;
        editor.focus();
        self.props.on_init.emit(());
        if let Some(expr) = self.expression.borrow_mut().take() {
            editor.set_value(&expr);
        }

        Ok(JsValue::UNDEFINED)
    }

    /// Validate the editor's current value, and toggle the Save button state
    /// if the expression is valid.
    async fn validate_expr(self) -> Result<JsValue, JsValue> {
        let (monaco, editor) = self.editor.borrow().as_ref().unwrap().clone();
        let expr = editor.get_value();
        self.props.on_validate.emit(true);
        let model = editor.get_model();
        let (msg, arr) = match self.props.session.validate_expr(expr).await? {
            None => (true, js_sys::Array::new()),
            Some(err) => {
                let marker = error_to_market(err);
                let args = JsValue::from_serde(&marker).unwrap();
                let arr = [args].iter().collect::<js_sys::Array>();
                (false, arr)
            }
        };

        monaco.set_model_markers(&model, "exprtk", &arr);
        self.link.send_message(ExpressionEditorMsg::EnableSave(msg));
        Ok(JsValue::UNDEFINED)
    }
}

fn error_to_market(err: PerspectiveValidationError) -> JsMonacoModelMarker<'static> {
    JsMonacoModelMarker {
        code: "".to_owned(),
        start_line_number: err.line + 1,
        end_line_number: err.line + 1,
        start_column: err.column,
        end_column: err.column,
        severity: "error",
        message: err.error_message,
    }
}
