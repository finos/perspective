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

use yew::{classes, html, Callback, Component, Html, Properties};

use crate::components::style::LocalStyle;
use crate::{clone, css, html_template};

pub trait Tab: PartialEq + std::fmt::Display + Clone + Default + 'static {}
impl Tab for String {}
impl Tab for &'static str {}

#[derive(Properties, Debug, PartialEq)]
pub struct TabListProps<T: Tab> {
    pub tabs: Vec<T>,
    pub match_fn: Callback<T, Html>,
    pub on_tab_change: Callback<(usize, T)>,
    pub selected_tab: Option<usize>,
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

    fn update(&mut self, _ctx: &yew::Context<Self>, msg: Self::Message) -> bool {
        match msg {
            TabListMsg::SetSelected(idx) => {
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
        let gutter_tabs = p
            .tabs
            .iter()
            .enumerate()
            .map(|(idx, tab)| {
                let class = classes!(vec![
                    Some("tab"),
                    (idx == self.selected_idx).then_some("selected")
                ]);

                let onclick = {
                    clone!(ctx.props().on_tab_change, tab);
                    ctx.link().callback(move |_| {
                        on_tab_change.emit((idx, tab.clone()));
                        TabListMsg::SetSelected(idx)
                    })
                };
                html! {
                    <span {class} {onclick}>
                        <div class="tab-title">{tab.to_string()}</div>
                        <div class="tab-border"></div>
                    </span>
                }
            })
            .collect::<Vec<_>>();

        let rendered_child = p
            .match_fn
            .emit(p.tabs.get(self.selected_idx).cloned().unwrap_or_default());
        html_template! {
            <LocalStyle href={ css!("containers/tabs") } />
            <div class="tab-gutter">
                {gutter_tabs}
                <span class="tab tab-padding">
                    <div class="tab-title">{"\u{00a0}"}</div>
                    <div class="tab-border"></div>
                </span>
            </div>
            <div class="tab-content">
                {rendered_child}
            </div>
        }
    }
}
