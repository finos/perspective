////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::containers::dropdown_menu::*;
use super::containers::modal_anchor::*;
use crate::model::*;
use crate::renderer::*;
use crate::*;

use js_intern::*;
use std::rc::Rc;
use yew::prelude::*;

pub type CopyDropDownMenuMsg = DropDownMenuMsg;
pub type CopyDropDownMenuItem = DropDownMenuItem<ExportMethod>;

#[derive(Properties, Clone, PartialEq)]
pub struct CopyDropDownMenuProps {
    pub renderer: Renderer,
    pub callback: Callback<ExportMethod>,
}

#[derive(Default)]
pub struct CopyDropDownMenu {
    top: i32,
    left: i32,
}

impl Component for CopyDropDownMenu {
    type Message = CopyDropDownMenuMsg;
    type Properties = CopyDropDownMenuProps;

    fn view(&self, ctx: &Context<Self>) -> yew::virtual_dom::VNode {
        let plugin = ctx.props().renderer.get_active_plugin().unwrap();
        let has_render = js_sys::Reflect::has(&plugin, js_intern!("render")).unwrap();
        html_template! {
            <ModalAnchor top={ self.top } left={ self.left } />
            <DropDownMenu<ExportMethod>
                values={ Rc::new(get_menu_items(has_render)) }
                callback={ ctx.props().callback.clone() }>
            </DropDownMenu<ExportMethod>>
        }
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            CopyDropDownMenuMsg::SetPos(top, left) => {
                self.top = top;
                self.left = left;
                true
            }
        }
    }

    fn create(_ctx: &Context<Self>) -> Self {
        CopyDropDownMenu::default()
    }
}

fn get_menu_items(has_render: bool) -> Vec<CopyDropDownMenuItem> {
    vec![
        CopyDropDownMenuItem::OptGroup(
            "Current View",
            if has_render {
                vec![ExportMethod::Csv, ExportMethod::Json, ExportMethod::Png]
            } else {
                vec![ExportMethod::Csv, ExportMethod::Json]
            },
        ),
        CopyDropDownMenuItem::OptGroup("All", vec![ExportMethod::CsvAll, ExportMethod::JsonAll]),
        CopyDropDownMenuItem::OptGroup("Config", vec![ExportMethod::JsonConfig]),
    ]
}
