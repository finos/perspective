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

use itertools::Itertools;

use super::{HasPresentation, HasRenderer, HasSession, UpdateAndRender};
use crate::config::{Expression, ViewConfigUpdate};
use crate::utils::ApiFuture;

pub trait CreateColumn: HasSession + HasPresentation + HasRenderer + UpdateAndRender {
    fn clone_column(&self, name: &str, in_place: bool, open_settings: bool) -> ApiFuture<()> {
        // 1. Create a new expression.
        let expr_name = self.session().metadata().make_new_column_name(Some(name));
        let expr = Expression::new(Some(&expr_name), &format!("\"{name}\""));
        let view_config = self.session().get_view_config();
        let mut serde_exprs = view_config.expressions.clone();
        serde_exprs.retain(|name, _expr| name != &expr_name);
        serde_exprs.insert(&expr);

        // 2. Replace this column in the view configuration.
        let mut cols = view_config.columns.clone();
        if in_place {
            let (idx, _val) = cols
                .iter()
                .find_position(|c| c.as_ref().map(|s| s == name).unwrap_or_default())
                .unwrap_or_else(|| {
                    web_sys::console::error_1(
                        &format!("Couldn't find {name} in view config!").into(),
                    );
                    panic!();
                });
            cols[idx] = Some(expr_name.clone());
        }

        // 3. Ensure that the new column is opened
        if open_settings {
            self.presentation()
                .set_open_column_settings(Some(expr_name));
        }

        // 4. Update
        drop(view_config);
        self.update_and_render(ViewConfigUpdate {
            expressions: Some(serde_exprs),
            columns: Some(cols),
            ..Default::default()
        })
    }
}
impl<T: HasPresentation + HasSession + HasRenderer> CreateColumn for T {}
