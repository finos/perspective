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
    NULL_C.with(|ignore| future_to_promise(f).catch(ignore))
}

thread_local! {
    static NULL_C: Closure<dyn FnMut(JsValue)> = Closure::wrap(Box::new(ignore_view_delete));
}

fn ignore_view_delete(f: JsValue) {
    match f.clone().dyn_into::<js_sys::Error>() {
        Ok(err) => {
            if err.message() != "View is not initialized" {
                wasm_bindgen::throw_val(f);
            }
        }
        _ => match f.as_string() {
            Some(x) if x == "View is not initialized" => {}
            Some(_) => wasm_bindgen::throw_val(f),
            _ => match js_sys::Reflect::has(&f, js_intern!("message")) {
                Ok(true)
                    if js_sys::Reflect::get(&f, js_intern!("message"))
                        .unwrap()
                        .as_string()
                        .unwrap_or_else(|| "".to_owned())
                        == "View is not initialized" => {}
                _ => wasm_bindgen::throw_val(f),
            },
        },
    }
}
