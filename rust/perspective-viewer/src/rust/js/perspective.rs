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
use js_sys::Array;
use serde::Deserialize;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use crate::utils::{ApiError, ApiResult};

// `wasm-bindgen` only supports `JsValue` return types from `extern async fn`,
// so use this macro to generate well-typed versions.
macro_rules! async_typed {
    (@jsvalue $sym:ident ()) => {{ $sym.await?; }};
    (@jsvalue $sym:ident f64) => { $sym.await?.as_f64().unwrap() };
    (@jsvalue $sym:ident $type:ty) => { $sym.await?.unchecked_into::<$type>() };
    ($old_fn:ident, $new_fn:ident(&self $(, $arg:ident : $argtype:ty)*) -> $($type:tt)+) => {
        pub async fn $new_fn(&self, $($arg: $argtype),*) -> Result<$($type)*, ApiError> {
            let fut = self.$old_fn($($arg)*);
            Ok(async_typed!(@jsvalue fut $($type)*))
        }
    };
    ($old_fn:ident, $new_fn:ident(self $(, $arg:ident : $argtype:ty)*) -> $($type:tt)+) => {
        pub async fn $new_fn(self, $($arg: $argtype),*) -> Result<$($type)*, ApiError> {
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
    pub type JsPerspectiveWorker;

    #[wasm_bindgen(method, catch, js_name = delete)]
    pub async fn _delete(this: &JsPerspectiveWorker) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = table)]
    pub async fn _table(
        this: &JsPerspectiveWorker,
        data: js_sys::Object
    ) -> ApiResult<JsValue>;

    #[derive(Clone)]
    pub type JsPerspectiveTable;

    pub type JsPerspectiveTableSchema;

    #[wasm_bindgen(method, catch, js_name = columns)]
    pub async fn _columns(this: &JsPerspectiveTable) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = delete)]
    pub async fn _delete(this: &JsPerspectiveTable) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = make_port)]
    pub async fn _make_port(this: &JsPerspectiveTable) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = schema)]
    pub async fn _schema(this: &JsPerspectiveTable) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = size)]
    pub async fn _size(this: &JsPerspectiveTable) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = validate_expressions)]
    pub async fn _validate_expressions(this: &JsPerspectiveTable, exprs: Array) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = view)]
    pub async fn _view(
        this: &JsPerspectiveTable, 
        config: &JsPerspectiveViewConfig
    ) -> ApiResult<JsValue>;

    pub type JsPerspectiveView;

    pub type JsPerspectiveViewSchema;

    #[wasm_bindgen(method, catch, js_name = delete)]
    pub async fn _delete(this: &JsPerspectiveView) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = to_csv)]
    pub async fn _to_csv(
        this: &JsPerspectiveView,
        options: js_sys::Object,
    ) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = to_arrow)]
    pub async fn _to_arrow(
        this: &JsPerspectiveView,
    ) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = to_columns)]
    pub async fn _to_columns(
        this: &JsPerspectiveView,
    ) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = dimensions)]
    pub async fn _dimensions(this: &JsPerspectiveView) -> ApiResult<JsValue>;

    #[wasm_bindgen(method)]
    pub fn on_update(this: &JsPerspectiveView, callback: &js_sys::Function);

    #[wasm_bindgen(method)]
    pub fn remove_update(this: &JsPerspectiveView, callback: &js_sys::Function);

    #[wasm_bindgen(method, catch, js_name = schema)]
    pub async fn _schema(this: &JsPerspectiveView) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = num_columns)]
    pub async fn _num_columns(this: &JsPerspectiveView) -> ApiResult<JsValue>;

    #[wasm_bindgen(method, catch, js_name = get_min_max)]
    pub async fn _get_min_max(this: &JsPerspectiveView, colname: js_sys::JsString) -> ApiResult<JsValue>;

    pub type JsPerspectiveViewConfig;

    pub type JsPerspectiveViewConfigUpdate;

    pub type JsPerspectiveValidatedExpressions;

    #[wasm_bindgen(method, getter)]
    pub fn errors(this: &JsPerspectiveValidatedExpressions) -> js_sys::Object;

    #[wasm_bindgen(method, getter)]
    pub fn expression_schema(this: &JsPerspectiveValidatedExpressions) -> js_sys::Object;

    #[wasm_bindgen(method, getter)]
    pub fn expression_alias(this: &JsPerspectiveValidatedExpressions) -> js_sys::Object;

    pub type JsPerspectiveViewDimensions;

    #[wasm_bindgen(method, getter)]
    pub fn num_table_rows(this: &JsPerspectiveViewDimensions) -> f64;

    #[wasm_bindgen(method, getter)]
    pub fn num_table_columns(this: &JsPerspectiveViewDimensions) -> f64;

    #[wasm_bindgen(method, getter)]
    pub fn num_view_rows(this: &JsPerspectiveViewDimensions) -> f64;

    #[wasm_bindgen(method, getter)]
    pub fn num_view_columns(this: &JsPerspectiveViewDimensions) -> f64;
}

impl JsPerspectiveWorker {
    async_typed!(_delete, delete(&self) -> ());

    async_typed!(_table, table(&self, data: js_sys::Object) -> JsPerspectiveTable);
}

impl JsPerspectiveTable {
    async_typed!(_columns, columns(&self) -> js_sys::Array);

    async_typed!(_delete, delete(self) -> ());

    async_typed!(_make_port, make_port(&self) -> f64);

    async_typed!(_validate_expressions, validate_expressions(&self, exprs: Array) -> JsPerspectiveValidatedExpressions);

    async_typed!(_schema, schema(&self) -> JsPerspectiveTableSchema);

    async_typed!(_size, size(&self) -> f64);

    async_typed!(_view, view(&self, config: &JsPerspectiveViewConfig) -> JsPerspectiveView);
}

impl JsPerspectiveView {
    async_typed!(_to_csv, to_csv(&self, options: js_sys::Object) -> js_sys::JsString);

    async_typed!(_to_arrow, to_arrow(&self) -> js_sys::ArrayBuffer);

    async_typed!(_to_columns, to_columns(&self) -> js_sys::Object);

    async_typed!(_dimensions, dimensions(&self) ->  JsPerspectiveViewDimensions);

    async_typed!(_schema, schema(&self) -> JsPerspectiveViewSchema);

    async_typed!(_delete, delete(self) -> ());

    pub async fn get_min_max(&self, col: &str) -> ApiResult<(f64, f64)> {
        let vec = self
            ._get_min_max(col.into())
            .await?
            .unchecked_into::<js_sys::Array>()
            .to_vec()
            .into_iter()
            .map(|jsval| jsval.as_f64().unwrap())
            .collect_vec();
        Ok((vec[0], vec[1]))
    }
}

#[derive(Deserialize, Debug, Clone, PartialEq, Eq)]
#[serde()]
pub struct PerspectiveValidationError {
    pub error_message: String,
    pub line: i32,
    pub column: i32,
}
