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

use wasm_bindgen::JsValue;
use yew::{function_component, html, Callback, Html, Properties};

use crate::components::expression_editor::ExpressionEditor;
use crate::components::viewer::SidebarCloseButton;
use crate::config::ViewConfigUpdate;
use crate::derive_model;
use crate::model::UpdateAndRender;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::ApiFuture;

/// The state of the Expression Editor side panel
#[derive(Debug, Clone, PartialEq)]
pub enum EditorState {
    /// The expression editor is closed.
    Closed,

    /// The editor is opened, and will create a new column when saved.
    NewExpr,

    /// The editor is opened, and updating an existing expression.
    ///
    /// # Arguments
    ///
    /// * The alias that is being edited.
    UpdateExpr(String),
}

#[derive(PartialEq, Clone, Properties)]
pub struct ExprEditorPanelProps {
    pub session: Session,
    pub renderer: Renderer,

    /// How to render the editor, with an already existing expression,
    /// or a new expression.
    pub editor_state: EditorState,

    /// When this callback is called, the expression editor will close.
    pub on_close: Callback<()>,
}

derive_model!(Renderer, Session for ExprEditorPanelProps);

#[function_component]
pub fn ExprEditorPanel(p: &ExprEditorPanelProps) -> Html {
    let is_validating = yew::use_state_eq(|| false);
    let on_save = yew::use_callback(
        |v, p| {
            match &p.editor_state {
                EditorState::Closed => {}
                EditorState::NewExpr => save_expr(v, p),
                EditorState::UpdateExpr(alias) => update_expr(alias, &v, p),
            }

            p.on_close.emit(());
        },
        p.clone(),
    );

    let on_validate = yew::use_callback(
        |b, validating| {
            validating.set(b);
        },
        is_validating.setter(),
    );

    let on_delete = yew::use_callback(
        |(), p| {
            if let EditorState::UpdateExpr(ref s) = p.editor_state {
                delete_expr(s, p);
            }

            p.on_close.emit(());
        },
        p.clone(),
    );

    let alias = yew::use_memo(
        |s| match s {
            EditorState::NewExpr | EditorState::Closed => None,
            EditorState::UpdateExpr(s) => Some(s.clone()),
        },
        p.editor_state.clone(),
    );

    html! {
        <div
            class="sidebar_column expr_editor_column"
            validating={ if *is_validating { Some("") } else { None } }>
            <SidebarCloseButton id={ "expr_editor_close_button" } on_close_sidebar={ &p.on_close }></SidebarCloseButton>
            <div id="expr_panel_header">
                <span id="expr_panel_header_title">{ "Edit Expression" }</span>
            </div>
            <div id="expr_panel_border"></div>
            <ExpressionEditor
                { on_save }
                { on_validate }
                { on_delete }
                session = { &p.session }
                alias = { (*alias).clone() }>
            </ExpressionEditor>
        </div>
    }
}

fn update_expr(name: &str, new_expression: &JsValue, props: &ExprEditorPanelProps) {
    let n = name.to_string();
    let exp = new_expression.clone();
    let sesh = props.session.clone();
    let props = props.clone();
    ApiFuture::spawn(async move {
        let update = sesh.create_replace_expression_update(&n, &exp).await;
        props.update_and_render(update).await?;
        Ok(())
    });
}

fn save_expr(expression: JsValue, props: &ExprEditorPanelProps) {
    let task = {
        let expression = expression.as_string().unwrap();
        let mut expressions = props.session.get_view_config().expressions.clone();
        expressions.retain(|x| x != &expression);
        expressions.push(expression);
        props.update_and_render(ViewConfigUpdate {
            expressions: Some(expressions),
            ..Default::default()
        })
    };

    ApiFuture::spawn(task);
}

fn delete_expr(expr_name: &str, props: &ExprEditorPanelProps) {
    let session = &props.session;
    let expression = session
        .metadata()
        .get_expression_by_alias(expr_name)
        .unwrap();

    let mut expressions = session.get_view_config().expressions.clone();
    expressions.retain(|x| x != &expression);
    let config = ViewConfigUpdate {
        expressions: Some(expressions),
        ..ViewConfigUpdate::default()
    };

    let task = props.update_and_render(config);
    ApiFuture::spawn(task);
}
