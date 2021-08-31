////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use js_intern::*;
use std::future::Future;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;

/// Same as `future_to_promise`, except this version will catch `"View is not
/// initialzied"` errors thrown from disposed Perspective objects without causing Rust
/// `abort()`s.
///
/// # Arguments
/// * `f` - a `Future` to convert to a `Promise` and execute.
pub fn promisify_ignore_view_delete<F>(f: F) -> js_sys::Promise
where
    F: Future<Output = Result<JsValue, JsValue>> + 'static,
{
    future_to_promise(async move {
        match f.await {
            Ok(x) => Ok(x),
            Err(y) => ignore_view_delete(y),
        }
    })
}

pub fn ignore_view_delete(f: JsValue) -> Result<JsValue, JsValue> {
    match f.clone().dyn_into::<js_sys::Error>() {
        Ok(err) => {
            if err.message() != "View method cancelled" {
                Err(f)
            } else {
                Ok(JsValue::from("View method cancelled"))
            }
        }
        _ => match f.as_string() {
            Some(x) if x == "View method cancelled" => {
                Ok(JsValue::from("View method cancelled"))
            }
            Some(_) => Err(f),
            _ => {
                if js_sys::Reflect::get(&f, js_intern!("message"))
                    .unwrap()
                    .as_string()
                    .unwrap_or_else(|| "".to_owned())
                    == "View method cancelled"
                {
                    Ok(JsValue::from("View method cancelled"))
                } else {
                    Err(f)
                }
            }
        },
    }
}
