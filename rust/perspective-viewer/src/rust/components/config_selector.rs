////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::containers::dragdrop_list::*;
use super::filter_item::*;
use super::pivot_item::*;
use super::sort_item::*;
use crate::config::*;
use crate::custom_elements::filter_dropdown::FilterDropDownElement;
use crate::dragdrop::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

use std::rc::Rc;
use yew::prelude::*;

#[derive(Properties, Clone, PartialEq)]
pub struct ConfigSelectorProps {
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,
}

derive_session_renderer_model!(ConfigSelectorProps);

#[derive(Debug)]
pub enum ConfigSelectorMsg {
    DragStart(DragEffect),
    DragEnd,
    DragOver(usize, DropAction),
    DragLeave(DropAction),
    Drop(String, DropAction, DragEffect, usize),
    Close(usize, DropAction),
    SetFilterValue(usize, String),
    TransposePivots,
    ViewCreated,
}

#[derive(Clone)]
pub struct ConfigSelector {
    filter_dropdown: FilterDropDownElement,
    subscriptions: [Rc<Subscription>; 4],
}

struct GroupByContext {}
struct SplitByContext {}
struct SortDragContext {}
struct FilterDragContext {}

impl DragContext<ConfigSelectorMsg> for GroupByContext {
    fn dragenter(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragOver(index, DropAction::GroupBy)
    }

    fn close(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::Close(index, DropAction::GroupBy)
    }

    fn dragleave() -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragLeave(DropAction::GroupBy)
    }
}

impl DragContext<ConfigSelectorMsg> for SplitByContext {
    fn dragenter(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragOver(index, DropAction::SplitBy)
    }

    fn close(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::Close(index, DropAction::SplitBy)
    }

    fn dragleave() -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragLeave(DropAction::SplitBy)
    }
}

impl DragContext<ConfigSelectorMsg> for SortDragContext {
    fn dragenter(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragOver(index, DropAction::Sort)
    }

    fn close(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::Close(index, DropAction::Sort)
    }

    fn dragleave() -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragLeave(DropAction::Sort)
    }
}

impl DragContext<ConfigSelectorMsg> for FilterDragContext {
    fn dragenter(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragOver(index, DropAction::Filter)
    }

    fn close(index: usize) -> ConfigSelectorMsg {
        ConfigSelectorMsg::Close(index, DropAction::Filter)
    }

    fn dragleave() -> ConfigSelectorMsg {
        ConfigSelectorMsg::DragLeave(DropAction::Filter)
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
        let drag_sub = Rc::new(ctx.props().dragdrop.add_on_drag_action(cb));

        let cb = ctx.link().callback(|_| ConfigSelectorMsg::DragEnd);
        let dragend_sub = Rc::new(ctx.props().dragdrop.add_on_dragend_action(cb));

        let cb = ctx
            .link()
            .callback(|x: (String, DropAction, DragEffect, usize)| {
                ConfigSelectorMsg::Drop(x.0, x.1, x.2, x.3)
            });
        let drop_sub = Rc::new(ctx.props().dragdrop.add_on_drop_action(cb));

        let cb = ctx.link().callback(|_| ConfigSelectorMsg::ViewCreated);
        let view_sub = Rc::new(ctx.props().session.on_view_created.add_listener(cb));

        let filter_dropdown = FilterDropDownElement::new(ctx.props().session.clone());
        let subscriptions = [drop_sub, view_sub, drag_sub, dragend_sub];
        ConfigSelector {
            filter_dropdown,
            subscriptions,
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
            ConfigSelectorMsg::Close(index, DropAction::Sort) => {
                let ViewConfig { mut sort, .. } = ctx.props().session.get_view_config();
                sort.remove(index as usize);
                let sort = Some(sort);
                ctx.props().update_and_render(ViewConfigUpdate {
                    sort,
                    ..ViewConfigUpdate::default()
                });

                true
            }
            ConfigSelectorMsg::Close(index, DropAction::GroupBy) => {
                let ViewConfig { mut group_by, .. } =
                    ctx.props().session.get_view_config();
                group_by.remove(index as usize);
                let group_by = Some(group_by);
                ctx.props().update_and_render(ViewConfigUpdate {
                    group_by,
                    ..ViewConfigUpdate::default()
                });

                true
            }
            ConfigSelectorMsg::Close(index, DropAction::SplitBy) => {
                let ViewConfig { mut split_by, .. } =
                    ctx.props().session.get_view_config();
                split_by.remove(index as usize);
                ctx.props().update_and_render(ViewConfigUpdate {
                    split_by: Some(split_by),
                    ..ViewConfigUpdate::default()
                });

                true
            }
            ConfigSelectorMsg::Close(index, DropAction::Filter) => {
                self.filter_dropdown.hide().unwrap();
                let ViewConfig { mut filter, .. } =
                    ctx.props().session.get_view_config();
                filter.remove(index as usize);
                ctx.props().update_and_render(ViewConfigUpdate {
                    filter: Some(filter),
                    ..ViewConfigUpdate::default()
                });

                true
            }
            ConfigSelectorMsg::Close(_, _) => false,
            ConfigSelectorMsg::Drop(column, action, effect, index)
                if action != DropAction::Active =>
            {
                let update = ctx.props().session.create_drag_drop_update(
                    column,
                    index,
                    action,
                    effect,
                    &ctx.props().renderer.metadata(),
                );
                ctx.props().update_and_render(update);
                true
            }
            ConfigSelectorMsg::Drop(_, _, DragEffect::Move(action), _)
                if action != DropAction::Active =>
            {
                true
            }
            ConfigSelectorMsg::Drop(_, _, _, _) => false,
            ConfigSelectorMsg::TransposePivots => {
                let mut view_config = ctx.props().session.get_view_config();
                std::mem::swap(&mut view_config.group_by, &mut view_config.split_by);

                let update = ViewConfigUpdate {
                    group_by: Some(view_config.group_by),
                    split_by: Some(view_config.split_by),
                    ..ViewConfigUpdate::default()
                };

                ctx.props().update_and_render(update);
                true
            }
            ConfigSelectorMsg::SetFilterValue(index, input) => {
                let ViewConfig { mut filter, .. } =
                    ctx.props().session.get_view_config();

                filter[index].2 = FilterTerm::Scalar(Scalar::String(input));

                let filter = Some(filter);
                let update = ViewConfigUpdate {
                    filter,
                    ..ViewConfigUpdate::default()
                };

                ctx.props().update_and_render(update);
                false
            }
        }
    }

