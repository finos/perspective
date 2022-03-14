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

pub type ExportDropDownMenuItem = DropDownMenuItem<ExportFile>;

#[derive(Properties, Clone, PartialEq)]
pub struct ExportDropDownMenuProps {
    pub renderer: Renderer,
    pub callback: Callback<ExportFile>,
}

#[derive(Default)]
pub struct ExportDropDownMenu {
    top: i32,
    left: i32,
    title: String,
    input_ref: NodeRef,
    invalid: bool,
}

pub enum ExportDropDownMenuMsg {
    SetPos(i32, i32),
    TitleChange,
}

fn get_menu_items(name: &str, has_render: bool) -> Vec<ExportDropDownMenuItem> {
    vec![
        ExportDropDownMenuItem::OptGroup(
            "Current View",
            if has_render {
                vec![
                    ExportMethod::Csv.new_file(name),
                    ExportMethod::Json.new_file(name),
                    ExportMethod::Arrow.new_file(name),
                    ExportMethod::Html.new_file(name),
                    ExportMethod::Png.new_file(name),
                ]
            } else {
                vec![
                    ExportMethod::Csv.new_file(name),
                    ExportMethod::Json.new_file(name),
                    ExportMethod::Arrow.new_file(name),
                    ExportMethod::Html.new_file(name),
                ]
            },
        ),
        ExportDropDownMenuItem::OptGroup("All", vec![
            ExportMethod::CsvAll.new_file(name),
            ExportMethod::JsonAll.new_file(name),
            ExportMethod::ArrowAll.new_file(name),
        ]),
        ExportDropDownMenuItem::OptGroup("Config", vec![ExportMethod::JsonConfig.new_file(name)]),
    ]
}

impl Component for ExportDropDownMenu {
    type Properties = ExportDropDownMenuProps;
    type Message = ExportDropDownMenuMsg;

    fn view(&self, ctx: &Context<Self>) -> yew::virtual_dom::VNode {
        let callback = ctx.link().callback(|_| ExportDropDownMenuMsg::TitleChange);
        let plugin = ctx.props().renderer.get_active_plugin().unwrap();
        let has_render = js_sys::Reflect::has(&plugin, js_intern!("render")).unwrap();
        html_template! {
            <ModalAnchor top={ self.top } left={ self.left } />
            <span class="dropdown-group-label">{ "Save as" }</span>
            <input
                class={ if self.invalid { "invalid" } else { "" }}
                oninput={ callback }
                ref={ self.input_ref.clone() }
                value={ self.title.to_owned() } />
            <DropDownMenu<ExportFile>
                values={ Rc::new(get_menu_items(&self.title, has_render)) }
                callback={ ctx.props().callback.clone() }>
            </DropDownMenu<ExportFile>>
        }
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            ExportDropDownMenuMsg::SetPos(top, left) => {
                self.top = top;
                self.left = left;
                true
            }
            ExportDropDownMenuMsg::TitleChange => {
                self.title = self
                    .input_ref
                    .cast::<web_sys::HtmlInputElement>()
                    .unwrap()
                    .value();

                self.invalid = self.title.is_empty();
                true
            }
        }
    }

    fn create(_ctx: &Context<Self>) -> Self {
        ExportDropDownMenu {
            title: "untitled".to_owned(),
            ..Default::default()
        }
    }
}
