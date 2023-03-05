////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod active_column;
mod add_expression_button;
mod aggregate_selector;
mod expression_toolbar;
mod inactive_column;

use std::iter::*;
use std::rc::Rc;

use web_sys::*;
use yew::prelude::*;

use self::active_column::*;
use self::add_expression_button::AddExpressionButton;
use self::inactive_column::*;
use super::config_selector::ConfigSelector;
use super::containers::scroll_panel::*;
use super::containers::split_panel::{Orientation, SplitPanel};
use super::style::LocalStyle;
use crate::dragdrop::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

#[derive(Properties)]
pub struct ColumnSelectorProps {
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,

    #[prop_or_default]
    pub on_resize: Option<Rc<PubSub<()>>>,

    #[prop_or_default]
    pub on_dimensions_reset: Option<Rc<PubSub<()>>>,
}

derive_model!(DragDrop, Renderer, Session for ColumnSelectorProps);

impl PartialEq for ColumnSelectorProps {
    fn eq(&self, _rhs: &Self) -> bool {
        true
    }
}

#[derive(Debug)]
pub enum ColumnSelectorMsg {
    TableLoaded,
    ViewCreated,
    HoverActiveIndex(Option<usize>),
    Drag(DragEffect),
    DragEnd,
    Drop((String, DragTarget, DragEffect, usize)),
}

use ColumnSelectorMsg::*;

/// A `ColumnSelector` controls the `columns` field of the `ViewConfig`,
/// deriving its options from the table columns and `ViewConfig` expressions.
pub struct ColumnSelector {
    _subscriptions: [Subscription; 5],
    named_row_count: usize,
    drag_container: DragDropContainer,
}

impl Component for ColumnSelector {
    type Message = ColumnSelectorMsg;
    type Properties = ColumnSelectorProps;

