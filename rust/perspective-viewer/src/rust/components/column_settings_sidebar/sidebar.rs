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

mod tablist;
use std::fmt::Display;
use std::rc::Rc;

use derivative::Derivative;
pub use tablist::*;
use yew::{function_component, html, Callback, Html, Properties};

use super::attributes_tab::AttributesTabProps;
use super::style_tab::StyleTabProps;
use crate::components::column_settings_sidebar::save_settings::SaveSettingsProps;
use crate::components::containers::sidebar::Sidebar;
use crate::components::editable_header::EditableHeader;
use crate::components::expression_editor::ExpressionEditorProps;
use crate::components::style::LocalStyle;
use crate::components::type_icon::{TypeIcon, TypeIconType};
use crate::components::viewer::ColumnLocator;
use crate::config::{Expression, Type};
use crate::custom_events::CustomEvents;
use crate::model::*;
use crate::presentation::Presentation;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::{css, derive_model, html_template};

impl Display for ColumnSettingsTab {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!("{self:?}"))
    }
}

#[derive(Clone, Properties, Derivative)]
#[derivative(Debug)]
pub struct ColumnSettingsProps {
    pub selected_column: ColumnLocator,
    pub on_close: Callback<()>,
    #[derivative(Debug = "ignore")]
    pub session: Session,
    #[derivative(Debug = "ignore")]
    pub renderer: Renderer,
    #[derivative(Debug = "ignore")]
    pub presentation: Presentation,
    #[derivative(Debug = "ignore")]
    pub custom_events: CustomEvents,
    pub width_override: Option<i32>,
    pub is_active: bool,
}

derive_model!(CustomEvents, Session, Renderer, Presentation for ColumnSettingsProps);

impl PartialEq for ColumnSettingsProps {
    fn eq(&self, other: &Self) -> bool {
        self.selected_column == other.selected_column && self.is_active == other.is_active
    }
}

