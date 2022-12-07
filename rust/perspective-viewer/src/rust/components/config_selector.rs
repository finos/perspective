////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod filter_item;
mod pivot_item;
mod sort_item;

use std::rc::Rc;

use yew::prelude::*;

use self::filter_item::*;
use self::pivot_item::*;
use self::sort_item::*;
use super::containers::dragdrop_list::*;
use super::style::LocalStyle;
use crate::config::*;
use crate::custom_elements::FilterDropDownElement;
use crate::dragdrop::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

#[derive(Properties, PartialEq)]
pub struct ConfigSelectorProps {
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,
}

derive_model!(Renderer, Session for ConfigSelectorProps);

#[derive(Debug)]
pub enum ConfigSelectorMsg {
    DragStart(DragEffect),
    DragEnd,
    DragOver(usize, DragTarget),
    DragLeave(DragTarget),
    Drop(String, DragTarget, DragEffect, usize),
    Close(usize, DragTarget),
    SetFilterValue(usize, String),
    TransposePivots,
    ViewCreated,
}

#[derive(Clone)]
pub struct ConfigSelector {
    filter_dropdown: FilterDropDownElement,
    _subscriptions: [Rc<Subscription>; 4],
}

struct GroupByContext {}
struct SplitByContext {}
struct SortDragContext {}
struct FilterDragContext {}

impl DragContext<ConfigSelectorMsg> for GroupByContext {
    fn dragenter(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragOver(index, DragTarget::GroupBy)
    }

    fn close(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::Close(index, DragTarget::GroupBy)
    }

    fn dragleave() -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragLeave(DragTarget::GroupBy)
    }
}

impl DragContext<ConfigSelectorMsg> for SplitByContext {
    fn dragenter(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragOver(index, DragTarget::SplitBy)
    }

    fn close(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::Close(index, DragTarget::SplitBy)
    }

    fn dragleave() -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragLeave(DragTarget::SplitBy)
    }
}

impl DragContext<ConfigSelectorMsg> for SortDragContext {
    fn dragenter(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragOver(index, DragTarget::Sort)
    }

    fn close(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::Close(index, DragTarget::Sort)
    }

    fn dragleave() -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragLeave(DragTarget::Sort)
    }
}

impl DragContext<ConfigSelectorMsg> for FilterDragContext {
    fn dragenter(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragOver(index, DragTarget::Filter)
    }

    fn close(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::Close(index, DragTarget::Filter)
    }

    fn dragleave() -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragLeave(DragTarget::Filter)
    }
}

type GroupBySelector = DragDropList<ConfigSelector, PivotItem, GroupByContext>;
type SplitBySelector = DragDropList<ConfigSelector, PivotItem, SplitByContext>;
type SortSelector = DragDropList<ConfigSelector, SortItem, SortDragContext>;
type FilterSelector = DragDropList<ConfigSelector, FilterItem, FilterDragContext>;

impl Component for ConfigSelector {
    type Message = ConfigSelectorMsg;
    type Properties = ConfigSelectorProps;

