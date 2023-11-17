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

use yew::{function_component, html, use_callback, use_state, Callback, Html, Properties};

use crate::components::column_settings_sidebar::attributes_tab::AttributesTab;
use crate::components::column_settings_sidebar::style_tab::StyleTab;
use crate::components::containers::sidebar::Sidebar;
use crate::components::containers::tablist::{Tab, TabList};
use crate::components::expression_editor::get_new_column_name;
use crate::components::style::LocalStyle;
use crate::components::viewer::ColumnLocator;
use crate::config::Type;
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
    pub width_override: Option<i32>,
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

    let (config, attrs) = (p.get_plugin_config(), p.get_plugin_attrs());
    if config.is_none() || attrs.is_none() {
        tracing::warn!(
            "Could not get full plugin config!\nconfig (plugin.save()): {:?}\nplugin_attrs: {:?}",
            config,
            attrs
        );
    }
    let maybe_ty = p.session.metadata().get_column_view_type(&column_name);

    let mut tabs = vec![];

    // TODO: This is a hack and needs to be replaced.
    let plugin = p.renderer.get_active_plugin().unwrap();
    let show_styles = maybe_ty
        .map(|ty| match &*plugin.name() {
            "Datagrid" => ty != Type::Bool,
            "X/Y Scatter" => ty == Type::String,
            _ => false,
        })
        .unwrap_or_default();

    if !matches!(p.selected_column, ColumnLocator::Expr(None))
        && show_styles
        && is_active
        && config.is_some()
        && maybe_ty.is_some()
    {
        tabs.push(ColumnSettingsTab::Style);
    }
    if matches!(p.selected_column, ColumnLocator::Expr(_)) {
        tabs.push(ColumnSettingsTab::Attributes);
    }

    let match_fn = {
        clone!(
            p.selected_column,
            p.on_close,
            p.session,
            p.renderer,
            p.custom_events,
            column_name
        );
        Callback::from(move |tab| {
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
        })
    };

    let selected_tab = use_state(|| None);

    let on_tab_change = {
        clone!(selected_tab);
        use_callback((), move |idx, _| {
            selected_tab.set(Some(idx));
        })
    };

    html_template! {
        <LocalStyle href={css!("column-settings-panel")} />
        <Sidebar
            title={column_name}
            on_close={p.on_close.clone()}
            id_prefix="column_settings"
            icon={"column_settings_icon"}
            width_override={p.width_override}
            selected_tab={*selected_tab}
        >
            <TabList<ColumnSettingsTab>
                {tabs}
                {match_fn}
                {on_tab_change}
                selected_tab={*selected_tab}
            />
        </Sidebar>

    }
}
