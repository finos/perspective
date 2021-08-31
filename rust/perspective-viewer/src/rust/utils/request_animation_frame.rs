////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;

use futures::channel::oneshot::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::*;

/// An `async` version of `request_animation_frame`, which resolves on the next
/// animation frame.
pub async fn await_animation_frame() -> Result<(), JsValue> {
    let (sender, receiver) = channel::<()>();
    let jsfun = Closure::once_into_js(move || sender.send(()).unwrap());
    web_sys::window()
        .unwrap()
        .request_animation_frame(jsfun.unchecked_ref())?;

    receiver.await.into_jserror()
}

/// An `async` version of `set_timeout`, which resolves in `timeout` milliseconds
pub async fn set_timeout(timeout: i32) -> Result<(), JsValue> {
    let (sender, receiver) = channel::<()>();
    let jsfun = Closure::once_into_js(move || sender.send(()).unwrap());
    web_sys::window()
        .unwrap()
        .set_timeout_with_callback_and_timeout_and_arguments_0(
            jsfun.unchecked_ref(),
            timeout,
        )?;

    receiver.await.into_jserror()
}