    /// Should not render on change, as this component only depends on service state.
    fn changed(&mut self, _ctx: &Context<Self>) -> bool {
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

                <GroupBySelector
                    name="group_by"
                    parent={ ctx.link().clone() }
                    is_dragover={ ctx.props().dragdrop.is_dragover(DropAction::GroupBy) }
                    dragdrop={ ctx.props().dragdrop.clone() }>
                    {
                        for config.group_by.iter().map(|group_by| {
                            html_nested! {
                                <PivotItem
                                    dragdrop={ ctx.props().dragdrop.clone() }
                                    action={ DropAction::GroupBy }
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

                    { "\u{21C4}" }
                </span>

                <SplitBySelector
                    name="split_by"
                    parent={ ctx.link().clone() }
                    is_dragover={ ctx.props().dragdrop.is_dragover(DropAction::SplitBy) }
                    dragdrop={ ctx.props().dragdrop.clone() }>
                    {
                        for config.split_by.iter().map(|split_by| {
                            html_nested! {
                                <PivotItem
                                    dragdrop={ ctx.props().dragdrop.clone() }
                                    action={ DropAction::SplitBy }
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
                    dragdrop={ ctx.props().dragdrop.clone() }
                    is_dragover={ ctx.props().dragdrop.is_dragover(DropAction::Sort).map(|(index, name)| {
                        (index, Sort(name, SortDir::Asc))
                    }) }>
                    {
                        for config.sort.iter().enumerate().map(|(idx, sort)| {
                            html_nested! {
                                <SortItem
                                    idx={ idx }
                                    session={ ctx.props().session.clone() }
                                    renderer={ ctx.props().renderer.clone() }
                                    dragdrop={ ctx.props().dragdrop.clone() }
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
                    dragdrop={ ctx.props().dragdrop.clone() }
                    is_dragover={ ctx.props().dragdrop.is_dragover(DropAction::Filter).map(|(index, name)| {
                        (index, Filter(name, FilterOp::EQ, FilterTerm::Scalar(Scalar::Null)))
                    }) }>
                    {
                        for config.filter.iter().enumerate().map(|(idx, filter)| {
                            let filter_keydown = ctx.link()
                                .callback(move |txt| ConfigSelectorMsg::SetFilterValue(idx, txt));

                            html_nested! {
                                <FilterItem
                                    idx={ idx }
                                    filter_dropdown={ self.filter_dropdown.clone() }
                                    session={ ctx.props().session.clone() }
                                    renderer={ ctx.props().renderer.clone() }
                                    dragdrop={ ctx.props().dragdrop.clone() }
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
