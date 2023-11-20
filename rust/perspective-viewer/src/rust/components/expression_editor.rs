// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

use std::rc::Rc;

use wasm_bindgen::prelude::*;
use web_sys::HtmlInputElement;
use yew::prelude::*;

use super::containers::split_panel::*;
use super::form::code_editor::*;
use super::style::LocalStyle;
use crate::js::PerspectiveValidationError;
use crate::session::Session;
use crate::*;

#[derive(Debug)]
pub enum ExpressionEditorMsg {
    Reset,
    Delete,
    SetExpr(Rc<String>),
    ValidateComplete(Option<PerspectiveValidationError>),
    SaveExpr,
    AliasChanged(InputEvent),
}

#[derive(Properties, PartialEq)]
pub struct ExpressionEditorProps {
    pub session: Session,
    pub on_save: Callback<(JsValue, String)>,
    pub on_validate: Callback<bool>,
    pub on_delete: Option<Callback<()>>,
    pub old_alias: Option<String>,
    pub disabled: bool,
}

pub fn get_new_column_name(session: &Session) -> String {
    let mut i = 0;
    loop {
        i += 1;
        let name = format!("New Column {i}");
        if session.metadata().get_column_table_type(&name).is_none() {
            return name;
        }
    }
}

impl ExpressionEditorProps {
    fn initial_expr(&self) -> Rc<String> {
        self.old_alias
            .as_ref()
            .and_then(|alias| self.session.metadata().get_expression_by_alias(alias))
            .unwrap_or_default()
            .into()
    }
}

/// Expression editor component `CodeEditor` and a button toolbar.
pub struct ExpressionEditor {
    save_enabled: bool,
    edit_enabled: bool,
    expr: Rc<String>,
    error: Option<PerspectiveValidationError>,
    alias_ref: NodeRef,
    alias: Option<String>,
}

impl Component for ExpressionEditor {
    type Message = ExpressionEditorMsg;
    type Properties = ExpressionEditorProps;

