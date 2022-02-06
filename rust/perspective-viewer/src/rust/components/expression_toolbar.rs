////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::custom_elements::expression_editor::ExpressionEditorElement;
use crate::dragdrop::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::*;

use wasm_bindgen_futures::spawn_local;
use web_sys::*;
use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct ExpressionToolbarProps {
    pub name: String,
    pub add_expression_ref: NodeRef,
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,
}

impl PartialEq for ExpressionToolbarProps {
    fn eq(&self, _rhs: &Self) -> bool {
        false
    }
}

derive_session_renderer_model!(ExpressionToolbarProps);

impl ExpressionToolbarProps {
    pub async fn save_expr(&self, expression: &JsValue) {
        let update = self
            .session
            .create_replace_expression_update(&self.name, expression)
            .await;

        self.update_and_render(update);
    }

    pub fn close_expr(&self) {
        let expression = self
            .session
            .metadata()
            .get_expression_by_alias(&self.name)
            .unwrap();

        let ViewConfig {
            mut expressions, ..
        } = self.session.get_view_config();

        expressions.retain(|x| x != &expression);
        self.update_and_render(ViewConfigUpdate {
            expressions: Some(expressions),
            ..ViewConfigUpdate::default()
        });
    }

    fn is_closable(&self) -> bool {
        !self.session.is_column_expression_in_use(&self.name)
    }
}

pub enum ExpressionToolbarMsg {
    Edit,
    Save(JsValue),
    Close,
}

pub struct ExpressionToolbar {
    expression_editor: Option<ExpressionEditorElement>,
}

impl Component for ExpressionToolbar {
    type Message = ExpressionToolbarMsg;
    type Properties = ExpressionToolbarProps;

    fn create(_ctx: &Context<Self>) -> Self {
        ExpressionToolbar {
            expression_editor: None,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: ExpressionToolbarMsg) -> bool {
        match msg {
            ExpressionToolbarMsg::Close => {
                ctx.props().close_expr();
                false
            }
            ExpressionToolbarMsg::Save(expression) => {
                let props = ctx.props().clone();
                let expression_editor = self.expression_editor.take();
                spawn_local(async move {
                    props.save_expr(&expression).await;
                    expression_editor
                        .and_then(|elem| elem.destroy().ok())
                        .unwrap();
                });

                false
            }
            ExpressionToolbarMsg::Edit => {
                let on_save = ctx.link().callback(ExpressionToolbarMsg::Save);
                let target = ctx
                    .props()
                    .add_expression_ref
                    .cast::<HtmlElement>()
                    .unwrap();

                let mut element = ExpressionEditorElement::new(
                    ctx.props().session.clone(),
                    on_save,
                    Some(ctx.props().name.to_owned()),
                );

                element.open(target);
                self.expression_editor = Some(element);
                false
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let edit = ctx.link().callback(|_| ExpressionToolbarMsg::Edit);

        html! {
            <>
                {
                    if ctx.props().is_closable() {
                        let close = ctx.link().callback(|_| ExpressionToolbarMsg::Close);
                        html! {
                            <span
                                onmousedown={ close }
                                class="expression-delete-button">
                                {
                                    "close"
                                }
                            </span>
                        }
                    } else {
                        html! {
                            <span
                                class="expression-delete-button"
                                style="opacity:0">
                                {
                                    "close"
                                }
                            </span>
                        }
                    }
                }
                <span
                    onmousedown={ edit }
                    class="expression-edit-button">
                    {
                        "menu"
                    }
                </span>
            </>
        }
    }
}
