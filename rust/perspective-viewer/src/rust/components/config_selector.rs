////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::custom_elements::filter_dropdown::FilterDropDownElement;
use crate::dragdrop::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

use super::containers::dragdrop_list::*;
use super::filter_item::*;
use super::pivot_item::*;
use super::sort_item::*;

use std::rc::Rc;
use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct ConfigSelectorProps {
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,
}

derive_renderable_props!(ConfigSelectorProps);

pub enum ConfigSelectorMsg {
    DragOverRowPivots(usize),
    DragOverColumnPivots(usize),
    DragOverSort(usize),
    DragOverFilter(usize),
    DragLeaveRowPivots,
    DragLeaveColumnPivots,
    DragLeaveSort,
    DragLeaveFilter,
    Drop(String, DropAction, DragEffect, usize),
    CloseRowPivot(usize),
    CloseColumnPivot(usize),
    CloseSort(usize),
    CloseFilter(usize),
    SetFilterValue(usize, String),
    TransposePivots,
    ViewCreated,
}

#[derive(Clone)]
pub struct ConfigSelector {
    props: ConfigSelectorProps,
    link: ComponentLink<ConfigSelector>,
    filter_dropdown: FilterDropDownElement,
    subscriptions: [Rc<Subscription>; 2],
}

derive_dragdrop_list!(
    RowPivotSelector,
    RowPivotDragContext,
    ConfigSelector,
    PivotItem,
    DragOverRowPivots,
    DragLeaveRowPivots,
    CloseRowPivot
);

derive_dragdrop_list!(
    ColumnPivotSelector,
    ColumnPivotDragContext,
    ConfigSelector,
    PivotItem,
    DragOverColumnPivots,
    DragLeaveColumnPivots,
    CloseColumnPivot
);

derive_dragdrop_list!(
    SortSelector,
    SortDragContext,
    ConfigSelector,
    SortItem,
    DragOverSort,
    DragLeaveSort,
    CloseSort
);

derive_dragdrop_list!(
    FilterSelector,
    FilterDragContext,
    ConfigSelector,
    FilterItem,
    DragOverFilter,
    DragLeaveFilter,
    CloseFilter
);

impl Component for ConfigSelector {
    type Message = ConfigSelectorMsg;
    type Properties = ConfigSelectorProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        let filter_dropdown = FilterDropDownElement::new(
            props.session.clone(),
            link.callback(|(idx, input)| ConfigSelectorMsg::SetFilterValue(idx, input)),
        );

        let cb = link.callback(|x: (String, DropAction, DragEffect, usize)| {
            ConfigSelectorMsg::Drop(x.0, x.1, x.2, x.3)
        });
        let drop_sub = Rc::new(props.dragdrop.add_on_drop_action(cb));

        let cb = link.callback(|_| ConfigSelectorMsg::ViewCreated);
        let view_sub = Rc::new(props.session.on_view_created.add_listener(cb));

