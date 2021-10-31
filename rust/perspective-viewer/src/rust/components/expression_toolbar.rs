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

derive_renderable_props!(ExpressionToolbarProps);

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
            && !self
                .dragdrop
                .get_drag_column()
                .map(|x| x == self.name)
                .unwrap_or_default()
    }
}

pub enum ExpressionToolbarMsg {
    Edit,
    Save(JsValue),
    Close,
}

pub struct ExpressionToolbar {
    link: ComponentLink<ExpressionToolbar>,
    props: ExpressionToolbarProps,
    expression_editor: Option<ExpressionEditorElement>,
    is_closable: bool,
}

impl Component for ExpressionToolbar {
    type Message = ExpressionToolbarMsg;
    type Properties = ExpressionToolbarProps;

    fn create(
        props: <Self as yew::Component>::Properties,
        link: ComponentLink<Self>,
    ) -> Self {
        let is_closable = props.is_closable();
        ExpressionToolbar {
            link,
            props,
            expression_editor: None,
            is_closable,
        }
    }

    fn change(&mut self, props: <Self as yew::Component>::Properties) -> ShouldRender {
        let is_closable = props.is_closable();
        let should_render =
            self.props.name != props.name || self.is_closable != is_closable;
        self.props = props;
        self.is_closable = is_closable;
        should_render
    }

    fn update(&mut self, msg: <Self as yew::Component>::Message) -> ShouldRender {
        match msg {
            ExpressionToolbarMsg::Close => {
                self.props.close_expr();
                false
            }
            ExpressionToolbarMsg::Save(expression) => {
                let props = self.props.clone();
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
                let on_save = self.link.callback(ExpressionToolbarMsg::Save);
                let target =
                    self.props.add_expression_ref.cast::<HtmlElement>().unwrap();

                let mut element = ExpressionEditorElement::new(
                    self.props.session.clone(),
                    on_save,
                    Some(self.props.name.to_owned()),
                );

                element.open(target);
                self.expression_editor = Some(element);
                false
            }
        }
    }

    fn view(&self) -> Html {
        let edit = self.link.callback(|_| ExpressionToolbarMsg::Edit);

        html! {
            <>
                {
                    if self.is_closable {
                        let close = self.link.callback(|_| ExpressionToolbarMsg::Close);
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