    fn create(ctx: &Context<Self>) -> Self {
        let table_sub = {
            let cb = ctx.link().callback(|_| ColumnSelectorMsg::TableLoaded);
            ctx.props().session.table_loaded.add_listener(cb)
        };

        let view_sub = {
            let cb = ctx.link().callback(|_| ColumnSelectorMsg::ViewCreated);
            ctx.props().session.view_created.add_listener(cb)
        };

        let drop_sub = {
            let cb = ctx.link().callback(ColumnSelectorMsg::Drop);
            ctx.props().dragdrop.drop_received.add_listener(cb)
        };

        let drag_sub = {
            let cb = ctx.link().callback(ColumnSelectorMsg::Drag);
            ctx.props().dragdrop.dragstart_received.add_listener(cb)
        };

        let dragend_sub = {
            let cb = ctx.link().callback(|_| ColumnSelectorMsg::DragEnd);
            ctx.props().dragdrop.dragend_received.add_listener(cb)
        };

        let named = maybe! {
            let plugin =
                ctx.props().renderer.get_active_plugin().ok()?;

            Some(plugin.config_column_names()?.length() as usize)
        };

        let named_row_count = named.unwrap_or_default();

        let drag_container = DragDropContainer::new(|| {}, {
            let link = ctx.link().clone();
            move || link.send_message(ColumnSelectorMsg::HoverActiveIndex(None))
        });

        Self {
            _subscriptions: [table_sub, view_sub, drop_sub, drag_sub, dragend_sub],
            named_row_count,
            drag_container,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Drag(DragEffect::Move(DragTarget::Active)) => false,
            Drag(_) | DragEnd | TableLoaded => true,
            ViewCreated => {
                let named = maybe! {
                    let plugin =
                        ctx.props().renderer.get_active_plugin().ok()?;

                    Some(plugin.config_column_names()?.length() as usize)
                };

                self.named_row_count = named.unwrap_or_default();
                true
            }
            HoverActiveIndex(Some(to_index)) => {
                let min_cols = ctx.props().renderer.metadata().min;
                let config = ctx.props().session.get_view_config();
                let is_to_empty = !config
                    .columns
                    .get(to_index)
                    .map(|x| x.is_some())
                    .unwrap_or_default();

                let from_index = ctx
                    .props()
                    .dragdrop
                    .get_drag_column()
                    .and_then(|x| config.columns.iter().position(|z| z.as_ref() == Some(&x)));

                if min_cols
                    .and_then(|x| from_index.map(|from_index| from_index < x))
                    .unwrap_or_default()
                    && is_to_empty
                    || from_index
                        .map(|from_index| {
                            from_index == config.columns.len() - 1 && to_index > from_index
                        })
                        .unwrap_or_default()
                {
                    ctx.props().dragdrop.notify_drag_leave(DragTarget::Active);
                    true
                } else {
                    ctx.props()
                        .dragdrop
                        .notify_drag_enter(DragTarget::Active, to_index)
                }
            }
            HoverActiveIndex(_) => {
                ctx.props().dragdrop.notify_drag_leave(DragTarget::Active);
                true
            }
            Drop((column, DragTarget::Active, effect, index)) => {
                let update = ctx.props().session.create_drag_drop_update(
                    column,
                    index,
                    DragTarget::Active,
                    effect,
                    &ctx.props().renderer.metadata(),
                );

                ApiFuture::spawn(ctx.props().update_and_render(update));
                true
            }
            Drop((_, _, DragEffect::Move(DragTarget::Active), _)) => true,
            Drop((..)) => true,
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let config = ctx.props().session.get_view_config();
        let is_aggregated = config.is_aggregated();
        let columns_iter = ctx.props().column_selector_iter_set(&config);
        let onselect = ctx.link().callback(|()| ViewCreated);
        let ondragenter = ctx.link().callback(HoverActiveIndex);
        let ondragover = Callback::from(|_event: DragEvent| _event.prevent_default());
        let ondrop = Callback::from({
            let dragdrop = ctx.props().dragdrop.clone();
            move |event| dragdrop.notify_drop(&event)
        });

        let ondragend = Callback::from({
            let dragdrop = ctx.props().dragdrop.clone();
            move |_| dragdrop.notify_drag_end()
        });

        let mut active_classes = classes!();
        if ctx.props().dragdrop.get_drag_column().is_some() {
            active_classes.push("dragdrop-highlight");
        };

        if is_aggregated {
            active_classes.push("is-aggregated");
        }

        let size = 28.0f64.mul_add(
            (config.group_by.len()
                + config.split_by.len()
                + config.filter.len()
                + config.sort.len()) as f64,
            212.0,
        );

        let config_selector = html_nested! {
            <ScrollPanelItem key={ "config_selector" } { size }>
                <ConfigSelector
                    dragdrop={ &ctx.props().dragdrop }
                    session={ &ctx.props().session }
                    renderer={ &ctx.props().renderer }
                    ondragenter={ ctx.link().callback(|()| ColumnSelectorMsg::ViewCreated)}>
                </ConfigSelector>
            </ScrollPanelItem>
        };

        let mut named_count = self.named_row_count;
        let mut active_columns: Vec<_> = columns_iter
            .active()
            .enumerate()
            .map(|(idx, name)| {
                let ondragenter = ondragenter.reform(move |_| Some(idx));
                let size = if named_count > 0 { 48.0 } else { 28.0 };
                named_count = named_count.saturating_sub(1);
                let key = format!("{}", name);
                html_nested! {
                    <ScrollPanelItem key={ key } { size }>
                        <ActiveColumn
                            { idx }
                            { name }
                            { is_aggregated }
                            dragdrop={ &ctx.props().dragdrop }
                            session={ &ctx.props().session }
                            renderer={ &ctx.props().renderer }
                            ondragenter={ ondragenter }
                            ondragend={ &ondragend }
                            onselect={ &onselect }/>
                    </ScrollPanelItem>
                }
            })
            .collect();

        let mut inactive_children: Vec<_> = columns_iter
            .expression()
            .chain(columns_iter.inactive())
            .enumerate()
            .map(|(idx, vc)| {
                html_nested! {
                    <ScrollPanelItem
                        key={ vc.name }
                        size={ 28.0 }>
                        <InactiveColumn
                            { idx }
                            visible={ vc.is_visible }
                            name={ vc.name.to_owned() }
                            dragdrop={ &ctx.props().dragdrop }
                            session={ &ctx.props().session }
                            renderer={ &ctx.props().renderer }
                            onselect={ &onselect }
                            ondragend={ &ondragend } />
                    </ScrollPanelItem>
                }
            })
            .collect();

        let size = if !inactive_children.is_empty() {
            56.0
        } else {
            28.0
        };

        let add_column = html_nested! {
            <ScrollPanelItem key={ "__add_expression__" } size={ size }>
                <AddExpressionButton
                    session={ &ctx.props().session }
                    renderer={ &ctx.props().renderer }>
                </AddExpressionButton>
            </ScrollPanelItem>
        };

        if inactive_children.is_empty() {
            active_columns.push(add_column)
        } else {
            inactive_children.insert(0, add_column);
        }

        let selected_columns = html! {
            <div id="selected-columns">
                <ScrollPanel
                    id="active-columns"
                    class={ active_classes }
                    dragover={ ondragover }
                    dragenter={ &self.drag_container.dragenter }
                    dragleave={ &self.drag_container.dragleave }
                    viewport_ref={ &self.drag_container.noderef }
                    drop={ ondrop }
                    on_resize={ &ctx.props().on_resize }
                    on_dimensions_reset={ &ctx.props().on_dimensions_reset }
                    children={ std::iter::once(config_selector).chain(active_columns).collect::<Vec<_>>() }>
                </ScrollPanel>
            </div>
        };

        if !inactive_children.is_empty() {
            html_template! {
                <LocalStyle href={ css!("column-selector") } />
                <SplitPanel no_wrap={ true } orientation={ Orientation::Vertical }>
                    { selected_columns }
                    <ScrollPanel
                        id="sub-columns"
                        on_dimensions_reset={ &ctx.props().on_dimensions_reset }
                        children={ inactive_children }>
                    </ScrollPanel>
                </SplitPanel>
            }
        } else {
            html_template! {
                <LocalStyle href={ css!("column-selector") } />
                <div class="split-panel-child">
                    { selected_columns }
                </div>
            }
        }
    }
}
