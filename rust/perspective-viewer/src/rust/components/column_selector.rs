////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::active_column::*;
use super::inactive_column::*;
use crate::config::*;
use crate::custom_elements::expression_editor::ExpressionEditorElement;
use crate::dragdrop::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

use std::iter::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::prelude::*;

#[derive(Properties, Clone, PartialEq)]
pub struct ColumnSelectorProps {
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,
}

derive_viewer_model!(ColumnSelectorProps);

impl ColumnSelectorProps {
    fn save_expr(&self, expression: &JsValue) {
        let expression = expression.as_string().unwrap();
        let ViewConfig {
            mut expressions, ..
        } = self.session.get_view_config();

        expressions.retain(|x| x != &expression);
        expressions.push(expression);
        self.update_and_render(ViewConfigUpdate {
            expressions: Some(expressions),
            ..ViewConfigUpdate::default()
        });
    }
}

#[derive(Debug)]
pub enum ColumnSelectorMsg {
    TableLoaded,
    ViewCreated,
    HoverActiveIndex(Option<usize>),
    Drag(DragEffect),
    DragEnd,
    Drop((String, DropAction, DragEffect, usize)),
    OpenExpressionEditor,
    SaveExpression(JsValue),
}

/// A `ColumnSelector` controls the `columns` field of the `ViewConfig`, deriving its
/// options from the table columns and `ViewConfig` expressions.
pub struct ColumnSelector {
    _subscriptions: [Subscription; 5],
    add_expression_ref: NodeRef,
    expression_editor: Option<ExpressionEditorElement>,
}

impl Component for ColumnSelector {
    type Message = ColumnSelectorMsg;
    type Properties = ColumnSelectorProps;

