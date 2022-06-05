////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use js_intern::*;
use std::future::Future;
use std::pin::Pin;
use wasm_bindgen::convert::FromWasmAbi;
use wasm_bindgen::convert::IntoWasmAbi;
use wasm_bindgen::describe::WasmDescribe;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen::__rt::IntoJsResult;
use wasm_bindgen_futures::future_to_promise;
use wasm_bindgen_futures::JsFuture;

/// A newtype wrapper for a `Future` trait object which supports being
/// marshalled to a `JsPromise`, avoiding an API which requires type casing to
/// and from `JsValue` and the associated loss of type safety.
pub struct ApiFuture<T>(Pin<Box<dyn Future<Output = Result<T, JsValue>>>>);

impl<T> ApiFuture<T> {
    #[must_use]
    pub fn from<U: Future<Output = Result<T, JsValue>> + 'static>(x: U) -> ApiFuture<T> {
        ApiFuture(Box::pin(x))
    }
}

impl<T> ApiFuture<T>
where
    Result<T, JsValue>: IntoJsResult + 'static,
{
    pub fn spawn<U: Future<Output = Result<T, JsValue>> + 'static>(x: U) {
        drop(JsValue::from(ApiFuture(Box::pin(x))))
    }
}

impl<T> From<ApiFuture<T>> for JsValue
where
    Result<T, JsValue>: IntoJsResult + 'static,
{
    fn from(fut: ApiFuture<T>) -> Self {
        js_sys::Promise::from(fut).unchecked_into()
    }
}

impl<T> From<ApiFuture<T>> for js_sys::Promise
where
    Result<T, JsValue>: IntoJsResult + 'static,
{
    fn from(fut: ApiFuture<T>) -> Self {
        promisify_ignore_view_delete(async move { fut.0.await.into_js_result() })
    }
}

impl<T> WasmDescribe for ApiFuture<T> {
    fn describe() {
        <js_sys::Promise as WasmDescribe>::describe()
    }
}

impl<T> IntoWasmAbi for ApiFuture<T>
where
    Result<T, JsValue>: IntoJsResult + 'static,
{
    type Abi = <js_sys::Promise as IntoWasmAbi>::Abi;
    #[inline]
    fn into_abi(self) -> Self::Abi {
        js_sys::Promise::from(self).into_abi()
    }
}

impl<T> FromWasmAbi for ApiFuture<T>
where
    Result<T, JsValue>: IntoJsResult + 'static,
    T: From<JsValue> + Into<JsValue>,
{
    type Abi = <js_sys::Promise as IntoWasmAbi>::Abi;
    #[inline]
    unsafe fn from_abi(js: Self::Abi) -> Self {
        ApiFuture::from(
            async move { Ok(JsFuture::from(js_sys::Promise::from_abi(js)).await?.into()) },
        )
    }
}

impl<T> Future for ApiFuture<T>
where
    Result<T, JsValue>: IntoJsResult + 'static,
{
    type Output = Result<T, JsValue>;
    fn poll(
        self: Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Self::Output> {
        let mut fut = unsafe { self.map_unchecked_mut(|s| &mut s.0) };
        fut.as_mut().poll(cx)
    }
}

/// Same as `future_to_promise`, except this version will catch `"View is not
/// initialzied"` errors thrown from disposed Perspective objects without
/// causing Rust `abort()`s.
///
/// # Arguments
/// * `f` - a `Future` to convert to a `Promise` and execute.
fn promisify_ignore_view_delete<F>(f: F) -> js_sys::Promise
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
            Some(x) if x == "View method cancelled" => Ok(JsValue::from("View method cancelled")),
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
