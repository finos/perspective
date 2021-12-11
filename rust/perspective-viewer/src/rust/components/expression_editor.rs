////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::containers::split_panel::*;
use crate::exprtk::*;
use crate::js::monaco::*;
use crate::js::perspective::*;
use crate::session::Session;
use crate::utils::*;
use crate::*;

use std::cell::RefCell;
use std::convert::TryFrom;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::{prelude::*, JsCast};
use wasm_bindgen_futures::future_to_promise;
use web_sys::*;
use yew::prelude::*;

static CSS: &str = include_str!("../../../build/css/expression-editor.css");

pub enum ExpressionEditorMsg {
    SetPos(i32, i32),
    SetTheme(String),
    Reset,
    Resize(i32, i32),
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
    pub alias: Option<String>,
}

/// Expression editor component wraps `monaco-editor` and a button toolbar.
pub struct ExpressionEditor {
    top: i32,
    left: i32,
    save_enabled: bool,
    edit_enabled: bool,
    state: ExpressionEditorState,
}

impl Component for ExpressionEditor {
    type Message = ExpressionEditorMsg;
    type Properties = ExpressionEditorProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        let state = ExpressionEditorState::new(link, props);
        ExpressionEditor {
            top: 0,
            left: 0,
            save_enabled: false,
            edit_enabled: false,
            state,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            ExpressionEditorMsg::SetPos(top, left) => {
                self.top = top;
                self.left = left;
                true
            }
            ExpressionEditorMsg::Validate(_val) => {
                drop(future_to_promise(self.state.clone().validate_expr()));
                false
            }

            ExpressionEditorMsg::Resize(width, height) => {
                self.state.set_dimensions(width, height);
                false
            }
            ExpressionEditorMsg::Reset => {
                self.edit_enabled = false;
                self.save_enabled = false;
                maybe!({
                    let alias = self.state.props.alias.as_ref()?;
                    let session = &self.state.props.session;
                    let old = session.metadata().get_expression_by_alias(alias)?;
                    self.state.editor.borrow().as_ref()?.1.set_value(&old);
                    Some(())
                })
                .unwrap_or_default();

                true
            }
            ExpressionEditorMsg::EnableSave(x) => {
                self.state.props.on_validate.emit(false);
                let is_edited = maybe!({
                    let alias = self.state.props.alias.as_ref()?;
                    let session = &self.state.props.session;
                    let old = session.metadata().get_expression_by_alias(alias)?;
                    let value = self.state.editor.borrow().as_ref()?.1.get_value();
                    let new = value.as_string()?;
                    let is_edited = new != old;
                    session.metadata_mut().set_edit_by_alias(alias, new);
                    Some(is_edited)
                });

                self.edit_enabled = is_edited.unwrap_or_default();
                self.save_enabled = x && is_edited.unwrap_or(true);
                true
            }
            ExpressionEditorMsg::SetTheme(theme) => {
                if let Some((ref editor, _)) = *self.state.editor.borrow() {
                    init_theme(theme.as_str(), editor);
                }

                *self.state.theme.borrow_mut() = Some(theme);
                false
            }
            ExpressionEditorMsg::SaveExpr => {
                if self.save_enabled {
                    if let Some((_, x)) = self.state.editor.borrow().as_ref() {
                        let expr = x.get_value();
                        self.state.props.on_save.emit(expr);
                        x.set_value("");
                    }
                }
                false
            }
        }
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        web_sys::console::warn_1(&"Unreachable".into());
        false
    }

    fn rendered(&mut self, first_render: bool) {
        if first_render {
            drop(future_to_promise(self.state.clone().init_monaco_editor()));
        } else if self.state.0.editor.borrow().is_some() {
            self.state.editor.borrow().as_ref().unwrap().1.focus();
        }
    }

    fn view(&self) -> Html {
        let reset = self.state.link.callback(|_| ExpressionEditorMsg::Reset);
        let save = self
            .state
            .link
            .callback_once(|_| ExpressionEditorMsg::SaveExpr);

        let resize = self
            .state
            .link
            .callback(|(width, height)| ExpressionEditorMsg::Resize(width, height));

        html! {
            <>
                <style>
                    { &CSS }
                    { format!(":host{{left:{}px;top:{}px;}}", self.left, self.top) }
                </style>
                <SplitPanel id="expression-editor-split-panel" on_resize={ resize }>
                    <div id="editor-container">
                        <div id="monaco-container" ref={ self.state.container.clone() } style=""></div>
                        <div id="psp-expression-editor-actions">
                            <button
                                id="psp-expression-editor-button-reset"
                                class="psp-expression-editor__button"
                                onmousedown={ reset }
                                disabled={ !self.edit_enabled }>
                                { if self.edit_enabled { "Reset" } else { "" } }
                            </button>
                            <button
                                id="psp-expression-editor-button-save"
                                class="psp-expression-editor__button"
                                onmousedown={ save }
                                disabled={ !self.save_enabled }>
                                { if self.save_enabled { "Save" } else { "" } }
                            </button>
                        </div>
                    </div>
                    <div>

                    </div>
                </SplitPanel>
            </>
        }
    }
}

