////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::errors::*;

use async_trait::async_trait;
use futures::channel::oneshot::*;
use wasm_bindgen::prelude::*;
use yew::prelude::*;

#[async_trait(?Send)]
pub trait ToAsyncCallback<T> {
    async fn emit_and_render(&self) -> Result<T, JsValue>;
}

#[async_trait(?Send)]
impl<T> ToAsyncCallback<T> for Callback<Sender<T>> {
    async fn emit_and_render(&self) -> Result<T, JsValue> {
        let (sender, receiver) = channel::<T>();
        self.emit(sender);
        receiver.await.to_jserror()
    }
}
