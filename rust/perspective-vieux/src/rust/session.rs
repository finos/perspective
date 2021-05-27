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
use wasm_bindgen::{prelude::*, JsCast};
use wasm_bindgen_futures::JsFuture;
use yew::prelude::*;

/// The `Session` struct is the principal interface to the Perspective engine,
/// the `Table` and `View` obejcts for this vieux, and all associated state.
pub struct SessionData {
    table: Option<PerspectiveJsTable>,
    view_sub: Option<ViewSubscription>,
    callback: Option<Callback<TableStats>>,
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
            callback: None,
        })))
    }

    /// Set a callback for `TableStats` updates when this perspective table updates.
    pub fn set_table_stats_callback(&self, callback: Callback<TableStats>) {
        self.borrow_mut().callback = Some(callback);
    }

    /// Reset this `Session`'s state with a new `Table`.
    pub async fn set_table(self, table: js_sys::Promise) -> Result<JsValue, JsValue> {
        let promise = JsFuture::from(table).await?;
        let table: PerspectiveJsTable = promise.unchecked_into();
        self.borrow_mut().table = Some(table);
        self.update_table_stats().await?;
        Ok(JsValue::UNDEFINED)
    }

    pub async fn validate_expr(self, expr: JsValue) -> Result<PerspectiveValidatedExpressions, JsValue> {
        let arr = Array::new();
        arr.push(&expr);
        self.borrow().table.as_ref().unwrap().validate_expressions(arr).await
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

    pub fn clear_view(&mut self) {
        self.borrow_mut().view_sub = None;
    }

    /// Set a new `View` (derived from this `Session`'s `Table`), and create the
    /// `update()` subscription.
    pub fn set_view(&mut self, view: PerspectiveJsView) {
        let table = self.borrow().table.clone().unwrap();
        let callback = self.borrow().callback.clone();
        let sub = ViewSubscription::new(table, view, callback.clone().unwrap());
        self.borrow_mut().view_sub = Some(sub);
    }

    /// Update the this `Session`'s `TableStats` data from the `Table`.
    async fn update_table_stats(self) -> Result<JsValue, JsValue> {
        let table = self.borrow().table.clone();
        let num_rows = table.unwrap().size().await? as u32;
        self.borrow().callback.as_ref().unwrap().emit(TableStats {
            is_pivot: false,
            num_rows: Some(num_rows),
            virtual_rows: None,
        });
        Ok(JsValue::UNDEFINED)
    }
}
