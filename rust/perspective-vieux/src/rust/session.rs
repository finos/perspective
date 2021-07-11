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

use crate::config::*;
use crate::js::perspective::*;
use crate::session::view_subscription::*;
use crate::utils::*;

pub use view_subscription::TableStats;

use copy::*;
use download::*;
use std::cell::RefCell;
use std::iter::FromIterator;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

/// The `Session` struct is the principal interface to the Perspective engine,
/// the `Table` and `View` obejcts for this vieux, and all associated state.
#[derive(Default)]
pub struct SessionData {
    table: Option<JsPerspectiveTable>,
    view: Option<JsPerspectiveView>,
    view_sub: Option<ViewSubscription>,
    stats: Option<TableStats>,
    on_stats: Option<Callback<()>>,
    on_update: Vec<Box<dyn Fn()>>,
}

#[derive(Clone, Default)]
pub struct Session(Rc<RefCell<SessionData>>);

impl Deref for Session {
    type Target = Rc<RefCell<SessionData>>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl Session {
    /// Set a callback for `TableStats` updates when this perspective table updates.
    pub fn set_on_stats_callback(&self, on_stats: Callback<()>) {
        if self.borrow().stats.as_ref().is_some() {
            on_stats.emit(());
        }

        self.borrow_mut().on_stats = Some(on_stats);
    }

    /// Set a callback for `TableStats` updates when this perspective table updates.
    pub fn add_on_update_callback(&self, on_update: impl Fn() + 'static) {
        self.borrow_mut().on_update.push(Box::new(on_update));
    }

    /// Reset this `Session`'s state with a new `Table`.  Implicitly calls
    /// `clear_view()`, which will need to be re-initialized later via `set_view()`.
    pub async fn set_table(
        self,
        table: JsPerspectiveTable,
    ) -> Result<JsValue, JsValue> {
        self.clear_view();
        self.borrow_mut().table = Some(table);
        self.set_initial_stats().await?;
        Ok(JsValue::UNDEFINED)
    }

    /// The `table`'s unique column names.  This value is not
    pub async fn get_column_names(self) -> Result<Vec<String>, JsValue> {
        let table_opt = self.borrow().table.clone();
        match table_opt {
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

    /// Validate an expression string (as a JsValue since it comes from `monaco`),
    /// and marshall the results.
    pub async fn validate_expr(
        self,
        expr: JsValue,
    ) -> Result<Option<PerspectiveValidationError>, JsValue> {
        let arr = js_sys::Array::from_iter([expr].iter());
        let table = self.borrow().table.as_ref().unwrap().clone();
        let errors = table.validate_expressions(arr).await?.errors();
        let error_keys = js_sys::Object::keys(&errors);
        if error_keys.length() > 0 {
            let js_err = js_sys::Reflect::get(&errors, &error_keys.get(0))?;
            Ok(Some(js_err.into_serde().unwrap()))
        } else {
            Ok(None)
        }
    }

    pub fn copy_to_clipboard(&self, flat: bool) {
        self.flat_dispatch(flat, copy_flat, copy);
    }

    pub fn download_as_csv(&self, flat: bool) {
        self.flat_dispatch(flat, download_flat, download);
    }

    pub fn get_view(&self) -> Option<JsPerspectiveView> {
        self.borrow().view.clone()
    }

    pub fn get_table_stats(&self) -> Option<TableStats> {
        self.borrow().stats.clone()
    }

    pub async fn create_view(
        self,
        config: &ViewConfig,
    ) -> Result<JsPerspectiveView, JsValue> {
        self.clear_view();
        let js_config = JsValue::from_serde(config)
            .to_jserror()?
            .unchecked_into::<JsPerspectiveViewConfig>();

        let table = self.borrow().table.clone().unwrap();
        let view = table.view(&js_config).await?;
        self.set_view(view.clone());
        Ok(view)
    }

    pub fn clear_view(&self) {
        if let Some(view) = self.borrow_mut().view.take() {
            spawn_local(async move {
                view.delete().await.expect("Failed to delete View");
            });
        }

        self.borrow_mut().view_sub = None;
    }

    pub fn reset_stats(&self) {
        self.update_stats(TableStats::default());
    }

    /// Set a new `View` (derived from this `Session`'s `Table`), and create the
    /// `update()` subscription.
    fn set_view(&self, view: JsPerspectiveView) {
        let table = self.borrow().table.clone().unwrap();
        let on_stats = Callback::from({
            let this = self.clone();
            move |stats| this.update_stats(stats)
        });

        let on_update = Callback::from({
            let this = self.clone();
            move |_| this.on_update()
        });

        let sub = ViewSubscription::new(table, view.clone(), on_stats, on_update);
        self.borrow_mut().view = Some(view);
        self.borrow_mut().view_sub = Some(sub);
    }

    fn on_update(&self) {
        for callback in self.0.borrow().on_update.iter() {
            callback();
        }
    }

    /// Update the this `Session`'s `TableStats` data from the `Table`.
    async fn set_initial_stats(self) -> Result<JsValue, JsValue> {
        let table = self.borrow().table.clone();
        let num_rows = table.unwrap().size().await? as u32;
        let stats = TableStats {
            is_pivot: false,
            num_rows: Some(num_rows),
            virtual_rows: None,
        };

        self.update_stats(stats);
        Ok(JsValue::UNDEFINED)
    }

    #[cfg(test)]
    pub fn set_stats(&self, stats: TableStats) {
        self.update_stats(stats)
    }

    fn update_stats(&self, stats: TableStats) {
        self.borrow_mut().stats = Some(stats);
        if let Some(cb) = self.borrow().on_stats.as_ref() {
            cb.emit(());
        }
    }

    fn flat_dispatch(
        &self,
        flat: bool,
        f1: fn(&JsPerspectiveTable) -> Result<js_sys::Promise, JsValue>,
        f2: fn(&JsPerspectiveView) -> Result<js_sys::Promise, JsValue>,
    ) {
        if flat {
            if let Some(table) = self.borrow().table.as_ref() {
                let _ = f1(table).unwrap();
            }
        } else if let Some(view_sub) = self.borrow().view_sub.as_ref() {
            let _ = f2(view_sub.view()).unwrap();
        };
    }
}
