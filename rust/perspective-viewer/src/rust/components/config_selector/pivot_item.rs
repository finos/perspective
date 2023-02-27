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
        let dragstart = Callback::from({
            let event_name = ctx.props().column.to_owned();
            let dragdrop = ctx.props().dragdrop.clone();
            let action = ctx.props().action;
            move |event: DragEvent| {
                dragdrop.set_drag_image(&event).unwrap();
                dragdrop.notify_drag_start(event_name.to_string(), DragEffect::Move(action))
            }
        });

        let dragend = Callback::from({
            let dragdrop = ctx.props().dragdrop.clone();
            move |_event| dragdrop.notify_drag_end()
        });

        html! {
            <div
                class="pivot-column-draggable"
                draggable="true"
                ondragstart={ dragstart }
                ondragend={ dragend }>
                <div class="pivot-column-border">
                    <span class="column_name string">
                        { ctx.props().column.clone() }
                    </span>
                </div>
            </div>
        }
    }

    fn create(_ctx: &Context<Self>) -> Self {
        PivotItem {}
    }
}
