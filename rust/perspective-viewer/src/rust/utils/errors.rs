////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use futures::channel::oneshot::Canceled;
use wasm_bindgen::prelude::*;

pub trait ToJsValueError<T> {
    /// A convenient extension method for `Result<T, E>`
    /// such that the `?` operator can compose serde errors with methods
    /// bound to be JavaScript callbacks.
    fn to_jserror(self) -> Result<T, JsValue>;
}

impl<T> ToJsValueError<T> for Result<T, serde_json::Error> {
    fn to_jserror(self) -> std::result::Result<T, JsValue> {
        self.map_err(|x| JsValue::from(format!("{}", x)))
    }
}

impl ToJsValueError<JsValue> for Result<(), Result<JsValue, JsValue>> {
    fn to_jserror(self) -> std::result::Result<JsValue, JsValue> {
        self.map_or_else(|x| x, |()| Ok(JsValue::UNDEFINED))
    }
}

impl<T> ToJsValueError<T> for Result<T, Canceled> {
    fn to_jserror(self) -> std::result::Result<T, JsValue> {
        self.map_err(|_x| JsValue::from("Cancelled"))
    }
}

impl<T> ToJsValueError<T> for Option<T> {
    fn to_jserror(self) -> std::result::Result<T, JsValue> {
        self.ok_or_else(|| JsValue::from("None"))
    }
}
