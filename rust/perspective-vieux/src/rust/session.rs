////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod copy;
mod download;
mod view_subscription;

use crate::session::view_subscription::*;
use crate::utils::perspective::*;
use js_sys::Array;
pub use view_subscription::TableStats;

use copy::*;
use download::*;
use std::cell::RefCell;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use yew::prelude::*;

/// The `Session` struct is the principal interface to the Perspective engine,
/// the `Table` and `View` obejcts for this vieux, and all associated state.
pub struct SessionData {
    table: Option<PerspectiveJsTable>,
    view_sub: Option<ViewSubscription>,
    on_stats: Option<Callback<TableStats>>,
}

#[derive(Clone)]
pub struct Session(Rc<RefCell<SessionData>>);

impl Deref for Session {
    type Target = Rc<RefCell<SessionData>>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl Session {
    pub fn new() -> Session {
        Session(Rc::new(RefCell::new(SessionData {
            table: None,
            view_sub: None,
            on_stats: None,
        })))
    }

    /// Set a callback for `TableStats` updates when this perspective table updates.
    pub fn set_on_stats_callback(&self, on_stats: Callback<TableStats>) {
        self.borrow_mut().on_stats = Some(on_stats);
    }

    /// Reset this `Session`'s state with a new `Table`.  Implicitly calls
    /// `clear_view()`, which will need to be re-initialized later via `set_view()`.
    pub async fn set_table(
        self,
        table: PerspectiveJsTable,
    ) -> Result<JsValue, JsValue> {
        self.clear_view();
        self.borrow_mut().table = Some(table);
        self.update_table_stats().await?;
        Ok(JsValue::UNDEFINED)
    }

    /// The `table`'s unique column names.  This value is not 
    pub async fn get_column_names(self) -> Result<Vec<String>, JsValue> {
        match self.borrow().table.as_ref() {
            None => Ok(vec![]),
            Some(table) => {
                let columns = table.columns().await?;
                if columns.length() > 0 {
                    Ok((0..columns.length())
                        .map(|i| columns.get(i).as_string().unwrap())
                        .collect::<Vec<String>>())
                } else {
                    Ok(vec![])
                }
            }
        }
    }

    pub async fn validate_expr(self, expr: JsValue) -> Result<Option<PerspectiveValidationError>, JsValue> {
        let arr = Array::new();
        arr.push(&expr);
        let result = self
            .borrow()
            .table
            .as_ref()
            .unwrap()
            .validate_expressions(arr)
            .await?;

        let errors = result.errors();
        let error_keys = js_sys::Object::keys(&errors);
        if error_keys.length() > 0 {
            let js_err = js_sys::Reflect::get(&errors, &error_keys.get(0))?;
            let error: PerspectiveValidationError = js_err.into_serde().unwrap();
            Ok(Some(error))
        } else {
            Ok(None)
        }
    }

    pub fn copy_to_clipboard(&self, flat: bool) {
        let _ = if flat {
            copy_flat(&self.borrow().table.clone().unwrap())
        } else {
            copy(self.borrow().view_sub.as_ref().unwrap().view())
        };
    }

    pub fn download_as_csv(&self, flat: bool) {
        let _ = if flat {
            download_flat(&self.borrow().table.clone().unwrap())
        } else {
            download(self.borrow().view_sub.as_ref().unwrap().view())
        };
    }

    pub fn clear_view(&self) {
        self.borrow_mut().view_sub = None;
    }

    /// Set a new `View` (derived from this `Session`'s `Table`), and create the
    /// `update()` subscription.
    pub fn set_view(&mut self, view: PerspectiveJsView) {
        let table = self.borrow().table.clone().unwrap();
        let on_stats = self.borrow().on_stats.clone();
        let sub = ViewSubscription::new(table, view, on_stats.clone().unwrap());
        self.borrow_mut().view_sub = Some(sub);
    }

    /// Update the this `Session`'s `TableStats` data from the `Table`.
    async fn update_table_stats(self) -> Result<JsValue, JsValue> {
        let table = self.borrow().table.clone();
        let num_rows = table.unwrap().size().await? as u32;
        self.borrow().on_stats.as_ref().unwrap().emit(TableStats {
            is_pivot: false,
            num_rows: Some(num_rows),
            virtual_rows: None,
        });
        Ok(JsValue::UNDEFINED)
    }
}
