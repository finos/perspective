// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

use std::rc::Rc;

use yew::prelude::*;

use super::containers::dropdown_menu::*;
use super::modal::*;
use super::style::StyleProvider;
use crate::model::*;
use crate::renderer::*;
use crate::utils::*;

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
        let has_render = js_sys::Reflect::has(&plugin, js_intern::js_intern!("render")).unwrap();
        let has_selection = ctx.props().renderer.get_selection().is_some();
        html! {
            <StyleProvider>
                <DropDownMenu<ExportMethod>
                    values={Rc::new(get_menu_items(has_render, has_selection))}
                    callback={&ctx.props().callback}
                />
            </StyleProvider>
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

        Self { _sub }
    }
}

fn get_menu_items(has_render: bool, has_selection: bool) -> Vec<CopyDropDownMenuItem> {
    let mut items = vec![
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
    ];

    if has_selection {
        items.insert(
            0,
            CopyDropDownMenuItem::OptGroup("Current Selection".into(), vec![
                ExportMethod::CsvSelected,
                ExportMethod::JsonSelected,
            ]),
        )
    }

    items
}
