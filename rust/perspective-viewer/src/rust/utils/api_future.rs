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
use wasm_bindgen_futures::future_to_promise;
use wasm_bindgen_futures::JsFuture;

// TODO This is risky to rely on, but it is currently impossible to implement
// this trait locally due to the orphan instance restriction.  Using this trait
// removes alow of boilerplate required by `async` when casting to `Promise`.
use wasm_bindgen::__rt::IntoJsResult;

/// A newtype wrapper for a `Future` trait object which supports being
/// marshalled to a `JsPromise`, avoiding an API which requires type casing to
/// and from `JsValue` and the associated loss of type safety.
pub struct ApiFuture<T>(Pin<Box<dyn Future<Output = Result<T, JsValue>>>>);

impl<T> ApiFuture<T> {
    /// Constructor for `ApiFuture`.  Note that, like a regular `Future`, the
    /// `ApiFuture` created does _not_ execute without being further cast to a
    /// `Promise`, either explicitly or implcitly (when exposed via
    /// `wasm_bindgen`).
    #[must_use]
    pub fn new<U: Future<Output = Result<T, JsValue>> + 'static>(x: U) -> ApiFuture<T> {
        ApiFuture(Box::pin(x))
    }
}

impl<T> ApiFuture<T>
where
    Result<T, JsValue>: IntoJsResult + 'static,
{
    /// Construct an `ApiFuture` and execute it immediately.  The `Promise`
    /// handle created internally is dropped, but since JavaScript `Promise`
    /// executes on construction, the async invocation persists.
    pub fn spawn<U: Future<Output = Result<T, JsValue>> + 'static>(x: U) {
        drop(js_sys::Promise::from(ApiFuture(Box::pin(x))))
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
        ApiFuture::new(async move {
            let promise = js_sys::Promise::from_abi(js);
            Ok(JsFuture::from(promise).await?.into())
        })
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

/// Wraps an error `JsValue` return from a caught JavaScript exception,
/// checking for the explicit error type indicating that a `JsPerspectiveView`
/// call has been cancelled due to it already being deleted.  This is a normal
/// mechanic of the `JsPerspectiveView` to cancel a `View` call that is no
/// longer need be the viewer, e.g. when the user updates the UI before the
/// previous update has finished drawing.  Without using exceptions for this,
/// we'd need to wrap every such `JsPerspectiveView` call individually.
///
/// When `"View method cancelled"` message is received, this call should
/// silently be replaced with `Ok`.  The message itself is returned in this
/// case (instead of whatever the `async` returns), which is helpful for
/// detecting this condition when debugging.
pub fn ignore_view_delete(f: JsValue) -> Result<JsValue, JsValue> {
    match f.clone().dyn_into::<js_sys::Error>() {
        Ok(err) => {
            if err.message() != "View method cancelled" {
                Err(f)
            } else {
                Ok(js_intern!("View method cancelled").clone())
            }
        }
        _ => match f.as_string() {
            Some(x) if x == "View method cancelled" => {
                Ok(js_intern!("View method cancelled").clone())
            }
            Some(_) => Err(f),
            _ => {
                if js_sys::Reflect::get(&f, js_intern!("message"))
                    .unwrap()
                    .as_string()
                    .unwrap_or_else(|| "".to_owned())
                    == "View method cancelled"
                {
                    Ok(js_intern!("View method cancelled").clone())
                } else {
                    Err(f)
                }
            }
        },
    }
}
