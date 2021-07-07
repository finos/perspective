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

    receiver.await.to_jserror()
}