#[function_component]
pub fn ColumnSettingsSidebar(p: &ColumnSettingsProps) -> Html {
    // --- setup ---
    let column_name = p.selected_column.name_or_default(&p.session);
    let initial_expr_value = p
        .session
        .metadata()
        .get_expression_by_alias(&column_name)
        .unwrap_or_default();
    let initial_header_value = (initial_expr_value != column_name).then_some(column_name.clone());
    let maybe_ty = p.session.metadata().get_column_view_type(&column_name);

    let (config, attrs) = (p.get_plugin_config(), p.get_plugin_attrs());
    if config.is_none() || attrs.is_none() {
        tracing::warn!(
            "Could not get full plugin config!\nconfig (plugin.save()): {:?}\nplugin_attrs: {:?}",
            config,
            attrs
        );
    }

    let plugin = p.renderer.get_active_plugin().unwrap().name();
    let tabs = yew::use_memo(
        (maybe_ty, p.selected_column.clone(), plugin),
        |(maybe_ty, selected_column, plugin)| {
            let mut tabs = vec![];
            // TODO: This is a hack and needs to be replaced.
            let show_styles = maybe_ty
                .map(|ty| match &**plugin {
                    "Datagrid" => ty != Type::Bool,
                    "X/Y Scatter" => ty == Type::String,
                    _ => false,
                })
                .unwrap_or_default();

            if !matches!(selected_column, ColumnLocator::Expr(None))
                && show_styles
                && config.is_some()
            {
                tabs.push(ColumnSettingsTab::Style);
            }

            if matches!(selected_column, ColumnLocator::Expr(_)) {
                tabs.push(ColumnSettingsTab::Attributes);
            }
            tabs
        },
    );

    // --- state ---
    let expr_value = yew::use_state(|| Rc::new(initial_expr_value.clone()));
    let expr_valid = yew::use_state(|| true);
    let header_value = yew::use_state_eq(|| initial_header_value.clone());
    let header_valid = yew::use_state_eq(|| true);
    let selected_tab = yew::use_state_eq(|| (0, *tabs.first().unwrap()));
    let save_enabled = yew::use_state_eq(|| false);
    let save_count = yew::use_state_eq(|| 0);
    let reset_enabled = yew::use_state_eq(|| false);
    let reset_count = yew::use_state_eq(|| 0);

    // --- callbacks, effects ---
    let set_expr_value = yew::use_callback(
        expr_value.setter(),
        |new_value: String, expr_value_setter| {
            expr_value_setter.set(Rc::new(new_value));
        },
    );

    // reset values on column change
    yew::use_effect_with(
        (initial_header_value.clone(), header_value.setter()),
        |(initial_header_value, header_value_setter)| {
            header_value_setter.set(initial_header_value.clone());
        },
    );
    yew::use_effect_with(
        (initial_expr_value.clone(), set_expr_value.clone()),
        |(initial_expr_value, set_expr_value)| {
            set_expr_value.emit(initial_expr_value.clone());
        },
    );

    // update reset and save on state changes
    yew::use_effect_with(
        (
            expr_value.clone(),
            initial_expr_value.clone(),
            header_value.clone(),
            initial_header_value.clone(),
            reset_enabled.setter(),
        ),
        |(expr_value, initial_expr_value, header_value, initial_header_value, reset_enabled)| {
            let expr_value = &***expr_value;
            let header_value = &**header_value;
            let expr_changed = initial_expr_value != expr_value;
            let header_changed = header_value != initial_header_value;
            reset_enabled.set(expr_changed || header_changed);
        },
    );

    yew::use_effect_with(
        (
            expr_value.clone(),
            initial_expr_value.clone(),
            header_value.clone(),
            initial_header_value.clone(),
            save_enabled.setter(),
            header_valid.clone(),
            expr_valid.clone(),
        ),
        |(
            expr_value,
            initial_expr_value,
            header_value,
            initial_header_value,
            save_enabled,
            header_valid,
            expr_valid,
        )| {
            let changed =
                &***expr_value != initial_expr_value || &**header_value != initial_header_value;
            let valid = **header_valid && **expr_valid;
            save_enabled.set(changed && valid);
        },
    );

    let on_change_header_value = yew::use_callback(
        (header_value.clone(), header_valid.clone()),
        |(value, valid), (header_value, header_valid)| {
            header_value.set(value);
            header_valid.set(valid);
        },
    );

    let on_reset = yew::use_callback(
        (
            header_value.clone(),
            initial_header_value.clone(),
            set_expr_value.clone(),
            initial_expr_value.clone(),
            save_enabled.setter(),
            reset_enabled.setter(),
            reset_count.clone(),
        ),
        |(),
         (
            header_value,
            initial_header_value,
            set_expr_value,
            initial_expr_value,
            save_enabled,
            reset_enabled,
            reset_count,
        )| {
            header_value.set(initial_header_value.clone());
            set_expr_value.emit(initial_expr_value.clone());
            save_enabled.set(false);
            reset_enabled.set(false);
            reset_count.set(**reset_count + 1);
        },
    );

    let on_tab_change = yew::use_callback(selected_tab.clone(), move |(i, tab), selected_tab| {
        selected_tab.set((i, tab));
    });

    let on_save = yew::use_callback(
        (
            p.get_expression_updater(),
            p.selected_column.clone(),
            header_value.clone(),
            expr_value.clone(),
            save_enabled.setter(),
            reset_enabled.setter(),
            save_count.clone(),
        ),
        |(),
         (
            expr_updater,
            selected_column,
            header_value,
            expr_value,
            save_enabled,
            reset_enabled,
            save_count,
        )| {
            save_enabled.set(false);
            reset_enabled.set(false);
            let expr_value = (***expr_value).clone();
            let expr_name = (**header_value).clone().map(|s| s.into());
            let new_expr = Expression::new(expr_name, expr_value.into());
            match selected_column {
                ColumnLocator::Plain(_) => {
                    tracing::error!("Tried to save non-expression column!")
                },
                ColumnLocator::Expr(name) => match name {
                    Some(old_name) => expr_updater.update_expr(old_name.clone(), new_expr),
                    None => expr_updater.save_expr(new_expr),
                },
            }
            save_count.set(**save_count + 1);
        },
    );

    let on_delete = yew::use_callback(
        (
            p.get_expression_updater(),
            column_name.clone(),
            p.on_close.clone(),
        ),
        |_event, (expr_updater, column_name, on_close)| {
            expr_updater.delete_expr(column_name);
            on_close.emit(());
        },
    );

    // --- header ---
    let is_expr = matches!(p.selected_column, ColumnLocator::Expr(_));
    let editable = is_expr && matches!(selected_tab.1, ColumnSettingsTab::Attributes);
    let header_icon = html! {
        <TypeIcon ty={maybe_ty.map(|ty| ty.into()).unwrap_or(TypeIconType::Expr)} />
    };
    let header_contents = html! {
        <EditableHeader
            icon={Some(header_icon)}
            on_change={on_change_header_value.clone()}
            {editable}
            initial_value={initial_header_value.clone()}
            placeholder={(*expr_value).clone()}
            session={p.session.clone()}
            reset_count={*reset_count}
        />
    };

    // --- render ---
    let expr_editor = ExpressionEditorProps {
        session: p.session.clone(),
        on_input: yew::use_callback(expr_value.setter(), |val, setter| setter.set(val)),
        on_save: on_save.clone(),
        on_validate: yew::use_callback(expr_valid.setter(), |val, setter| setter.set(val)),
        alias: p.selected_column.name().cloned(),
        disabled: !matches!(p.selected_column, ColumnLocator::Expr(_)),
        reset_count: *reset_count,
    };

    let save_section = SaveSettingsProps {
        save_enabled: (*save_enabled),
        reset_enabled: (*reset_enabled),
        on_reset,
        on_save,
        on_delete,
        show_danger_zone: matches!(p.selected_column, ColumnLocator::Expr(Some(_))),
        disable_delete: p.is_active,
    };

    let attrs_tab = AttributesTabProps {
        expr_editor,
        save_section,
    };

    let style_tab = StyleTabProps {
        custom_events: p.custom_events.clone(),
        session: p.session.clone(),
        renderer: p.renderer.clone(),
        ty: maybe_ty,
        column_name,
    };

    html_template! {
        <LocalStyle href={ css!("column-settings-panel") }/>
        <Sidebar
            on_close={p.on_close.clone()}
            id_prefix="column_settings"
            width_override={p.width_override}
            selected_tab={selected_tab.0}
            {header_contents}
        >
            <ColumnSettingsTablist
                renderer={p.renderer.clone()}
                presentation={p.presentation.clone()}
                session={p.session.clone()}
                custom_events={p.custom_events.clone()}

                on_tab_change={on_tab_change.clone()}
                selected_tab={*selected_tab}
                {tabs}

                {attrs_tab}
                {style_tab}
            />
        </Sidebar>

                { for children.into_iter() }

            </TabList<ColumnSettingsTab>>
        </Sidebar>
    }
}
