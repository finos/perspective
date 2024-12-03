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

use presentation::Presentation;
use yew::prelude::*;

use super::containers::dropdown_menu::*;
use super::modal::{ModalLink, SetModalLink};
use super::style::StyleProvider;
use crate::model::*;
use crate::renderer::*;
use crate::utils::*;
use crate::*;

pub type ExportDropDownMenuItem = DropDownMenuItem<ExportFile>;

#[derive(Properties, PartialEq)]
pub struct ExportDropDownMenuProps {
    pub renderer: Renderer,
    pub presentation: Presentation,
    pub callback: Callback<ExportFile>,

    #[prop_or_default]
    weak_link: WeakScope<ExportDropDownMenu>,
}

impl ModalLink<ExportDropDownMenu> for ExportDropDownMenuProps {
    fn weak_link(&self) -> &'_ utils::WeakScope<ExportDropDownMenu> {
        &self.weak_link
    }
}

#[derive(Default)]
pub struct ExportDropDownMenu {
    title: String,
    _sub: Option<Subscription>,
    input_ref: NodeRef,
    invalid: bool,
}

pub enum ExportDropDownMenuMsg {
    TitleChange,
}

fn get_menu_items(name: &str, has_render: bool) -> Vec<ExportDropDownMenuItem> {
    vec![
        ExportDropDownMenuItem::OptGroup(
            "Current View".into(),
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
        ExportDropDownMenuItem::OptGroup("All".into(), vec![
            ExportMethod::CsvAll.new_file(name),
            ExportMethod::JsonAll.new_file(name),
            ExportMethod::ArrowAll.new_file(name),
        ]),
        ExportDropDownMenuItem::OptGroup("Config".into(), vec![
            ExportMethod::JsonConfig.new_file(name)
        ]),
    ]
}

impl Component for ExportDropDownMenu {
    type Message = ExportDropDownMenuMsg;
    type Properties = ExportDropDownMenuProps;

    fn view(&self, ctx: &Context<Self>) -> yew::virtual_dom::VNode {
        let callback = ctx.link().callback(|_| ExportDropDownMenuMsg::TitleChange);
        let plugin = ctx.props().renderer.get_active_plugin().unwrap();
        let has_render = js_sys::Reflect::has(&plugin, js_intern::js_intern!("render")).unwrap();
        html! {
            <StyleProvider>
                <span class="dropdown-group-label">{ "Save as" }</span>
                <input
                    class={if self.invalid { "invalid" } else { "" }}
                    oninput={callback}
                    ref={&self.input_ref}
                    value={self.title.to_owned()}
                />
                <DropDownMenu<ExportFile>
                    values={Rc::new(get_menu_items(&self.title, has_render))}
                    callback={&ctx.props().callback}
                />
            </StyleProvider>
        }
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            ExportDropDownMenuMsg::TitleChange => {
                self.title = self
                    .input_ref
                    .cast::<web_sys::HtmlInputElement>()
                    .unwrap()
                    .value();

                self.invalid = self.title.is_empty();
                true
            },
        }
    }

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        let _sub = Some(
            ctx.props()
                .renderer
                .plugin_changed
                .add_listener(ctx.link().callback(|_| ExportDropDownMenuMsg::TitleChange)),
        );

        Self {
            title: ctx
                .props()
                .presentation
                .get_title()
                .unwrap_or_else(|| "untitled".to_owned()),
            _sub,
            ..Default::default()
        }
    }
}
