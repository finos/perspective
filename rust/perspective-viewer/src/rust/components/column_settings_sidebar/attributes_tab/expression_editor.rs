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
use crate::components::viewer::ColumnLocator;
use crate::config::ViewConfigUpdate;
use crate::derive_model;
use crate::model::UpdateAndRender;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::ApiFuture;

#[derive(Properties, PartialEq, Clone)]
pub struct ExprEditorAttrProps {
    pub selected_column: ColumnLocator,
    pub on_close: Callback<()>,
    pub session: Session,
    pub renderer: Renderer,
}
derive_model!(Renderer, Session for ExprEditorAttrProps);

#[function_component(ExprEditorAttr)]
pub fn expression_editor_attr(p: &ExprEditorAttrProps) -> Html {
    let is_validating = yew::use_state_eq(|| false);
    let on_save = yew::use_callback(
        |v, p| {
            match &p.selected_column {
                ColumnLocator::Expr(Some(alias)) => update_expr(alias, &v, p),
                ColumnLocator::Expr(None) => save_expr(v, p),
                // TODO: We should be able to create a new expression from the currently selected
                // column if it is not already an expression column.
                _ => panic!("Tried to save a non-expression column as expression!"),
            }
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
            match p.selected_column {
                ColumnLocator::Expr(Some(ref s)) => delete_expr(s, p),
                _ => panic!("Tried to delete an invalid column!"),
            }
            p.on_close.emit(());
        },
        p.clone(),
    );

    html! {
        <div id ="attributes-expr">
            <div class="item_title">{"Expression Editor"}</div>
            <ExpressionEditor
                { on_save }
                { on_validate }
                { on_delete }
                session = { &p.session }
                alias = { p.selected_column.name().cloned() }
                disabled = {!matches!(p.selected_column, ColumnLocator::Expr(_))}
            />
        </div>
    }
}

fn update_expr(name: &str, new_expression: &JsValue, props: &ExprEditorAttrProps) {
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

fn save_expr(expression: JsValue, props: &ExprEditorAttrProps) {
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

fn delete_expr(expr_name: &str, props: &ExprEditorAttrProps) {
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
