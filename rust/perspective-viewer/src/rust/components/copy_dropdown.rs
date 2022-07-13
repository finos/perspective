////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::containers::dropdown_menu::*;
use super::modal::*;
use crate::model::*;
use crate::renderer::*;
use crate::utils::*;
use crate::*;

use js_intern::*;
use std::rc::Rc;
use yew::prelude::*;

pub type CopyDropDownMenuMsg = DropDownMenuMsg;
pub type CopyDropDownMenuItem = DropDownMenuItem<ExportMethod>;

#[derive(Properties, PartialEq)]
pub struct CopyDropDownMenuProps {
    pub renderer: Renderer,
    pub callback: Callback<ExportMethod>,

    #[prop_or_default]
    weak_link: WeakScope<CopyDropDownMenu>,
}

pub struct CopyDropDownMenu {
    _sub: Subscription,
}

impl ModalLink<CopyDropDownMenu> for CopyDropDownMenuProps {
    fn weak_link(&self) -> &'_ WeakScope<CopyDropDownMenu> {
        &self.weak_link
    }
}

impl Component for CopyDropDownMenu {
    type Message = CopyDropDownMenuMsg;
    type Properties = CopyDropDownMenuProps;

    fn view(&self, ctx: &Context<Self>) -> yew::virtual_dom::VNode {
        let plugin = ctx.props().renderer.get_active_plugin().unwrap();
        let has_render = js_sys::Reflect::has(&plugin, js_intern!("render")).unwrap();
        html_template! {
            <DropDownMenu<ExportMethod>
                values={ Rc::new(get_menu_items(has_render)) }
                callback={ ctx.props().callback.clone() }>
            </DropDownMenu<ExportMethod>>
        }
    }

    fn update(&mut self, _ctx: &Context<Self>, _msg: Self::Message) -> bool {
        true
    }

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        let _sub = ctx
            .props()
            .renderer
            .plugin_changed
            .add_listener(ctx.link().callback(|_| ()));

        CopyDropDownMenu { _sub }
    }
}

fn get_menu_items(has_render: bool) -> Vec<CopyDropDownMenuItem> {
    vec![
        CopyDropDownMenuItem::OptGroup(
            "Current View".into(),
            if has_render {
                vec![ExportMethod::Csv, ExportMethod::Json, ExportMethod::Png]
            } else {
                vec![ExportMethod::Csv, ExportMethod::Json]
            },
        ),
        CopyDropDownMenuItem::OptGroup("All".into(), vec![
            ExportMethod::CsvAll,
            ExportMethod::JsonAll,
        ]),
        CopyDropDownMenuItem::OptGroup("Config".into(), vec![ExportMethod::JsonConfig]),
    ]
}
