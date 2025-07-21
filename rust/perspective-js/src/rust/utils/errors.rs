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

use std::fmt::Display;
use std::rc::Rc;
use std::string::FromUtf8Error;

use perspective_client::{ClientError, ExprValidationResult};
use thiserror::*;
use wasm_bindgen::prelude::*;

#[macro_export]
macro_rules! apierror {
    ($msg:expr) => {{
        use $crate::utils::errors::ApiErrorType::*;
        let js_err_type = $msg;
        let err = js_sys::Error::new(js_err_type.to_string().as_str());
        let js_err = $crate::utils::errors::ApiError(
            js_err_type,
            $crate::utils::errors::JsBackTrace(std::rc::Rc::new(err.clone())),
        );
        js_err
    }};
}

fn format_js_error(value: &JsValue) -> String {
    if let Some(err) = value.dyn_ref::<js_sys::Error>() {
        let msg = err.message().as_string().unwrap();
        if let Ok(x) = js_sys::Reflect::get(value, &"stack".into()) {
            format!("{}\n{}", msg, x.as_string().unwrap())
        } else {
            msg
        }
    } else {
        value
            .as_string()
            .unwrap_or_else(|| format!("{value:?}"))
            .to_string()
    }
}

fn format_valid_exprs(recs: &ExprValidationResult) -> String {
    recs.errors
        .iter()
        .map(|x| format!("\"{}\": {}", x.0, x.1.error_message))
        .collect::<Vec<_>>()
        .join(", ")
}

/// A bespoke error class for chaining a litany of error types with the `?`
/// operator.  
#[derive(Clone, Debug, Error)]
pub enum ApiErrorType {
    #[error("{}", format_js_error(.0))]
    JsError(JsValue),

    #[error("{}", format_js_error(.0))]
    JsRawError(js_sys::Error),

    #[error("Failed to construct table from {0:?}")]
    TableError(JsValue),

    #[error("{}", format_js_error(.0))]
    ViewerPluginError(JsValue),

    #[error("{0}")]
    ExternalError(Rc<Box<dyn std::error::Error>>),

    #[error("{0}")]
    UnknownError(String),

