////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::dragdrop::*;
use crate::renderer::*;
use crate::session::*;
use crate::*;

use super::containers::dragdrop_list::*;

use web_sys::*;
use yew::prelude::*;

/// A `SortItem` includes the column name and `SortDir` arrow, a clickable button
/// which cycles through the available `SortDir` states.
pub struct SortItem {
    props: SortItemProperties,
    link: ComponentLink<SortItem>,
}

#[derive(Properties, Clone)]
pub struct SortItemProperties {
    pub sort: Sort,
    pub idx: usize,
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,
}

derive_renderable_props!(SortItemProperties);

impl DragDropListItemProps for SortItemProperties {
    type Item = Sort;

    fn get_item(&self) -> Sort {
        self.sort.clone()
    }
}

pub enum SortItemMsg {
    SortDirClick(bool),
}

impl Component for SortItem {
    type Message = SortItemMsg;
    type Properties = SortItemProperties;

    fn create(
        props: <Self as yew::Component>::Properties,
        link: yew::html::Scope<Self>,
    ) -> Self {
        SortItem { props, link }
    }

    fn update(&mut self, msg: SortItemMsg) -> bool {
        match msg {
            SortItemMsg::SortDirClick(shift_key) => {
                let ViewConfig {
                    mut sort,
                    column_pivots,
                    ..
                } = self.props.session.get_view_config();
                let sort_item =
                    &mut sort.get_mut(self.props.idx).expect("Sort on no column");
                sort_item.1 = sort_item.1.cycle(!column_pivots.is_empty(), shift_key);
                let update = ViewConfigUpdate {
                    sort: Some(sort),
                    ..ViewConfigUpdate::default()
                };
                self.props.update_and_render(update);
                false
            }
        }
    }

    fn change(&mut self, props: SortItemProperties) -> bool {
        self.props = props;
        true
    }

    fn view(&self) -> Html {
        let onclick = self
            .link
            .callback(|event: MouseEvent| SortItemMsg::SortDirClick(event.shift_key()));

        let noderef = NodeRef::default();
        let dragstart = Callback::from({
            let event_name = self.props.sort.0.to_owned();
            let noderef = noderef.clone();
            let dragdrop = self.props.dragdrop.clone();
            move |event: DragEvent| {
                let elem = noderef.cast::<HtmlElement>().unwrap();
                event.data_transfer().unwrap().set_drag_image(&elem, 0, 0);
                dragdrop.drag_start(
                    event_name.to_string(),
                    DragEffect::Move(DropAction::Sort),
                )
            }
        });

        html! {
            <>
                <span
                    draggable="true"
                    ref={ noderef.clone() }
                    ondragstart={ dragstart }>
                    {
                        self.props.sort.0.to_owned()
                    }
                </span>
                <span
                    class={ format!("sort-icon {}", self.props.sort.1) }
                    onmousedown={ onclick }>
                </span>
            </>
        }
    }
}
