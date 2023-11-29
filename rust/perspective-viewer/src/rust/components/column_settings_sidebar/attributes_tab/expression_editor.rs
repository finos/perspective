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

use wasm_bindgen::JsValue;
use yew::{function_component, html, Callback, Html, Properties};

use crate::components::expression_editor::ExpressionEditor;
use crate::components::viewer::ColumnLocator;
use crate::config::{Expression, ViewConfigUpdate};
use crate::derive_model;
use crate::model::UpdateAndRender;
use crate::renderer::Renderer;
use crate::session::Session;
use crate::utils::ApiFuture;

#[derive(Properties, PartialEq, Clone)]
pub struct ExprEditorAttrProps {
    pub header_value: Option<String>,
    pub selected_column: ColumnLocator,
    pub on_close: Callback<()>,
    pub session: Session,
    pub renderer: Renderer,
    pub on_input: Callback<Rc<String>>,
}
derive_model!(Renderer, Session for ExprEditorAttrProps);

#[function_component(ExprEditorAttr)]
pub fn expression_editor_attr(p: &ExprEditorAttrProps) -> Html {
    let is_validating = yew::use_state_eq(|| false);
    let on_save = yew::use_callback(p.clone(), |v, p| match p.selected_column.clone() {
        ColumnLocator::Expr(Some(old_name)) => update_expr(old_name, &v, p),
        ColumnLocator::Expr(None) => save_expr(v, p),
        _ => panic!("Tried to save a non-expression column as expression!"),
    });

    let on_validate = yew::use_callback(is_validating.setter(), |b, validating| {
        validating.set(b);
    });

    let on_delete = yew::use_callback(p.clone(), |(), p| {
        match p.selected_column {
            ColumnLocator::Expr(Some(ref s)) => delete_expr(s, p),
            _ => panic!("Tried to delete an invalid column!"),
        }

        p.on_close.emit(());
    });

    html! {
        <div id ="attributes-expr">
            <ExpressionEditor
                { on_save }
                { on_validate }
                { on_delete }
                on_input={ p.on_input.clone() }
                session = { &p.session }
                alias = { p.selected_column.name().cloned() }
                disabled = {!matches!(p.selected_column, ColumnLocator::Expr(_))}
            />
        </div>
    }
}

fn update_expr(alias: String, new_expr_val: &JsValue, props: &ExprEditorAttrProps) {
    let session = props.session.clone();
    let props = props.clone();
    let new_expr_val = new_expr_val.as_string().unwrap();
    let new_expr = Expression::new(Some(alias.clone().into()), new_expr_val.into());

    ApiFuture::spawn(async move {
        let update = session
            .create_replace_expression_update(&alias, &new_expr)
            .await;
        props.update_and_render(update).await?;
        Ok(())
    });
}

fn save_expr(expression: JsValue, props: &ExprEditorAttrProps) {
    let task = {
        let expression_val = expression.as_string().unwrap();
        let expr = Expression::new(
            props.header_value.clone().map(|n| n.into()),
            expression_val.into(),
        );

        let mut serde_exprs = props.session.get_view_config().expressions.clone();
        serde_exprs.insert(&expr);
        props.update_and_render(ViewConfigUpdate {
            expressions: Some(serde_exprs),
            ..Default::default()
        })
    };

    ApiFuture::spawn(task);
}

fn delete_expr(expr_name: &str, props: &ExprEditorAttrProps) {
    let session = &props.session;
    let mut serde_exprs = session.get_view_config().expressions.clone();
    serde_exprs.remove(expr_name);
    let config = ViewConfigUpdate {
        expressions: Some(serde_exprs),
        ..ViewConfigUpdate::default()
    };

    let task = props.update_and_render(config);
    ApiFuture::spawn(task);
}
