////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use yew::prelude::*;

use super::view::*;
use crate::config::*;
use crate::js::perspective::*;
use crate::utils::*;
use crate::*;

/// Metadata snapshot of the current `Table()`/`View()` state which may be of
/// interest to components.
#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct ViewStats {
    pub is_group_by: bool,
    pub is_split_by: bool,
    pub is_filtered: bool,
    pub num_table_cells: Option<(u32, u32)>,
    pub num_view_cells: Option<(u32, u32)>,
}

#[derive(Clone)]
struct ViewSubscriptionData {
    table: JsPerspectiveTable,
    view: View,
    config: ViewConfig,
    on_stats: Callback<ViewStats>,
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
    async fn on_view_update(self) -> ApiResult<JsValue> {
        self.on_update.emit(());
        self.clone().update_view_stats().await?;
        Ok(JsValue::UNDEFINED)
    }

    /// TODO Use serde to serialize the full view config, instead of calculating
    /// `is_aggregated` here.
    async fn update_view_stats(self) -> ApiResult<JsValue> {
        let num_rows = self.table.num_rows().await? as u32;
        let num_cols = self.table.num_columns().await? as u32;
        let virtual_rows = self.view.num_rows().await? as u32;
        let virtual_cols = self.view.num_columns().await? as u32;
        let stats = ViewStats {
            num_table_cells: Some((num_rows, num_cols)),
            num_view_cells: Some((virtual_rows, virtual_cols)),
            is_filtered: virtual_rows != num_rows,
            is_group_by: !self.config.group_by.is_empty(),
            is_split_by: !self.config.split_by.is_empty(),
        };

        self.on_stats.emit(stats);
        Ok(JsValue::UNDEFINED)
    }
}

impl ViewSubscription {
    /// Create a new `ViewSubscription` with the provided Perspective `Table()`
    /// and `View()` pair.  During initialization, any necessary Perspective
    /// API events will be subscribed to and subsequently cleaned up via
    /// `Drop` trait.
    ///
    /// # Arguments
    /// * `table` - a Perspective `Table()`
    /// * `view` - a Perspective `View()` on this `table`.
    /// * `on_stats` - a callback for metadata notifications, from Perspective's
    ///   `View.on_update()`.
    pub fn new(
        table: JsPerspectiveTable,
        view: JsPerspectiveView,
        config: ViewConfig,
        on_stats: Callback<ViewStats>,
        on_update: Callback<()>,
    ) -> Self {
        let data = ViewSubscriptionData {
            table,
            view: View::new(view),
            config,
            on_stats,
            on_update,
        };

        let fun = {
            clone!(data);
            move |_| js_sys::Promise::from(ApiFuture::new(data.clone().on_view_update()))
        };

        let closure = fun.into_closure();
        data.view.on_update(closure.as_ref().unchecked_ref());
        ApiFuture::spawn(data.clone().update_view_stats());
        Self { data, closure }
    }

    /// Getter for the underlying `View()`.
    pub const fn get_view(&self) -> &View {
        &self.data.view
    }

    /// Getter for the underlying `Table()`.
    /// TODO this is un-used, but I'm leaving it as a reminder that the API
    /// intends this to be public.
    pub const fn _table(&self) -> &JsPerspectiveTable {
        &self.data.table
    }
}

impl Drop for ViewSubscription {
    fn drop(&mut self) {
        let update = self.closure.as_ref().unchecked_ref();
        self.data.view.remove_update(update);
    }
}