    #[error("{0}")]
    ClientError(#[from] ClientError),

    #[error("Cancelled")]
    CancelledError(#[from] futures::channel::oneshot::Canceled),

    #[error("{0}")]
    SerdeJsonError(Rc<serde_json::Error>),

    #[error("{0}")]
    ProstError(#[from] prost::DecodeError),

    #[error("Unknown column \"{1}\" in field `{0}`")]
    InvalidViewerConfigError(&'static str, String),

    #[error("Invalid `expressions` {}", format_valid_exprs(.0))]
    InvalidViewerConfigExpressionsError(Rc<ExprValidationResult>),

    #[error("No `Table` attached")]
    NoTableError,

    #[error(transparent)]
    SerdeWasmBindgenError(Rc<serde_wasm_bindgen::Error>),

    #[error(transparent)]
    Utf8Error(#[from] FromUtf8Error),

    #[error(transparent)]
    StdIoError(Rc<std::io::Error>),

    #[error(transparent)]
    RmpSerdeEncodeError(Rc<rmp_serde::encode::Error>),

    #[error(transparent)]
    RmpSerdeDecodeError(Rc<rmp_serde::decode::Error>),

    #[error(transparent)]
    Base64DecodeError(#[from] base64::DecodeError),

    #[error(transparent)]
    ChronoParseError(#[from] chrono::ParseError),
}

#[derive(Clone, Debug, Error)]
pub struct ApiError(pub ApiErrorType, pub JsBackTrace);

impl ApiError {
    pub fn new<T: Display>(val: T) -> Self {
        apierror!(UnknownError(format!("{val}")))
    }

    /// The error category
    pub fn kind(&self) -> &'static str {
        match self.0 {
            ApiErrorType::JsError(..) => "[JsError]",
            ApiErrorType::TableError(_) => "[TableError]",
            ApiErrorType::ExternalError(_) => "[ExternalError]",
            ApiErrorType::UnknownError(..) => "[UnknownError]",
            ApiErrorType::ClientError(_) => "[ClientError]",
            ApiErrorType::CancelledError(_) => "[CancelledError]",
            ApiErrorType::SerdeJsonError(_) => "[SerdeJsonError]",
            ApiErrorType::ProstError(_) => "[ProstError]",
            ApiErrorType::InvalidViewerConfigError(..) => "[InvalidViewerConfigError]",
            ApiErrorType::InvalidViewerConfigExpressionsError(_) => "[InvalidViewerConfigError]",
            ApiErrorType::NoTableError => "[NoTableError]",
            ApiErrorType::SerdeWasmBindgenError(_) => "[SerdeWasmBindgenError]",
            ApiErrorType::Utf8Error(_) => "[FromUtf8Error]",
            ApiErrorType::StdIoError(_) => "[StdIoError]",
            ApiErrorType::RmpSerdeEncodeError(_) => "[RmpSerdeEncodeError]",
            ApiErrorType::RmpSerdeDecodeError(_) => "[RmpSerdeDecodeError]",
            ApiErrorType::Base64DecodeError(_) => "[Base64DecodeError]",
            ApiErrorType::ChronoParseError(_) => "[ChronoParseError]",
            ApiErrorType::ViewerPluginError(_) => "[ViewerPluginError]",
            ApiErrorType::JsRawError(_) => "[JsRawError]",
        }
    }

    /// The raw internal enum
    pub fn inner(&self) -> &'_ ApiErrorType {
        &self.0
    }

    /// The `Display` for this error
    pub fn message(&self) -> String {
        self.0.to_string()
    }

    /// This error's stacktrace from when it was constructed.
    pub fn stacktrace(&self) -> String {
        js_sys::Reflect::get(&self.1.0, &"stack".into())
            .unwrap()
            .as_string()
            .unwrap()
            .to_string()
    }
}

unsafe impl Send for ApiError {}
unsafe impl Sync for ApiError {}

impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

impl<T: Into<ApiErrorType>> From<T> for ApiError {
    fn from(value: T) -> Self {
        let value: ApiErrorType = value.into();
        let err = js_sys::Error::new(value.to_string().as_str());
        ApiError(value, JsBackTrace(Rc::new(err.clone())))
    }
}

impl From<ApiError> for JsValue {
    fn from(err: ApiError) -> Self {
        err.1.0.unchecked_ref::<JsValue>().clone()
    }
}

impl From<serde_wasm_bindgen::Error> for ApiError {
    fn from(value: serde_wasm_bindgen::Error) -> Self {
        ApiErrorType::SerdeWasmBindgenError(Rc::new(value)).into()
    }
}

impl From<std::io::Error> for ApiError {
    fn from(value: std::io::Error) -> Self {
        ApiErrorType::StdIoError(Rc::new(value)).into()
    }
}

impl From<rmp_serde::decode::Error> for ApiError {
    fn from(value: rmp_serde::decode::Error) -> Self {
        ApiErrorType::RmpSerdeDecodeError(Rc::new(value)).into()
    }
}

impl From<rmp_serde::encode::Error> for ApiError {
    fn from(value: rmp_serde::encode::Error) -> Self {
        ApiErrorType::RmpSerdeEncodeError(Rc::new(value)).into()
    }
}

impl From<Box<dyn std::error::Error>> for ApiError {
    fn from(value: Box<dyn std::error::Error>) -> Self {
        ApiErrorType::ExternalError(Rc::new(value)).into()
    }
}

impl From<serde_json::Error> for ApiError {
    fn from(value: serde_json::Error) -> Self {
        ApiErrorType::SerdeJsonError(Rc::new(value)).into()
    }
}

impl From<JsValue> for ApiError {
    fn from(err: JsValue) -> Self {
        if err.is_instance_of::<js_sys::Error>() {
            ApiErrorType::JsRawError(err.clone().unchecked_into()).into()
        } else {
            apierror!(JsError(err))
        }
    }
}

impl From<String> for ApiError {
    fn from(value: String) -> Self {
        apierror!(UnknownError(value.to_owned()))
    }
}

impl From<&str> for ApiError {
    fn from(value: &str) -> Self {
        apierror!(UnknownError(value.to_owned()))
    }
}

/// `ToApiError` handles complex cases that can't be into-d
pub trait ToApiError<T> {
    fn into_apierror(self) -> ApiResult<T>;
}

impl<T> ToApiError<T> for Option<T> {
    fn into_apierror(self) -> ApiResult<T> {
        self.ok_or_else(|| "Unwrap on None".into())
    }
}

impl ToApiError<JsValue> for Result<(), ApiResult<JsValue>> {
    fn into_apierror(self) -> ApiResult<JsValue> {
        self.map_or_else(|x| x, |()| Ok(JsValue::UNDEFINED))
    }
}

/// A common Rust error handling idiom (see e.g. `anyhow::Result`)
pub type ApiResult<T> = Result<T, ApiError>;

// Backtrace

#[derive(Clone, Debug)]
pub struct JsBackTrace(pub Rc<js_sys::Error>);

impl std::fmt::Display for JsBackTrace {
    fn fmt(&self, _: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        Ok(())
    }
}