        let subscriptions = [drop_sub, view_sub];
        ConfigSelector {
            props,
            link,
            filter_dropdown,
            subscriptions,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            ConfigSelectorMsg::ViewCreated => true,
            ConfigSelectorMsg::DragOverRowPivots(index) => {
                self.props.dragdrop.drag_enter(DropAction::RowPivots, index)
            }
            ConfigSelectorMsg::DragOverColumnPivots(index) => self
                .props
                .dragdrop
                .drag_enter(DropAction::ColumnPivots, index),
            ConfigSelectorMsg::DragOverSort(index) => {
                self.props.dragdrop.drag_enter(DropAction::Sort, index)
            }
            ConfigSelectorMsg::DragOverFilter(index) => {
                self.props.dragdrop.drag_enter(DropAction::Filter, index)
            }
            ConfigSelectorMsg::DragLeaveRowPivots => {
                self.props.dragdrop.drag_leave(DropAction::RowPivots);
                true
            }
            ConfigSelectorMsg::DragLeaveColumnPivots => {
                self.props.dragdrop.drag_leave(DropAction::ColumnPivots);
                true
            }
            ConfigSelectorMsg::DragLeaveSort => {
                self.props.dragdrop.drag_leave(DropAction::Sort);
                true
            }
            ConfigSelectorMsg::DragLeaveFilter => {
                self.props.dragdrop.drag_leave(DropAction::Filter);
                true
            }
            ConfigSelectorMsg::CloseSort(index) => {
                let ViewConfig { mut sort, .. } = self.props.session.get_view_config();
                sort.remove(index as usize);
                let sort = Some(sort);
                self.props.update_and_render(ViewConfigUpdate {
                    sort,
                    ..ViewConfigUpdate::default()
                });

                true
            }
            ConfigSelectorMsg::CloseRowPivot(index) => {
                let ViewConfig { mut row_pivots, .. } =
                    self.props.session.get_view_config();
                row_pivots.remove(index as usize);
                let row_pivots = Some(row_pivots);
                self.props.update_and_render(ViewConfigUpdate {
                    row_pivots,
                    ..ViewConfigUpdate::default()
                });

                true
            }
            ConfigSelectorMsg::CloseColumnPivot(index) => {
                let ViewConfig {
                    mut column_pivots, ..
                } = self.props.session.get_view_config();
                column_pivots.remove(index as usize);
                self.props.update_and_render(ViewConfigUpdate {
                    column_pivots: Some(column_pivots),
                    ..ViewConfigUpdate::default()
                });

                true
            }
            ConfigSelectorMsg::CloseFilter(index) => {
                self.filter_dropdown.hide().unwrap();
                let ViewConfig { mut filter, .. } =
                    self.props.session.get_view_config();
                filter.remove(index as usize);
                self.props.update_and_render(ViewConfigUpdate {
                    filter: Some(filter),
                    ..ViewConfigUpdate::default()
                });

                true
            }
            ConfigSelectorMsg::Drop(column, action, effect, index)
                if action != DropAction::Active =>
            {
                let update = self.props.session.create_drag_drop_update(
                    column,
                    index,
                    action,
                    effect,
                    &self.props.renderer.metadata(),
                );
                self.props.update_and_render(update);
                true
            }
            ConfigSelectorMsg::Drop(_, _, DragEffect::Move(action), _)
                if action != DropAction::Active =>
            {
                true
            }
            ConfigSelectorMsg::Drop(_, _, _, _) => false,
            ConfigSelectorMsg::TransposePivots => {
                let mut view_config = self.props.session.get_view_config();
                std::mem::swap(
                    &mut view_config.row_pivots,
                    &mut view_config.column_pivots,
                );

                let update = ViewConfigUpdate {
                    row_pivots: Some(view_config.row_pivots),
                    column_pivots: Some(view_config.column_pivots),
                    ..ViewConfigUpdate::default()
                };

                self.props.update_and_render(update);
                true
            }
            ConfigSelectorMsg::SetFilterValue(index, input) => {
                let ViewConfig { mut filter, .. } =
                    self.props.session.get_view_config();

                filter[index].2 = FilterTerm::Scalar(Scalar::String(input));

                let filter = Some(filter);
                let update = ViewConfigUpdate {
                    filter,
                    ..ViewConfigUpdate::default()
                };

                self.props.update_and_render(update);
                false
            }
        }
    }

    /// Should not render on change, as this component only depends on service state.
    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        false
    }

    fn view(&self) -> Html {
        let config = self.props.session.get_view_config();
        let transpose = self.link.callback(|_| ConfigSelectorMsg::TransposePivots);

        html! {
            <div slot="top_panel" id="top_panel">

                <RowPivotSelector
                    name="row_pivots"
                    parent={ self.link.clone() }
                    is_dragover={ self.props.dragdrop.is_dragover(DropAction::RowPivots) }
                    dragdrop={ self.props.dragdrop.clone() }>
                    {
                        for config.row_pivots.iter().map(|row_pivot| {
                            html_nested! {
                                <PivotItem
                                    dragdrop={ self.props.dragdrop.clone() }
                                    action={ DropAction::RowPivots }
                                    column={ row_pivot.clone() }>
                                </PivotItem>
                            }
                        })
                    }
                </RowPivotSelector>

                <span
                    id="transpose_button"
                    class="rrow centered"
                    title="Transpose Pivots"
                    onmousedown={ transpose }>

                    { "\u{21C4}" }
                </span>

                <ColumnPivotSelector
                    name="column_pivots"
                    parent={ self.link.clone() }
                    is_dragover={ self.props.dragdrop.is_dragover(DropAction::ColumnPivots) }
                    dragdrop={ self.props.dragdrop.clone() }>
                    {
                        for config.column_pivots.iter().map(|column_pivot| {
                            html_nested! {
                                <PivotItem
                                    dragdrop={ self.props.dragdrop.clone() }
                                    action={ DropAction::ColumnPivots }
                                    column={ column_pivot.clone() }>
                                </PivotItem>
                            }
                        })
                    }
                </ColumnPivotSelector>

                <SortSelector
                    name="sort"
                    allow_duplicates=true
                    parent={ self.link.clone() }
                    dragdrop={ self.props.dragdrop.clone() }
                    is_dragover={ self.props.dragdrop.is_dragover(DropAction::Sort).map(|(index, name)| {
                        (index, Sort(name, SortDir::Asc))
                    }) }>
                    {
                        for config.sort.iter().enumerate().map(|(idx, sort)| {
                            html_nested! {
                                <SortItem
                                    idx={ idx }
                                    session={ self.props.session.clone() }
                                    renderer={ self.props.renderer.clone() }
                                    dragdrop={ self.props.dragdrop.clone() }
                                    sort={ sort.clone() }>
                                </SortItem>
                            }
                        })
                    }
                </SortSelector>

                <FilterSelector
                    name="filter"
                    allow_duplicates=true
                    parent={ self.link.clone() }
                    dragdrop={ self.props.dragdrop.clone() }
                    is_dragover={ self.props.dragdrop.is_dragover(DropAction::Filter).map(|(index, name)| {
                        (index, Filter(name, FilterOp::EQ, FilterTerm::Scalar(Scalar::Null)))
                    }) }>
                    {
                        for config.filter.iter().enumerate().map(|(idx, filter)| {
                            let filter_keydown = self
                                .link
                                .callback(move |txt| ConfigSelectorMsg::SetFilterValue(idx, txt));

                            html_nested! {
                                <FilterItem
                                    idx={ idx }
                                    filter_dropdown={ self.filter_dropdown.clone() }
                                    session={ self.props.session.clone() }
                                    renderer={ self.props.renderer.clone() }
                                    dragdrop={ self.props.dragdrop.clone() }
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
