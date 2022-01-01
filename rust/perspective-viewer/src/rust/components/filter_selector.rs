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

struct FilterDragContext {}

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

type FilterSelectorList = DragDropList<FilterSelector, FilterItem, FilterDragContext>;

#[derive(Clone, Properties)]
struct FilterSelectorProps {
    session: Session,
    renderer: Renderer,
    dragdrop: DragDrop,
}

struct FilterSelector {
    filter_dropdown: FilterDropDownElement,
}

impl Component for FilterSelector {
    type Message = ();
    type Properties = FilterSelectorProps;

    fn create(ctx: &Context<Self>) -> Self {
        let filter_dropdown = FilterDropDownElement::new(props.session.clone());
        FilterSelector { filter_dropdown }
    }

    fn update(&mut self, msg: Self::Message) -> bool {
        false
    }

    /// Should not render on change, as this component only depends on service state.
    fn changed(&mut self, _props: Self::Properties) -> bool {
        false
    }

    fn view(&self) -> Html {
        let config = self.props.session.get_view_config();
        let class = if self.props.dragdrop.get_drag_column().is_some() {
            "dragdrop-highlight"
        } else {
            ""
        };

        let dragend = Callback::from({
            let dragdrop = self.props.dragdrop.clone();
            move |_event| dragdrop.drag_end()
        });

        html! {
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
        }
    }
}
