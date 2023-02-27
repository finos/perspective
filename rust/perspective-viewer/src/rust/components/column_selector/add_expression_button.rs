////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use web_sys::*;
use yew::prelude::*;

use crate::config::ViewConfigUpdate;
use crate::custom_elements::expression_editor::ExpressionEditorElement;
use crate::model::*;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::*;
use crate::*;

#[derive(Clone, PartialEq, Properties)]
pub struct AddExpressionButtonProps {
    pub session: Session,
    pub renderer: Renderer,
}

derive_model!(Renderer, Session for AddExpressionButtonProps);

pub enum AddExpressionButtonMsg {
    SaveExpression(JsValue),
    OpenExpressionEditor(bool),
    CloseExpression,
    MouseEnter(bool),
    MouseLeave,
}

use AddExpressionButtonMsg::*;

#[derive(Default)]
pub struct AddExpressionButton {
    noderef: NodeRef,
    expression_editor: Option<ExpressionEditorElement>,
    mouseover: bool,
    mode_open: bool,
}

impl Component for AddExpressionButton {
    type Message = AddExpressionButtonMsg;
    type Properties = AddExpressionButtonProps;

    fn create(_ctx: &Context<Self>) -> Self {
        AddExpressionButton::default()
    }

    fn update(&mut self, ctx: &Context<Self>, msg: AddExpressionButtonMsg) -> bool {
        match msg {
            SaveExpression(expression) => {
                self.mode_open = false;
                let task = {
                    let expression = expression.as_string().unwrap();
                    let mut expressions = ctx.props().session.get_view_config().expressions.clone();
                    expressions.retain(|x| x != &expression);
                    expressions.push(expression);
                    ctx.props().update_and_render(ViewConfigUpdate {
                        expressions: Some(expressions),
                        ..Default::default()
                    })
                };

                let expr = self.expression_editor.clone();
                ApiFuture::spawn(async move {
                    task.await?;
                    if let Some(editor) = expr.as_ref() {
                        editor.hide().unwrap_or_default();
                        editor.reset_empty_expr();
                    }

                    Ok(())
                });

                true
            }
            OpenExpressionEditor(reset) => {
                self.mode_open = true;
                if reset {
                    self.expression_editor = None;
                }

                let target = self.noderef.cast::<HtmlElement>().unwrap();
                let expression_editor = self.expression_editor.get_or_insert_with(|| {
                    let on_save = ctx.link().callback(SaveExpression);
                    let on_blur = ctx.link().callback(|_| CloseExpression);
                    ExpressionEditorElement::new(
                        ctx.props().session.clone(),
                        on_save,
                        None,
                        on_blur,
                        None,
                    )
                });

                expression_editor.open(target);
                true
            }
            CloseExpression => {
                self.mode_open = false;
                true
            }
            MouseEnter(is_render) => {
                self.mouseover = is_render;
                is_render
            }
            MouseLeave => {
                self.mouseover = false;
                true
            }
        }
    }

    /// `onmouseover` is triggered incorrectly on the `DragTarget` of a
    /// drag/drop action after `DropEvent` has fired on the `DropTarget`,
    /// causing brief hover effects where the mouse _was_ before the action
    /// initiated. Various methods of correcting this were attempted, settling
    /// on a manual `dragdrop-hover` class toggle, using the `.which()` property
    /// to determine the mis-fired event.  This was determined experimentally -
    /// according to my read of the spec, this is a bug in Chrome.
    ///
    /// As a result there are 3 hover states `MouseEnter(true)`,
    /// `MouseEnter(false)`, and `MouseLeave`;  `MouseEnter(false)` can be
    /// replaced, but it causes an extra render of the DOM un-necessarily.
    fn view(&self, ctx: &Context<Self>) -> Html {
        let onmouseout = ctx.link().callback(|_| MouseLeave);
        let onmouseover = ctx
            .link()
            .callback(|event: MouseEvent| MouseEnter(event.which() == 0));

        let onmousedown = ctx.link().callback(|event: MouseEvent| {
            AddExpressionButtonMsg::OpenExpressionEditor(event.shift_key())
        });

        let mut class = classes!();
        if self.mouseover || self.mode_open {
            class.push("dragdrop-hover");
        }

        html! {
            <div
                id="add-expression"
                data-index="-1"
                ref={ &self.noderef }
                { class }
                { onmouseover }
                { onmouseout }
                { onmousedown }>

                <span id="add-expression-title">{ "New Column" }</span>
            </div>
        }
    }
}
