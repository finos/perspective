////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use ::futures::channel::oneshot::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::*;

use crate::utils::*;

/// An `async` version of `request_animation_frame`, which resolves on the next
/// animation frame.
pub async fn await_animation_frame() -> ApiResult<()> {
    let (sender, receiver) = channel::<()>();
    let jsfun = Closure::once_into_js(move || sender.send(()).unwrap());
    web_sys::window()
        .unwrap()
        .request_animation_frame(jsfun.unchecked_ref())?;

    Ok(receiver.await?)
}

/// An `async` which awaits the browser's `load` event, which is automatically
/// bypassed if `document.readyState` indicates this has already occurred.
pub async fn await_dom_loaded() -> ApiResult<()> {
    let window = web_sys::window().unwrap();
    let state = window.document().unwrap().ready_state();
    if state == "complete" || state == "loaded" {
        Ok(())
    } else {
        let (sender, receiver) = channel::<()>();
        let jsfun = Closure::once_into_js(move || sender.send(()).unwrap());
        window.add_event_listener_with_callback("load", jsfun.unchecked_ref())?;
        Ok(receiver.await?)
    }
}

/// An `async` version of `set_timeout`, which resolves in `timeout`
/// milliseconds
pub async fn set_timeout(timeout: i32) -> ApiResult<()> {
    let (sender, receiver) = channel::<()>();
    let jsfun = Closure::once_into_js(move || {
        let _ = sender.send(());
    });

    web_sys::window()
        .unwrap()
        .set_timeout_with_callback_and_timeout_and_arguments_0(jsfun.unchecked_ref(), timeout)?;

    Ok(receiver.await?)
}
