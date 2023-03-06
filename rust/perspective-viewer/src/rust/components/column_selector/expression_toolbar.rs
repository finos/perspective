////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use web_sys::*;
use yew::prelude::*;

use crate::config::*;
use crate::custom_elements::expression_editor::ExpressionEditorElement;
use crate::dragdrop::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::ApiFuture;
use crate::*;

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

derive_model!(Renderer, Session for ExpressionToolbarProps);

impl ExpressionToolbarProps {
    pub async fn save_expr(&self, expression: &JsValue) {
        let update = self
            .session
            .create_replace_expression_update(&self.name, expression)
            .await;

        ApiFuture::spawn(self.update_and_render(update));
    }

    pub fn close_expr(&self, expression_editor: Option<ExpressionEditorElement>) {
        let expression = self
            .session
            .metadata()
            .get_expression_by_alias(&self.name)
            .unwrap();

        let mut expressions = self.session.get_view_config().expressions.clone();
        expressions.retain(|x| x != &expression);
        let config = ViewConfigUpdate {
            expressions: Some(expressions),
            ..ViewConfigUpdate::default()
        };

        let task = self.update_and_render(config);
        ApiFuture::spawn(async move {
            task.await?;
            expression_editor
                .and_then(|elem| elem.destroy().ok())
                .unwrap();
            Ok(())
        });
    }
}

pub enum ExpressionToolbarMsg {
    Edit,
    Save(JsValue),
    Delete,
    Close,
}

use ExpressionToolbarMsg::*;

pub struct ExpressionToolbar {
    expression_editor: Option<ExpressionEditorElement>,
}

impl Component for ExpressionToolbar {
    type Message = ExpressionToolbarMsg;
    type Properties = ExpressionToolbarProps;

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            expression_editor: None,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: ExpressionToolbarMsg) -> bool {
        match msg {
            Delete => {
                let expression_editor = self.expression_editor.take();
                ctx.props().close_expr(expression_editor);

                false
            }
            Save(expression) => {
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
            Close => false,
            Edit => {
                let on_save = ctx.link().callback(Save);
                let on_delete = ctx.link().callback(|_| Delete);
                let on_blur = ctx.link().callback(|_| Close);
                let target = ctx
                    .props()
                    .add_expression_ref
                    .cast::<HtmlElement>()
                    .unwrap();

                let mut element = ExpressionEditorElement::new(
                    ctx.props().session.clone(),
                    on_save,
                    Some(on_delete),
                    on_blur,
                    Some(ctx.props().name.to_owned()),
                );

                element.open(target);
                self.expression_editor = Some(element);
                false
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let edit = ctx.link().callback(|_| Edit);
        html_template! {
            <span
                onmousedown={ edit }
                class="expression-edit-button">
            </span>
        }
    }
}
