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

mod attributes_tab;
mod style_tab;

use std::fmt::Display;

use yew::{function_component, html, Callback, Html, Properties};

use super::containers::tablist::Tab;
use super::viewer::ColumnLocator;
use crate::components::column_settings_sidebar::attributes_tab::AttributesTab;
use crate::components::column_settings_sidebar::style_tab::StyleTab;
use crate::components::containers::sidebar::Sidebar;
use crate::components::containers::tablist::TabList;
use crate::components::style::LocalStyle;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::{clone, css, html_template};

#[derive(Debug, Default, Clone, PartialEq)]
pub enum ColumnSettingsTab {
    #[default]
    Attributes,
    Style,
}
impl Display for ColumnSettingsTab {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!("{self:?}"))
    }
}
impl Tab for ColumnSettingsTab {}

#[derive(PartialEq, Clone, Properties)]
pub struct ColumnSettingsProps {
    pub selected_column: ColumnLocator,
    pub on_close: Callback<()>,
    pub session: Session,
    pub renderer: Renderer,
}

#[function_component]
pub fn ColumnSettingsSidebar(p: &ColumnSettingsProps) -> Html {
    let column_name = match p.selected_column.clone() {
        ColumnLocator::Expr(maybe_name) => maybe_name.unwrap_or("New Column".to_string()),
        ColumnLocator::Plain(name) => name,
    };

    let column_type = p.session.metadata().get_column_view_type(&column_name);
    let is_active = column_type.is_some();

    let mut tabs = vec![];

    // Eventually the Attributes tab will have more properties than
    // just the expression editor. Once that happens, stop hiding it.
    if matches!(p.selected_column, ColumnLocator::Expr(_)) {
        tabs.push(ColumnSettingsTab::Attributes);
    }
    if !matches!(p.selected_column, ColumnLocator::Expr(None)) && is_active {
        tabs.push(ColumnSettingsTab::Style);
    }

    let title = format!("Editing ‘{column_name}’...");

    clone!(
        p.selected_column,
        p.on_close,
        p.session,
        p.renderer,
        column_name
    );
    let match_fn = Callback::from(move |tab| {
        clone!(selected_column, on_close, session, renderer, column_name);
        match tab {
            ColumnSettingsTab::Attributes => html! {
                <AttributesTab
                    { selected_column }
                    { on_close }
                    { session }
                    { renderer }
                />
            },
            ColumnSettingsTab::Style => html! {
                <StyleTab
                    { column_name }
                    { session }
                    { renderer }
                />
            },
        }
    });

    html_template! {
        <LocalStyle href={css!("column-settings-panel")} />
        <Sidebar
            {title}
            on_close={p.on_close.clone()}
            id_prefix="column_settings"
            icon={html_template!{
                <span id="column_settings_icon"></span>
            }}
        >
            <TabList<ColumnSettingsTab> {tabs} {match_fn} />
        </Sidebar>

    }
}
