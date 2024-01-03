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

use yew::{classes, html, Callback, Children, Component, Html, Properties};

use crate::components::style::LocalStyle;
use crate::{css, html_template};

pub trait Tab: PartialEq + std::fmt::Display + Clone + Default + 'static {}

impl Tab for String {}

impl Tab for &'static str {}

#[derive(Properties, Debug, PartialEq)]
pub struct TabListProps<T: Tab> {
    // all possible tabs
    pub tabs: Vec<T>,
    pub on_tab_change: Callback<(usize, T)>,
    pub selected_tab: Option<usize>,
    // the curently instantiated tabs
    pub children: Children,
}

pub enum TabListMsg {
    SetSelected(usize),
}

pub struct TabList<T: Tab> {
    t: std::marker::PhantomData<T>,
    selected_idx: usize,
}

impl<T: Tab> Component for TabList<T> {
    type Message = TabListMsg;
    type Properties = TabListProps<T>;

    fn create(_ctx: &yew::Context<Self>) -> Self {
        Self {
            t: std::marker::PhantomData,
            selected_idx: 0,
        }
    }

    fn update(&mut self, ctx: &yew::Context<Self>, msg: Self::Message) -> bool {
        match msg {
            TabListMsg::SetSelected(idx) => {
                ctx.props()
                    .on_tab_change
                    .emit((idx, ctx.props().tabs[idx].clone()));
                self.selected_idx = idx;
                true
            },
        }
    }

    fn changed(&mut self, ctx: &yew::Context<Self>, _old_props: &Self::Properties) -> bool {
        self.selected_idx = ctx.props().selected_tab.unwrap_or_default();
        true
    }

    fn view(&self, ctx: &yew::Context<Self>) -> Html {
        let p = ctx.props();
        let gutter_tabs = p.tabs.iter().enumerate().map(|(idx, tab)| {
            let mut class = classes!("tab");
            if idx == self.selected_idx {
                class.push("selected");
            }

            let onclick = ctx.link().callback(move |_| TabListMsg::SetSelected(idx));
            html! {
                <span { class } { onclick }>
                    <div class="tab-title">{ tab.to_string() }</div>
                    <div class="tab-border"></div>
                </span>
            }
        });

        html_template! {
            <LocalStyle href={ css!("containers/tabs") }/>
            <div class="tab-gutter">
                { for gutter_tabs }
                <span class="tab tab-padding">
                    <div class="tab-title">{ "\u{00a0}" }</div>
                    <div class="tab-border"></div>
                </span>
            </div>
            <div class="tab-content">
                { ctx.props().children.iter().nth(self.selected_idx) }
            </div>
        }
    }
}
