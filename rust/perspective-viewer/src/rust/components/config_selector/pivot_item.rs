////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use web_sys::*;
use yew::prelude::*;

use crate::components::containers::dragdrop_list::*;
use crate::dragdrop::*;

pub struct PivotItem {}

#[derive(Properties)]
pub struct PivotItemProps {
    pub column: String,
    pub dragdrop: DragDrop,
    pub action: DragTarget,
}

impl PartialEq for PivotItemProps {
    fn eq(&self, other: &Self) -> bool {
        self.column == other.column && self.action == other.action
    }
}

impl DragDropListItemProps for PivotItemProps {
    type Item = String;

    fn get_item(&self) -> String {
        self.column.clone()
    }
}

impl Component for PivotItem {
    type Message = ();
    type Properties = PivotItemProps;

    fn view(&self, ctx: &Context<Self>) -> Html {
        let noderef = NodeRef::default();
        let dragstart = Callback::from({
            let event_name = ctx.props().column.to_owned();
            let noderef = noderef.clone();
            let dragdrop = ctx.props().dragdrop.clone();
            let action = ctx.props().action;
            move |event: DragEvent| {
                let elem = noderef.cast::<HtmlElement>().unwrap();
                event.data_transfer().unwrap().set_drag_image(&elem, 0, 0);
                dragdrop.drag_start(event_name.to_string(), DragEffect::Move(action))
            }
        });

        let dragend = Callback::from({
            let dragdrop = ctx.props().dragdrop.clone();
            move |_event| dragdrop.drag_end()
        });

        html! {
            <span
                draggable="true"
                ref={ noderef.clone() }
                ondragstart={ dragstart }
                ondragend={ dragend }>
                {
                    ctx.props().column.clone()
                }
            </span>
        }
    }

    fn create(_ctx: &Context<Self>) -> Self {
        PivotItem {}
    }
}
