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

    let maybe_ty = p.session.metadata().get_column_view_type(&column_name);

    let header_contents = html! {
        <ColumnSettingsHeader
            {maybe_ty}
            column_name={column_name.clone()}
            selected_column={p.selected_column.clone()}
            session={p.session.clone()}
            renderer={p.renderer.clone()}
            presentation={p.presentation.clone()}
        />
    };

    let selected_tab = yew::use_state(|| None);
    let on_tab_change = yew::use_callback(selected_tab.clone(), move |i, selected_tab| {
        selected_tab.set(Some(i));
    });

    html_template! {
        <LocalStyle href={ css!("column-settings-panel") } />
        <Sidebar
            title={ column_name }
            on_close={ p.on_close.clone() }
            id_prefix="column_settings"
            icon={"column_settings_icon"}
            width_override={p.width_override}
            selected_tab={*selected_tab}
        >
            <ColumnSettingsTablist
                renderer={p.renderer.clone()}
                presentation={p.presentation.clone()}
                session={p.session.clone()}
                custom_events={p.custom_events.clone()}

                on_close={p.on_close.clone()}
                selected_column={p.selected_column.clone()}

                on_tab_change={on_tab_change.clone()}
                selected_tab={*selected_tab}
                {maybe_ty}
                column_name={column_name.clone()}
            />

        </Sidebar>

    }
}

#[derive(PartialEq, Clone, Properties)]
pub struct ColumnSettingsTablistProps {
    renderer: Renderer,
    presentation: Presentation,
    session: Session,
    custom_events: CustomEvents,

    on_close: Callback<()>,
    selected_column: ColumnLocator,

    on_tab_change: Callback<usize>,
    selected_tab: Option<usize>,
    maybe_ty: Option<Type>,
    column_name: String,
}
derive_model!(Renderer, Presentation, Session, CustomEvents for ColumnSettingsTablistProps);

#[function_component(ColumnSettingsTablist)]
pub fn column_settings_tablist(p: &ColumnSettingsTablistProps) -> Html {
    let mut tabs = vec![];

    let (config, attrs) = (p.get_plugin_config(), p.get_plugin_attrs());
    if config.is_none() || attrs.is_none() {
        tracing::warn!(
            "Could not get full plugin config!\nconfig (plugin.save()): {:?}\nplugin_attrs: {:?}",
            config,
            attrs
        );
    }

    // TODO: This is a hack and needs to be replaced.
    let plugin = p.renderer.get_active_plugin().unwrap();
    let show_styles = p
        .maybe_ty
        .map(|ty| match &*plugin.name() {
            "Datagrid" => ty != Type::Bool,
            "X/Y Scatter" => ty == Type::String,
            _ => false,
        })
        .unwrap_or_default();

    if !matches!(p.selected_column, ColumnLocator::Expr(None))
        && show_styles
        && config.is_some()
        && p.maybe_ty.is_some()
    {
        tabs.push(ColumnSettingsTab::Style);
    }

    tabs.push(ColumnSettingsTab::Attributes);

    let match_fn = yew::use_callback(p.clone(), move |tab, p| match tab {
        ColumnSettingsTab::Attributes => {
            html! {
                <AttributesTab
                    session={ p.session.clone() }
                    renderer={ p.renderer.clone() }
                    custom_events={ p.custom_events.clone() }
                    presentation={ p.presentation.clone() }

                    selected_column={ p.selected_column.clone() }
                    on_close={ p.on_close.clone() }
                />
            }
        },
        ColumnSettingsTab::Style => html! {
            <StyleTab
                session={ p.session.clone() }
                renderer={ p.renderer.clone() }
                custom_events={ p.custom_events.clone() }

                column_name={ p.column_name.clone() }
                ty={ p.maybe_ty.unwrap() }
            />
        },
    });

    html! {
        <TabList<ColumnSettingsTab>
            {tabs}
            {match_fn}
            on_tab_change={p.on_tab_change.clone()}
            selected_tab={p.selected_tab}
        />
    }
}

// TODO: Rebase this on master.
// Ensure that the new expressions actually save their new names.
// Finish up the things in this comment:
// https://github.com/finos/perspective/pull/2399#issuecomment-1806672752

#[derive(PartialEq, Properties, Clone)]
pub struct ColumnSettingsHeaderProps {
    maybe_ty: Option<Type>,
    column_name: String,
    selected_column: ColumnLocator,
    session: Session,
    renderer: Renderer,
    presentation: Presentation,
}
derive_model!(Session, Renderer, Presentation for ColumnSettingsHeaderProps);

#[function_component(ColumnSettingsHeader)]
pub fn column_settings_header(p: &ColumnSettingsHeaderProps) -> Html {
    let new_expr_name = yew::use_state(|| p.column_name.clone());
    let header_value_update = yew::use_callback(
        (new_expr_name.clone(), p.clone()),
        move |new_name: String, (new_expr_name, p)| {
            if matches!(p.selected_column, ColumnLocator::Expr(None)) {
                new_expr_name.set(new_name);
                return;
            }
            // rename expr
            clone!(p);
            ApiFuture::spawn(async move {
                let update = p
                    .session
                    .create_rename_expression_update(p.column_name.clone(), new_name.clone())
                    .await;
                p.presentation.set_open_column_settings(Some(new_name));
                p.update_and_render(update).await?;
                Ok(())
            })
        },
    );
    let column_name = match p.selected_column {
        ColumnLocator::Expr(None) => (*new_expr_name).clone(),
        _ => p.column_name.clone(),
    };
    let is_expr = matches!(p.selected_column, ColumnLocator::Expr(_));
    let header_ty = p.maybe_ty.map(|t| t.into()).unwrap_or(TypeIconType::Expr);
    let header_icon = html! {<TypeIcon ty={header_ty} />};
    html! {
        <EditableHeader
            icon={Some(header_icon)}
            on_value_update={header_value_update}
            editable={is_expr}
            value={column_name.clone()}
        />
    }
}
