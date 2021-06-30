////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use js_sys::Array;
use serde::Deserialize;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

// `wasm-bindgen` only supports `JsValue` return types from `extern async fn`, so use
// this macro to generate well-typed versions.
macro_rules! async_typed {
    (@jsvalue $sym:ident ()) => {{ $sym.await?; }};
    (@jsvalue $sym:ident f64) => { $sym.await?.as_f64().unwrap() };
    (@jsvalue $sym:ident $type:ty) => { $sym.await?.unchecked_into::<$type>() };
    ($old_fn:ident, $new_fn:ident($($arg:ident : $argtype:ty),*) -> $($type:tt)+) => {
        pub async fn $new_fn(&self, $($arg: $argtype),*) -> Result<$($type)*, JsValue> {
            let fut = self.$old_fn($($arg)*);
            Ok(async_typed!(@jsvalue fut $($type)*))
        }
    };
}

/// Perspective FFI
#[wasm_bindgen]
#[rustfmt::skip]
extern "C" {

    #[derive(Clone)]
    pub type PerspectiveJsWorker;

    #[wasm_bindgen(method, catch, js_name = delete)]
    pub async fn _delete(this: &PerspectiveJsWorker) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch, js_name = table)]
    pub async fn _table(
        this: &PerspectiveJsWorker,
        data: js_sys::Object
    ) -> Result<JsValue, JsValue>;

    #[derive(Clone)]
    pub type PerspectiveJsTable;

    #[wasm_bindgen(method, catch, js_name = columns)]
    pub async fn _columns(this: &PerspectiveJsTable) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch, js_name = delete)]
    pub async fn _delete(this: &PerspectiveJsTable) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch, js_name = size)]
    pub async fn _size(this: &PerspectiveJsTable) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch, js_name = validate_expressions)]
    pub async fn _validate_expressions(this: &PerspectiveJsTable, exprs: Array) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch, js_name = view)]
    pub async fn _view(
        this: &PerspectiveJsTable, 
        config: js_sys::Object
    ) -> Result<JsValue, JsValue>;

    #[derive(Clone)]
    pub type PerspectiveJsView;

    #[wasm_bindgen(method, catch, js_name = delete)]
    pub async fn _delete(this: &PerspectiveJsView) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch, js_name = to_csv)]
    pub async fn _to_csv(
        this: &PerspectiveJsView,
        options: js_sys::Object,
    ) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch, js_name = num_rows)]
    pub async fn _num_rows(this: &PerspectiveJsView) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method)]
    pub fn on_update(this: &PerspectiveJsView, callback: &js_sys::Function);

    #[wasm_bindgen(method)]
    pub fn remove_update(this: &PerspectiveJsView, callback: &js_sys::Function);

    #[wasm_bindgen(method, catch, js_name = get_config)]
    pub async fn _get_config(this: &PerspectiveJsView) -> Result<JsValue, JsValue>;

    pub type PerspectiveJsViewConfig;

    #[wasm_bindgen(method, getter)]
    pub fn row_pivots(this: &PerspectiveJsViewConfig) -> js_sys::Array;

    #[wasm_bindgen(method, getter)]
    pub fn column_pivots(this: &PerspectiveJsViewConfig) -> js_sys::Array;

    pub type PerspectiveValidatedExpressions;

    #[wasm_bindgen(method, getter)]
    pub fn errors(this: &PerspectiveValidatedExpressions) -> js_sys::Object;
}

impl PerspectiveJsWorker {
    async_typed!(_delete, delete() -> ());
    async_typed!(_table, table(data: js_sys::Object) -> PerspectiveJsTable);
}

impl PerspectiveJsTable {
    async_typed!(_columns, columns() -> js_sys::Array);
    async_typed!(_delete, delete() -> ());
    async_typed!(_validate_expressions, validate_expressions(exprs: Array) -> PerspectiveValidatedExpressions);
    async_typed!(_view, view(config: js_sys::Object) -> PerspectiveJsView);
    async_typed!(_size, size() -> f64);
}

impl PerspectiveJsView {
    async_typed!(_to_csv, to_csv(options: js_sys::Object) -> js_sys::JsString);
    async_typed!(_num_rows, num_rows() -> f64);
    async_typed!(_delete, delete() -> ());
    async_typed!(_get_config, get_config() -> PerspectiveJsViewConfig);
}

#[derive(Deserialize)]
#[serde()]
pub struct PerspectiveValidationError {
    pub error_message: String,
    pub line: u32,
    pub column: u32,
}
