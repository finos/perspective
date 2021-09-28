////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::dragdrop::*;

use super::containers::dragdrop_list::*;

use web_sys::*;
use yew::prelude::*;

pub struct PivotItem {
    props: PivotItemProperties,
}

#[derive(Properties, Clone)]
pub struct PivotItemProperties {
    pub column: String,
    pub dragdrop: DragDrop,
    pub action: DropAction,
}

impl DragDropListItemProps for PivotItemProperties {
    type Item = String;

    fn get_item(&self) -> String {
        self.column.clone()
    }
}

impl Component for PivotItem {
    type Message = ();
    type Properties = PivotItemProperties;

    fn view(&self) -> Html {
        let noderef = NodeRef::default();
        let dragstart = Callback::from({
            let event_name = self.props.column.to_owned();
            let noderef = noderef.clone();
            let dragdrop = self.props.dragdrop.clone();
            let action = self.props.action;
            move |event: DragEvent| {
                let elem = noderef.cast::<HtmlElement>().unwrap();
                event.data_transfer().unwrap().set_drag_image(&elem, 0, 0);
                dragdrop.drag_start(event_name.to_string(), DragEffect::Move(action))
            }
        });

        let dragend = Callback::from({
            let dragdrop = self.props.dragdrop.clone();
            move |_event| {
                dragdrop.drag_end()
            }
        });

        html! {
            <span
                draggable="true"
                ref={ noderef.clone() }
                ondragstart={ dragstart }
                ondragend={ dragend }>
                {
                    self.props.column.clone()
                }
            </span>
        }
    }

    fn create(
        props: <Self as yew::Component>::Properties,
        _: yew::html::Scope<Self>,
    ) -> Self {
        PivotItem { props }
    }

    fn update(&mut self, _: ()) -> bool {
        true
    }

    fn change(&mut self, props: PivotItemProperties) -> bool {
        let should_render = props.column != self.props.column;
        self.props = props;
        should_render
    }
}