    fn create(ctx: &Context<Self>) -> Self {
        let mut alias = ctx.props().old_alias.clone();
        if alias.is_none() {
            alias = Some(get_new_column_name(&ctx.props().session));
        } else if let Some(alias2) = &alias && alias2 == &*ctx.props().initial_expr() {
            alias = None;
        }

        Self {
            save_enabled: false,
            edit_enabled: false,
            error: None,
            expr: ctx.props().initial_expr(),
            alias_ref: NodeRef::default(),
            alias,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            ExpressionEditorMsg::SetExpr(val) => {
                self.expr = val.clone();
                clone!(ctx.props().session);
                ctx.props().on_validate.emit(true);
                ctx.link().send_future(async move {
                    match session.validate_expr(&val).await {
                        Ok(x) => ExpressionEditorMsg::ValidateComplete(x),
                        Err(err) => {
                            web_sys::console::error_1(&err);
                            ExpressionEditorMsg::ValidateComplete(None)
                        },
                    }
                });

                true
            },
            ExpressionEditorMsg::ValidateComplete(err) => {
                self.error = err;
                if self.error.is_none() {
                    let is_edited = maybe!({
                        let alias = ctx.props().old_alias.as_ref()?;
                        let session = &ctx.props().session;
                        let old = session.metadata().get_expression_by_alias(alias)?;
                        let is_edited = *self.expr != old;
                        session
                            .metadata_mut()
                            .set_edit_by_alias(alias, self.expr.to_string());
                        Some(is_edited)
                    });

                    self.edit_enabled = is_edited.unwrap_or_default();
                    self.save_enabled = is_edited.unwrap_or(true);
                } else {
                    self.save_enabled = false;
                }

                ctx.props().on_validate.emit(false);
                true
            },
            ExpressionEditorMsg::Reset => {
                self.edit_enabled = false;
                self.save_enabled = false;
                maybe!({
                    let alias = ctx.props().old_alias.as_ref()?;
                    let session = &ctx.props().session;
                    let old = session.metadata().get_expression_by_alias(alias)?;
                    self.expr = old.into();
                    Some(())
                })
                .unwrap_or_default();

                true
            },
            ExpressionEditorMsg::SaveExpr => {
                if self.save_enabled {
                    let expr = self.expr.to_owned();
                    let alias = self.alias.clone().unwrap_or((*expr).clone());
                    ctx.props().on_save.emit((JsValue::from(&*expr), alias));
                }

                false
            },
            ExpressionEditorMsg::Delete => {
                if let Some(on_delete) = &ctx.props().on_delete {
                    on_delete.emit(());
                }

                false
            },
            ExpressionEditorMsg::AliasChanged(event) => {
                let value = event.target_unchecked_into::<HtmlInputElement>().value();
                self.alias = (!value.is_empty()).then_some(value);
                self.save_enabled =
                    self.error.is_none() && !(self.alias.is_none() && self.expr.is_empty());

                true
            },
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let reset = ctx.link().callback(|_| ExpressionEditorMsg::Reset);
        let delete = ctx.link().callback(|_| ExpressionEditorMsg::Delete);
        let save = ctx.link().callback(|_| ExpressionEditorMsg::SaveExpr);
        let oninput = ctx.link().callback(ExpressionEditorMsg::SetExpr);
        let onsave = ctx.link().callback(|()| ExpressionEditorMsg::SaveExpr);
        let on_alias_change = ctx.link().callback(ExpressionEditorMsg::AliasChanged);
        let alias_class = self.alias.is_none().then_some("errored");
        let is_closable = maybe! {
            let alias = ctx.props().old_alias.as_ref()?;
            Some(!ctx.props().session.is_column_expression_in_use(alias))
        }
        .unwrap_or_default();

        let disabled_class = ctx.props().disabled.then_some("disabled");
        clone!(ctx.props().disabled);

        let alias = if let Some(alias) = &self.alias && alias != &*self.expr {
            Some(alias.to_owned())
        } else {
            None
        };

        let placeholder = if alias.is_none() {
            let name = match self.expr.char_indices().nth(25) {
                None => self.expr.to_string(),
                Some((idx, _)) => self.expr[..idx].to_owned(),
            };

            Some(name)
        } else {
            None
        };

        html_template! {
            <LocalStyle href={ css!("expression-editor") } />
            <SplitPanel orientation={ Orientation::Vertical }>
                <>
                    <div style="display: flex; flex-direction: column;" id ="editor-alias-container">
                        <label class="item_title">{ "Name" }</label>
                        <input
                            id="expression-name"
                            type="search"
                            ref={ self.alias_ref.clone() }
                            oninput={ on_alias_change }
                            { placeholder }
                            { disabled }
                            value={ alias }
                            class={ alias_class }/>
                    </div>
                    <div>
                        <label class="item_title">{ "Expression" }</label>
                        <div id="editor-container" class={ disabled_class }>
                            <CodeEditor
                                expr={ &self.expr }
                                error={ self.error.clone().map(|x| x.into()) }
                                { disabled }
                                { oninput }
                                { onsave }/>

                            <div id="psp-expression-editor-actions">
                                if let Some(err) = &self.error {
                                    <div class="error">
                                        { &err.error_message }
                                    </div>
                                }

                                if is_closable {
                                    <button
                                        id="psp-expression-editor-button-delete"
                                        class="psp-expression-editor__button"
                                        onmousedown={ delete }>
                                        { "Delete" }
                                    </button>
                                }

                                if ctx.props().old_alias.is_some() {
                                    <button
                                        id="psp-expression-editor-button-reset"
                                        class="psp-expression-editor__button"
                                        onmousedown={ reset }
                                        disabled={ !self.edit_enabled }>
                                        { "Reset" }
                                    </button>
                                }

                                <button
                                    id="psp-expression-editor-button-save"
                                    class="psp-expression-editor__button"
                                    onmousedown={ save }
                                    disabled={ !self.save_enabled }>
                                    { "Save" }
                                </button>
                            </div>
                        </div>
                    </div>
                </>
                <></>
            </SplitPanel>
        }
    }

    fn changed(&mut self, ctx: &Context<Self>, old_props: &Self::Properties) -> bool {
        if ctx.props().old_alias != old_props.old_alias {
            self.expr = ctx.props().initial_expr();
        }
        self.alias = ctx
            .props()
            .old_alias
            .clone()
            .or_else(|| Some(get_new_column_name(&ctx.props().session)));
        true
    }
}
