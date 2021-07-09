////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js::perspective::*;
use crate::utils::*;
use crate::*;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use yew::prelude::*;

/// Metadata snapshot of the current `Table()`/`View()` state which may be of interest
/// to components.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct TableStats {
    pub is_pivot: bool,
    pub num_rows: Option<u32>,
    pub virtual_rows: Option<u32>,
}

#[derive(Clone)]
struct ViewSubscriptionData {
    table: JsPerspectiveTable,
    view: JsPerspectiveView,
    on_stats: Callback<TableStats>,
    on_update: Callback<()>,
}

/// A subscription to `on_update()` events from a Perspective `View()`, managing
/// the `Closure` state as well as cleanup via `on_delete()`.
pub struct ViewSubscription {
    data: ViewSubscriptionData,
    closure: Closure<dyn Fn(JsValue) -> js_sys::Promise>,
}

impl ViewSubscriptionData {
    /// Main handler when underlying `View()` calls `on_update()`.
    async fn on_view_update(self) -> Result<JsValue, JsValue> {
        self.on_update.emit(());
        self.clone().update_view_stats().await?;
        Ok(JsValue::UNDEFINED)
    }

    /// TODO Use serde to serialize the full view config, instead of calculating
    /// `is_pivot` here.
    async fn update_view_stats(self) -> Result<JsValue, JsValue> {
        let config = self.view.get_config().await?;
        let num_rows = self.table.size().await? as u32;
        let virtual_rows = self.view.num_rows().await? as u32;
        let stats = TableStats {
            num_rows: Some(num_rows),
            virtual_rows: Some(virtual_rows),
            is_pivot: config.row_pivots().length() > 0
                || config.column_pivots().length() > 0
                || virtual_rows != num_rows,
        };

        self.on_stats.emit(stats);
        Ok(JsValue::UNDEFINED)
    }
}

impl ViewSubscription {
    /// Create a new `ViewSubscription` with the provided Perspective `Table()` and
    /// `View()` pair.  During initialization, any necessary Perspective API events
    /// will be subscribed to and subsequently cleaned up via `Drop` trait.
    ///
    /// # Arguments
    /// * `table` - a Perspective `Table()`
    /// * `view` - a Perspective `View()` on this `table`.
    /// * `on_stats` - a callback for metadata notifications, from Perspective's
    ///   `View.on_update()`.
    pub fn new(
        table: JsPerspectiveTable,
        view: JsPerspectiveView,
        on_stats: Callback<TableStats>,
        on_update: Callback<()>,
    ) -> ViewSubscription {
        let data = ViewSubscriptionData {
            table,
            view,
            on_stats,
            on_update,
        };

        let fun = {
            clone!(data);
            move |_| promisify_ignore_view_delete(data.clone().on_view_update())
        };

        let closure = fun.to_closure();
        data.view.on_update(closure.as_ref().unchecked_ref());
        let _ = promisify_ignore_view_delete(data.clone().update_view_stats());
        ViewSubscription { data, closure }
    }

    /// Getter for the underlying `View()`.
    pub fn view(&self) -> &JsPerspectiveView {
        &self.data.view
    }

    /// Getter for the underlying `Table()`.
    /// TODO this is un-used, but I'm leaving it as a reminder that the API
    /// intends this to be public.
    pub fn _table(&self) -> &JsPerspectiveTable {
        &self.data.table
    }
}

impl Drop for ViewSubscription {
    fn drop(&mut self) {
        let update = self.closure.as_ref().unchecked_ref();
        self.data.view.remove_update(update);
    }
}
