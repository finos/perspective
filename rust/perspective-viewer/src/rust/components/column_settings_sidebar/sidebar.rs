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

use std::fmt::Display;

use yew::{function_component, html, Callback, Html, Properties};

use crate::components::column_settings_sidebar::attributes_tab::AttributesTab;
use crate::components::column_settings_sidebar::style_tab::StyleTab;
use crate::components::containers::sidebar::Sidebar;
use crate::components::containers::tablist::{Tab, TabList};
use crate::components::expression_editor::get_new_column_name;
use crate::components::style::LocalStyle;
use crate::components::viewer::ColumnLocator;
use crate::custom_events::CustomEvents;
use crate::model::*;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::{clone, css, derive_model, html_template};

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

#[derive(Clone, Properties)]
pub struct ColumnSettingsProps {
    pub selected_column: ColumnLocator,
    pub on_close: Callback<()>,
    pub session: Session,
    pub renderer: Renderer,
    pub custom_events: CustomEvents,
}

derive_model!(CustomEvents, Session, Renderer for ColumnSettingsProps);

impl PartialEq for ColumnSettingsProps {
    fn eq(&self, other: &Self) -> bool {
        self.selected_column == other.selected_column
    }
}

#[function_component]
pub fn ColumnSettingsSidebar(p: &ColumnSettingsProps) -> Html {
    let column_name = match p.selected_column.clone() {
        ColumnLocator::Expr(Some(name)) | ColumnLocator::Plain(name) => name,
        ColumnLocator::Expr(None) => get_new_column_name(&p.session),
    };

    let column_type = p.session.metadata().get_column_view_type(&column_name);
    let is_active = column_type.is_some();

    let (config, attrs) = p.get_plugin_config();
    if config.is_none() || attrs.is_none() {
        tracing::warn!(
            "Could not get full plugin config!\nconfig (plugin.save()): {:?}\nplugin_attrs: {:?}",
            config,
            attrs
        );
    }
    let maybe_ty = p.session.metadata().get_column_view_type(&column_name);

    let title = format!("Editing ‘{column_name}’...");

    let mut tabs = vec![ColumnSettingsTab::Attributes];

    if !matches!(p.selected_column, ColumnLocator::Expr(None))
        && is_active
        && config.is_some()
        && attrs.is_some()
        && maybe_ty.is_some()
    {
        tabs.reverse();
        tabs.push(ColumnSettingsTab::Style);
        tabs.reverse();
    }

    clone!(
        p.selected_column,
        p.on_close,
        p.session,
        p.renderer,
        p.custom_events,
        column_name
    );
    let match_fn = Callback::from(move |tab| {
        clone!(
            selected_column,
            on_close,
            session,
            renderer,
            custom_events,
            column_name
        );
        match tab {
            ColumnSettingsTab::Attributes => {
                html! {
                    <AttributesTab
                        { session }
                        { renderer }
                        { custom_events }

                        { selected_column }
                        { on_close }
                        { maybe_ty }
                    />
                }
            }
            ColumnSettingsTab::Style => html! {
                <StyleTab
                    { session }
                    { renderer }
                    { custom_events }

                    { column_name }
                    ty={ maybe_ty.unwrap() }
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
            icon={"column_settings_icon"}
        >
            <TabList<ColumnSettingsTab> {tabs} {match_fn} />
        </Sidebar>

    }
}
