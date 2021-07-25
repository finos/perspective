////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use futures::channel::oneshot::Canceled;
use std::num::*;
use std::str::*;
use wasm_bindgen::prelude::*;

pub trait ToJsValueError<T> {
    /// A convenient extension method for `Result<T, E>`
    /// such that the `?` operator can compose serde errors with methods
    /// bound to be JavaScript callbacks.
    fn into_jserror(self) -> Result<T, JsValue>;
}

impl<T> ToJsValueError<T> for Result<T, serde_json::Error> {
    fn into_jserror(self) -> std::result::Result<T, JsValue> {
        self.map_err(|x| JsValue::from(format!("{}", x)))
    }
}

impl ToJsValueError<JsValue> for Result<(), Result<JsValue, JsValue>> {
    fn into_jserror(self) -> std::result::Result<JsValue, JsValue> {
        self.map_or_else(|x| x, |()| Ok(JsValue::UNDEFINED))
    }
}

impl<T> ToJsValueError<T> for Result<T, Canceled> {
    fn into_jserror(self) -> std::result::Result<T, JsValue> {
        self.map_err(|_x| JsValue::from("Cancelled"))
    }
}

impl<T> ToJsValueError<T> for Option<T> {
    fn into_jserror(self) -> std::result::Result<T, JsValue> {
        self.ok_or_else(|| JsValue::from("None"))
    }
}

impl<T> ToJsValueError<T> for Result<T, ParseIntError> {
    fn into_jserror(self) -> Result<T, JsValue> {
        self.map_err(|x: ParseIntError| JsValue::from(&format!("{}", x)))
    }
}

impl<T> ToJsValueError<T> for Result<T, Utf8Error> {
    fn into_jserror(self) -> Result<T, JsValue> {
        self.map_err(|x: Utf8Error| JsValue::from(&format!("{}", x)))
    }
}

impl<T> ToJsValueError<T> for Result<T, base64::DecodeError> {
    fn into_jserror(self) -> Result<T, JsValue> {
        self.map_err(|x: base64::DecodeError| JsValue::from(&format!("{}", x)))
    }
}

impl<T> ToJsValueError<T> for Result<T, rmp_serde::encode::Error> {
    fn into_jserror(self) -> Result<T, JsValue> {
        self.map_err(|x: rmp_serde::encode::Error| JsValue::from(&format!("{}", x)))
    }
}

impl<T> ToJsValueError<T> for Result<T, rmp_serde::decode::Error> {
    fn into_jserror(self) -> Result<T, JsValue> {
        self.map_err(|x: rmp_serde::decode::Error| JsValue::from(&format!("{}", x)))
    }
}

impl<T> ToJsValueError<T> for Result<T, std::io::Error> {
    fn into_jserror(self) -> Result<T, JsValue> {
        self.map_err(|x: std::io::Error| JsValue::from(&format!("{}", x)))
    }
}
