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

use yew::{function_component, html, Callback, Html, Properties};

use crate::components::column_settings_sidebar::attributes_tab::{
    AttributesTab, AttributesTabProps,
};
use crate::components::column_settings_sidebar::style_tab::{StyleTab, StyleTabProps};
use crate::components::containers::tablist::TabList;
use crate::custom_events::CustomEvents;
use crate::presentation::Presentation;
use crate::renderer::Renderer;
use crate::session::Session;

#[derive(Debug, Default, Clone, Copy, PartialEq)]
pub enum ColumnSettingsTab {
    #[default]
    Attributes,
    Style,
}

#[derive(Properties, PartialEq, Clone)]
pub struct ColumnSettingsTablistProps {
    pub renderer: Renderer,
    pub presentation: Presentation,
    pub session: Session,
    pub custom_events: CustomEvents,

    pub attrs_tab: AttributesTabProps,
    pub style_tab: StyleTabProps,

    pub on_tab_change: Callback<(usize, ColumnSettingsTab)>,
    pub selected_tab: (usize, ColumnSettingsTab),
    pub tabs: Rc<Vec<ColumnSettingsTab>>,
}

#[function_component(ColumnSettingsTablist)]
pub fn column_settings_tablist(p: &ColumnSettingsTablistProps) -> Html {
    let match_fn = yew::use_callback(p.clone(), move |tab, p| match tab {
        ColumnSettingsTab::Attributes => {
            html! {
                <AttributesTab ..p.attrs_tab.clone() />
            }
        },
        ColumnSettingsTab::Style => html! {
            <StyleTab ..p.style_tab.clone() />
        },
    });

    let selected_tab = if p.selected_tab.0 >= p.tabs.len() {
        0
    } else {
        p.selected_tab.0
    };

    html! {
        <TabList<ColumnSettingsTab>
            // TODO: This clone could be avoided with traits
            tabs={(*p.tabs).clone()}
            {match_fn}
            on_tab_change={p.on_tab_change.clone()}
            {selected_tab}
        />
    }
}