    fn create(ctx: &Context<Self>) -> Self {
        let cb = ctx.link().callback(ConfigSelectorMsg::DragStart);
        let drag_sub = Rc::new(ctx.props().dragdrop.dragstart_received.add_listener(cb));

        let cb = ctx.link().callback(|_| ConfigSelectorMsg::DragEnd);
        let dragend_sub = Rc::new(ctx.props().dragdrop.dragend_received.add_listener(cb));

        let cb = ctx
            .link()
            .callback(|x: (String, DragTarget, DragEffect, usize)| {
                ConfigSelectorMsg::Drop(x.0, x.1, x.2, x.3)
            });
        let drop_sub = Rc::new(ctx.props().dragdrop.drop_received.add_listener(cb));

        let cb = ctx.link().callback(|_| ConfigSelectorMsg::ViewCreated);
        let view_sub = Rc::new(ctx.props().session.view_created.add_listener(cb));

        let filter_dropdown = FilterDropDownElement::new(ctx.props().session.clone());
        let _subscriptions = [drop_sub, view_sub, drag_sub, dragend_sub];
        ConfigSelector {
            filter_dropdown,
            _subscriptions,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            ConfigSelectorMsg::DragStart(_) | ConfigSelectorMsg::ViewCreated => true,
            ConfigSelectorMsg::DragEnd => true,
            ConfigSelectorMsg::DragOver(index, action) => {
                ctx.props().dragdrop.drag_enter(action, index)
            }
            ConfigSelectorMsg::DragLeave(action) => {
                ctx.props().dragdrop.drag_leave(action);
                true
            }
            ConfigSelectorMsg::Close(index, DragTarget::Sort) => {
                let mut sort = ctx.props().session.get_view_config().sort.clone();
                sort.remove(index);
                let sort = Some(sort);
                let config = ViewConfigUpdate {
                    sort,
                    ..ViewConfigUpdate::default()
                };

                ApiFuture::spawn(ctx.props().update_and_render(config));
                true
            }
            ConfigSelectorMsg::Close(index, DragTarget::GroupBy) => {
                let mut group_by = ctx.props().session.get_view_config().group_by.clone();
                group_by.remove(index);
                let config = ViewConfigUpdate {
                    group_by: Some(group_by),
                    ..ViewConfigUpdate::default()
                };

                ApiFuture::spawn(ctx.props().update_and_render(config));
                true
            }
            ConfigSelectorMsg::Close(index, DragTarget::SplitBy) => {
                let mut split_by = ctx.props().session.get_view_config().split_by.clone();
                split_by.remove(index);
                let config = ViewConfigUpdate {
                    split_by: Some(split_by),
                    ..ViewConfigUpdate::default()
                };

                ApiFuture::spawn(ctx.props().update_and_render(config));
                true
            }
            ConfigSelectorMsg::Close(index, DragTarget::Filter) => {
                self.filter_dropdown.hide().unwrap();
                let mut filter = ctx.props().session.get_view_config().filter.clone();
                filter.remove(index);
                let config = ViewConfigUpdate {
                    filter: Some(filter),
                    ..ViewConfigUpdate::default()
                };

                ApiFuture::spawn(ctx.props().update_and_render(config));
                true
            }
            ConfigSelectorMsg::Close(..) => false,
            ConfigSelectorMsg::Drop(column, action, effect, index)
                if action != DragTarget::Active =>
            {
                let update = ctx.props().session.create_drag_drop_update(
                    column,
                    index,
                    action,
                    effect,
                    &ctx.props().renderer.metadata(),
                );
                ApiFuture::spawn(ctx.props().update_and_render(update));
                true
            }
            ConfigSelectorMsg::Drop(_, _, DragEffect::Move(action), _)
                if action != DragTarget::Active =>
            {
                true
            }
            ConfigSelectorMsg::Drop(..) => false,
            ConfigSelectorMsg::TransposePivots => {
                let mut view_config = ctx.props().session.get_view_config().clone();
                std::mem::swap(&mut view_config.group_by, &mut view_config.split_by);

                let update = ViewConfigUpdate {
                    group_by: Some(view_config.group_by),
                    split_by: Some(view_config.split_by),
                    ..ViewConfigUpdate::default()
                };

                ApiFuture::spawn(ctx.props().update_and_render(update));
                true
            }
            ConfigSelectorMsg::SetFilterValue(index, input) => {
                let mut filter = ctx.props().session.get_view_config().filter.clone();
                filter[index].2 = FilterTerm::Scalar(Scalar::String(input));
                let filter = Some(filter);
                let update = ViewConfigUpdate {
                    filter,
                    ..ViewConfigUpdate::default()
                };

                ApiFuture::spawn(ctx.props().update_and_render(update));
                false
            }
        }
    }