    fn create(ctx: &Context<Self>) -> Self {
        let table_sub = {
            let cb = ctx.link().callback(|_| ColumnSelectorMsg::TableLoaded);
            ctx.props().session.on_table_loaded.add_listener(cb)
        };

        let view_sub = {
            let cb = ctx.link().callback(|_| ColumnSelectorMsg::ViewCreated);
            ctx.props().session.on_view_created.add_listener(cb)
        };

        let drop_sub = {
            let cb = ctx.link().callback(ColumnSelectorMsg::Drop);
            ctx.props().dragdrop.add_on_drop_action(cb)
        };

        let drag_sub = {
            let cb = ctx.link().callback(ColumnSelectorMsg::Drag);
            ctx.props().dragdrop.add_on_drag_action(cb)
        };

        let dragend_sub = {
            let cb = ctx.link().callback(|_| ColumnSelectorMsg::DragEnd);
            ctx.props().dragdrop.add_on_dragend_action(cb)
        };

        ColumnSelector {
            _subscriptions: [table_sub, view_sub, drop_sub, drag_sub, dragend_sub],
            add_expression_ref: NodeRef::default(),
            expression_editor: None,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            ColumnSelectorMsg::Drag(DragEffect::Move(DropAction::Active)) => false,
            ColumnSelectorMsg::Drag(_) => true,
            ColumnSelectorMsg::DragEnd => true,
            ColumnSelectorMsg::TableLoaded => true,
            ColumnSelectorMsg::ViewCreated => true,
            ColumnSelectorMsg::HoverActiveIndex(Some(to_index)) => {
                let min_cols = ctx.props().renderer.metadata().min;
                let config = ctx.props().session.get_view_config();
                let is_to_empty = !config
                    .columns
                    .get(to_index)
                    .map(|x| x.is_some())
                    .unwrap_or_default();

                let from_index = ctx.props().dragdrop.get_drag_column().and_then(|x| {
                    config.columns.iter().position(|z| z.as_ref() == Some(&x))
                });

                if min_cols
                    .and_then(|x| from_index.map(|from_index| from_index < x))
                    .unwrap_or_default()
                    && is_to_empty
                {
                    ctx.props().dragdrop.drag_leave(DropAction::Active);
                    true
                } else {
                    ctx.props()
                        .dragdrop
                        .drag_enter(DropAction::Active, to_index)
                }
            }
            ColumnSelectorMsg::HoverActiveIndex(_) => {
                ctx.props().dragdrop.drag_leave(DropAction::Active);
                true
            }
            ColumnSelectorMsg::Drop((column, DropAction::Active, effect, index)) => {
                let update = ctx.props().session.create_drag_drop_update(
                    column,
                    index,
                    DropAction::Active,
                    effect,
                    &ctx.props().renderer.metadata(),
                );

                ctx.props().update_and_render(update);
                true
            }
            ColumnSelectorMsg::Drop((
                _,
                _,
                DragEffect::Move(DropAction::Active),
                _,
            )) => true,
            ColumnSelectorMsg::Drop((_, _, _, _)) => true,
            ColumnSelectorMsg::SaveExpression(expression) => {
                ctx.props().save_expr(&expression);
                self.expression_editor
                    .take()
                    .and_then(|elem| elem.destroy().ok())
                    .unwrap();

                true
            }
            ColumnSelectorMsg::OpenExpressionEditor => {
                let on_save = ctx.link().callback(ColumnSelectorMsg::SaveExpression);
                let mut element = ExpressionEditorElement::new(
                    ctx.props().session.clone(),
                    on_save,
                    None,
                );

                let target = self.add_expression_ref.cast::<HtmlElement>().unwrap();
                element.open(target);
                self.expression_editor = Some(element);
                false
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        if let Some(all_columns) = ctx.props().session.metadata().get_table_columns() {
            let config = ctx.props().session.get_view_config();
            let is_pivot = config.is_aggregated();
            let columns_iter = ctx.props().column_selector_iter_set(&config);

            let dragleave = dragleave_helper({
                let link = ctx.link().clone();
                move || link.send_message(ColumnSelectorMsg::HoverActiveIndex(None))
            });

            let dragover = Callback::from(|_event: DragEvent| _event.prevent_default());
            let dragenter = ctx.link().callback(move |event: DragEvent| {
                // Safari does not set `relatedTarget` so this event must be allowed to
                // bubble so we can count entry/exit stacks to determine true
                // `"dragleave"`.
                if event.related_target().is_some() {
                    event.stop_propagation();
                    event.prevent_default();
                }

                let index = maybe! {
                    event
                        .current_target()
                        .into_jserror()?
                        .unchecked_into::<HtmlElement>()
                        .dataset()
                        .get("index")
                        .into_jserror()?
                        .parse::<usize>()
                        .into_jserror()
                };

                ColumnSelectorMsg::HoverActiveIndex(index.ok())
            });

            let drop = Callback::from({
                let dragdrop = ctx.props().dragdrop.clone();
                move |_| dragdrop.notify_drop()
            });

            let dragend = Callback::from({
                let dragdrop = ctx.props().dragdrop.clone();
                move |_event| dragdrop.drag_end()
            });

            let add_expression = ctx
                .link()
                .callback(|_| ColumnSelectorMsg::OpenExpressionEditor);

            let select = ctx.link().callback(|()| ColumnSelectorMsg::ViewCreated);
            let mut active_classes = vec![];
            if ctx.props().dragdrop.get_drag_column().is_some() {
                active_classes.push("dragdrop-highlight");
            };

            if config.columns.len() != all_columns.len() + config.expressions.len() {
                active_classes.push("collapse");
            }

            html! {
                <>
                    <div
                        id="active-columns"
                        class={ active_classes.join(" ") }
                        ondragover={ dragover }
                        ondragenter={ Callback::from(dragenter_helper) }
                        ondragleave={ dragleave }
                        ondrop={ drop }>
                        {
                            for columns_iter.active().enumerate().map(|(idx, name)| {
                                html! {
                                    <ActiveColumn
                                        idx={ idx }
                                        name={ name.clone() }
                                        dragdrop={ ctx.props().dragdrop.clone() }
                                        session={ ctx.props().session.clone() }
                                        renderer={ ctx.props().renderer.clone() }
                                        ondragenter={ dragenter.clone() }
                                        ondragend={ dragend.clone() }
                                        onselect={ select.clone() }
                                        config={ config.clone() }
                                        is_pivot={ is_pivot }>
                                    </ActiveColumn>
                                }
                            })
                        }
                    </div>
                    <div id="sub-columns">
                        <div id="expression-columns">
                        {
                            for columns_iter.expression().enumerate().map(|(idx, vc)| {
                                html! {
                                    <InactiveColumn
                                        idx={ idx }
                                        visible={ vc.is_visible }
                                        name={ vc.name.to_owned() }
                                        dragdrop={ ctx.props().dragdrop.clone() }
                                        session={ ctx.props().session.clone() }
                                        renderer={ ctx.props().renderer.clone() }
                                        onselect={ select.clone() }
                                        ondragend={ dragend.clone() }>
                                    </InactiveColumn>
                                }
                            })
                        }
                        </div>
                        <div id="inactive-columns">
                        {
                            for columns_iter.inactive().enumerate().map(|(idx, vc)| {
                                html! {
                                    <InactiveColumn
                                        idx={ idx }
                                        visible={ vc.is_visible }
                                        name={ vc.name.to_owned() }
                                        dragdrop={ ctx.props().dragdrop.clone() }
                                        session={ ctx.props().session.clone() }
                                        renderer={ ctx.props().renderer.clone() }
                                        onselect={ select.clone() }
                                        ondragend={ dragend.clone() }>
                                    </InactiveColumn>
                                }
                            })
                        }
                        </div>
                    </div>
                    <div
                        id="add-expression"
                        class="side_panel-action"
                        ref={ self.add_expression_ref.clone() }
                        onmousedown={ add_expression }>

                        <span class="psp-icon psp-icon__add"></span>
                        <span class="psp-title__columnName">{ "New Column" }</span>
                    </div>
                </>
            }
        } else {
            html! {}
        }
    }
}
