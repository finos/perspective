////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::perspective::*;
use crate::utils::*;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use yew::prelude::*;

#[derive(Clone, Debug, Default, PartialEq)]
pub struct TableStats {
    pub is_pivot: bool,
    pub num_rows: Option<u32>,
    pub virtual_rows: Option<u32>,
}

type ViewSubscriptionData =
    (PerspectiveJsTable, PerspectiveJsView, Callback<TableStats>);

pub struct ViewSubscription {
    data: ViewSubscriptionData,
    closure: Closure<dyn Fn() -> js_sys::Promise>,
}

impl ViewSubscription {
    pub fn new(
        table: PerspectiveJsTable,
        view: PerspectiveJsView,
        callback: Callback<TableStats>,
    ) -> ViewSubscription {
        let data = (table, view.clone(), callback);
        let closure = async_method_to_jsfunction(&data, Self::update_view_stats);
        view.on_update(closure.as_ref().unchecked_ref());
        let _ = promisify_ignore_view_delete(Self::update_view_stats(data.clone()));
        ViewSubscription { data, closure }
    }

    /// TODO Use serde to serialize the full view config, instead of calculating
    /// `is_pivot` here.
    pub async fn update_view_stats(
        (table, view, callback): ViewSubscriptionData,
    ) -> Result<JsValue, JsValue> {
        let config = view.get_config().await?;
        let num_rows = table.size().await? as u32;
        let virtual_rows = view.num_rows().await? as u32;
        let stats = TableStats {
            num_rows: Some(num_rows),
            virtual_rows: Some(virtual_rows),
            is_pivot: config.row_pivots().length() > 0
                || config.column_pivots().length() > 0
                || virtual_rows != num_rows,
        };

        callback.emit(stats);
        Ok(JsValue::UNDEFINED)
    }

    pub fn view(&self) -> &PerspectiveJsView {
        &self.data.1
    }
}

impl Drop for ViewSubscription {
    fn drop(&mut self) {
        let update = self.closure.as_ref().unchecked_ref();
        self.data.1.remove_update(update);
    }
}