    /// Should not render on change, as this component only depends on service
    /// state.
    fn changed(&mut self, _ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        false
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let config = ctx.props().session.get_view_config();
        let transpose = ctx.link().callback(|_| ConfigSelectorMsg::TransposePivots);

        let class = if ctx.props().dragdrop.get_drag_column().is_some() {
            "dragdrop-highlight"
        } else {
            ""
        };

        let dragend = Callback::from({
            let dragdrop = ctx.props().dragdrop.clone();
            move |_event| dragdrop.drag_end()
        });

        html! {
            <div slot="top_panel" id="top_panel" class={ class } ondragend={ dragend }>
                <LocalStyle href={ css!("config-selector") } />
                <GroupBySelector
                    name="group_by"
                    parent={ ctx.link().clone() }
                    is_dragover={ ctx.props().dragdrop.is_dragover(DragTarget::GroupBy) }
                    dragdrop={ &ctx.props().dragdrop }>
                    {
                        for config.group_by.iter().map(|group_by| {
                            html_nested! {
                                <PivotItem
                                    dragdrop={ &ctx.props().dragdrop }
                                    action={ DragTarget::GroupBy }
                                    column={ group_by.clone() }>
                                </PivotItem>
                            }
                        })
                    }
                </GroupBySelector>

                <span
                    id="transpose_button"
                    class="rrow centered"
                    title="Transpose Pivots"
                    onmousedown={ transpose }>

                </span>

                <SplitBySelector
                    name="split_by"
                    parent={ ctx.link().clone() }
                    is_dragover={ ctx.props().dragdrop.is_dragover(DragTarget::SplitBy) }
                    dragdrop={ &ctx.props().dragdrop }>
                    {
                        for config.split_by.iter().map(|split_by| {
                            html_nested! {
                                <PivotItem
                                    dragdrop={ &ctx.props().dragdrop }
                                    action={ DragTarget::SplitBy }
                                    column={ split_by.clone() }>
                                </PivotItem>
                            }
                        })
                    }
                </SplitBySelector>

                <SortSelector
                    name="sort"
                    allow_duplicates=true
                    parent={ ctx.link().clone() }
                    dragdrop={ &ctx.props().dragdrop }
                    is_dragover={ ctx.props().dragdrop.is_dragover(DragTarget::Sort).map(|(index, name)| {
                        (index, Sort(name, SortDir::Asc))
                    }) }>
                    {
                        for config.sort.iter().enumerate().map(|(idx, sort)| {
                            html_nested! {
                                <SortItem
                                    idx={ idx }
                                    session={ &ctx.props().session }
                                    renderer={ &ctx.props().renderer }
                                    dragdrop={ &ctx.props().dragdrop }
                                    sort={ sort.clone() }>
                                </SortItem>
                            }
                        })
                    }
                </SortSelector>

                <FilterSelector
                    name="filter"
                    allow_duplicates=true
                    parent={ ctx.link().clone() }
                    dragdrop={ &ctx.props().dragdrop }
                    is_dragover={ ctx.props().dragdrop.is_dragover(DragTarget::Filter).map(|(index, name)| {
                        (index, Filter(name, FilterOp::EQ, FilterTerm::Scalar(Scalar::Null)))
                    }) }>
                    {
                        for config.filter.iter().enumerate().map(|(idx, filter)| {
                            let filter_keydown = ctx.link()
                                .callback(move |txt| ConfigSelectorMsg::SetFilterValue(idx, txt));

                            html_nested! {
                                <FilterItem
                                    idx={ idx }
                                    filter_dropdown={ &self.filter_dropdown }
                                    session={ &ctx.props().session }
                                    renderer={ &ctx.props().renderer }
                                    dragdrop={ &ctx.props().dragdrop }
                                    filter={ filter.clone() }
                                    on_keydown={ filter_keydown }>
                                </FilterItem>
                            }
                        })
                    }
                </FilterSelector>

            </div>
        }
    }
}