struct ExpressionEditorStateImpl {
    editor: RefCell<Option<(Editor, JsMonacoEditor)>>,
    props: ExpressionEditorProps,
    on_validate: Closure<dyn Fn(JsValue)>,
    on_save: Closure<dyn Fn(JsValue)>,
    link: ComponentLink<ExpressionEditor>,
    theme: RefCell<Option<String>>,
    container: NodeRef,
}

/// `ExpressionEditorState` is useful to separate from `ExpressionEditor` to
/// group async-needed state together and minimize ref counting.
#[derive(Clone)]
struct ExpressionEditorState(Rc<ExpressionEditorStateImpl>);

impl Deref for ExpressionEditorState {
    type Target = ExpressionEditorStateImpl;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl ExpressionEditorState {
    fn new(
        link: ComponentLink<ExpressionEditor>,
        props: ExpressionEditorProps,
    ) -> Self {
        let on_validate = link.callback(ExpressionEditorMsg::Validate).into_closure();
        let on_save = link
            .callback(|_| ExpressionEditorMsg::SaveExpr)
            .into_closure();

        ExpressionEditorState(Rc::new(ExpressionEditorStateImpl {
            container: NodeRef::default(),
            editor: RefCell::new(None),
            link,
            props,
            on_save,
            on_validate,
            theme: RefCell::new(None),
        }))
    }

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
        *self.editor.borrow_mut() = Some((monaco, editor.clone()));
        await_animation_frame().await?;
        editor.focus();
        self.props.on_init.emit(());
        let expression = maybe!({
            let alias = self.props.alias.as_ref()?;
            let edit = self.props.session.metadata().get_edit_by_alias(alias);
            edit.or_else(|| {
                self.props.session.metadata().get_expression_by_alias(alias)
            })
        });

        if let Some(expr) = expression.as_ref() {
            editor.set_value(expr);
            drop(self.clone().validate_expr().await?);
        } else {
            self.set_default_content();
        }

        editor.get_model().on_did_change_content(cb);
        Ok(JsValue::UNDEFINED)
    }

    fn set_default_content(&self) {
        if let Some((_, x)) = self.editor.borrow().as_ref() {
            let mut i = 1;
            let mut name = "New Column 1".to_owned();
            let config = self.props.session.metadata();
            while config.get_column_table_type(&name).is_some() {
                i += 1;
                name = format!("New Column {}", i);
            }

            x.set_value(&format!("// {}\n", name));
            x.set_position(
                &JsValue::from_serde(&PositionArgs {
                    column: 1,
                    line_number: 2,
                })
                .unwrap(),
            );
        }
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
                let marker = error_to_marker(err);
                let args = JsValue::from_serde(&marker).unwrap();
                let arr = [args].iter().collect::<js_sys::Array>();
                (false, arr)
            }
        };

        monaco.set_model_markers(&model, "exprtk", &arr);
        self.link.send_message(ExpressionEditorMsg::EnableSave(msg));
        Ok(JsValue::UNDEFINED)
    }

    // Ideally we'd set the monaco dimension explicitly, but the API
    // does not provide independent width/height updates, nor a
    // convenient way to get the current dimensions (need to select the
    // underlying element from the DOM).  Luckily `.layout()` will
    // determine these automatically if no arguments are supplied, but
    // it may not always be the case that we want the editor to fill
    // just its container.
    fn set_dimensions(&self, _width: i32, _height: i32) {
        if let Some((_, ref editor)) = *self.editor.borrow() {
            editor.layout(
                &JsValue::UNDEFINED,
                // &JsValue::from_serde(&ResizeArgs { width, height }).unwrap(),
            );
        };
    }
}

fn error_to_marker(err: PerspectiveValidationError) -> JsMonacoModelMarker<'static> {
    JsMonacoModelMarker {
        code: "".to_owned(),
        start_line_number: u32::try_from(err.line + 1).unwrap_or(0),
        end_line_number: u32::try_from(err.line + 1).unwrap_or(0),
        start_column: u32::try_from(err.column).unwrap_or(0),
        end_column: u32::try_from(err.column).unwrap_or(0),
        severity: "error",
        message: err.error_message,
    }
}
