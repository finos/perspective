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

use wasm_bindgen::prelude::*;

/// A bespoke error class for chaining a litany of various error types with the
/// `?` operator.  `anyhow`, `web_sys::JsError` are candidates for replacing
/// this, but we'd need a way to get around syntacitc conveniences we get
/// from avoiding orphan instance issues (e.g. converting `JsValue` to an error
/// in `anyhow`).
///
/// We'd still like to implement this, but instead must independently implement
/// the instance for each error, as otherwise `rustc` will complain that the
/// `wasm_bindgen` authors my themselves implement `Error` for `JsValue`.
/// ```
/// impl<T> From<T> for ApiError
/// where
///     T: std::error::Error,
/// {
///     fn from(x: T) -> Self {
///         ApiError(JsValue::from(format!("{}", x)))
///     }
/// }
/// ```
#[derive(Clone, Debug)]
pub struct ApiError(JsValue);

pub type ApiResult<T> = Result<T, ApiError>;

impl From<ApiError> for JsValue {
    fn from(err: ApiError) -> Self {
        err.0
    }
}

impl From<JsValue> for ApiError {
    fn from(err: JsValue) -> Self {
        Self(err)
    }
}

macro_rules! define_api_error {
    ( $($t:ty),* ) => {
        $(
            impl From<$t> for ApiError {
                fn from(err: $t) -> Self {
                    ApiError(JsValue::from(format!("{}", err)))
                }
            }
        )*
    }
}

define_api_error!(
    serde_json::Error,
    serde_wasm_bindgen::Error,
    std::io::Error,
    rmp_serde::encode::Error,
    rmp_serde::decode::Error,
    &str,
    String,
    futures::channel::oneshot::Canceled,
    base64::DecodeError,
    chrono::ParseError
);

/// Explicit conversion methods for `ApiResult<T>`, for situations where
/// error-casting through the `?` operator is insufficient.
pub trait ToApiError<T> {
    fn into_apierror(self) -> ApiResult<T>;
    fn as_apierror(&self) -> Result<&T, ApiError>;
}

impl<T> ToApiError<T> for Option<T> {
    fn into_apierror(self) -> ApiResult<T> {
        self.ok_or_else(|| "Unwrap on None".into())
    }

    fn as_apierror(&self) -> Result<&T, ApiError> {
        self.as_ref().ok_or_else(|| "Unwrap on None".into())
    }
}

impl ToApiError<JsValue> for Result<(), ApiResult<JsValue>> {
    fn into_apierror(self) -> ApiResult<JsValue> {
        self.map_or_else(|x| x, |()| Ok(JsValue::UNDEFINED))
    }

    fn as_apierror(&self) -> Result<&JsValue, ApiError> {
        self.as_ref().map_or_else(
            |x| match x {
                Ok(ref x) => Ok(x),
                Err(err) => Err(err.clone()),
            },
            |()| Ok(js_intern::js_intern!("test")),
        )
    }
}
