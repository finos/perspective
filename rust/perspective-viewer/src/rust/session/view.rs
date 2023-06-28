// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

use std::ops::Deref;
use std::rc::Rc;

use async_trait::async_trait;
use derivative::Derivative;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;

use crate::js::perspective::*;
use crate::utils::ApiResult;

/// `PerspectiveOwned` is a newtype-ed `Rc` smart pointer which guarantees
/// either a `JsPerspectiveView` or `JsPerspectiveTable` will have its
/// `.delete()` method called when it is dropped.
#[derive(Derivative)]
#[derivative(Clone(bound = ""))]
pub struct PerspectiveOwned<T>(Rc<PerspectiveOwnedSession<T>>)
where
    T: AsyncDelete + JsCast + 'static;

/// An owned `JsPerspectiveView` which calls its JavaScript `delete()` method
/// when this struct is `drop()`-ed.
pub type View = PerspectiveOwned<JsPerspectiveView>;

/// `<perspective-viewer>` does not currently take ownership of `Table`. objects
/// so this is not currently needed, but it will be in the future and this
/// polymorphism is the motiviation behind the `PerspectiveOwned<T>` type.
#[allow(dead_code)]
pub type Table = PerspectiveOwned<JsPerspectiveTable>;

impl<T> PerspectiveOwned<T>
where
    T: AsyncDelete + JsCast + 'static,
{
    /// Take ownership of a `T` and construct a `PerspectiveOwned<T>`.
    pub fn new(obj: T) -> Self {
        Self(Rc::new(PerspectiveOwnedSession(obj)))
    }

    /// Get a reference to the owned object as a `JsValue`, which is necessary
    /// to pass it back to other JavaScript APIs.
    pub fn as_jsvalue(&self) -> JsValue {
        self.0 .0.as_ref().unchecked_ref::<JsValue>().clone()
    }

    /// Typically we don't want to clone `T` because it defeats the purpose of
    /// this RAII wrapper;  however, in the singular case of returning a
    /// JavaScript reference to a JavaScript API call, it is necessary.
    /// The `JsPerspectiveView` returned is not `delete()`ed when destructed.
    ///
    /// We use this slighly awkward mechanism to clone `JsPerspectiveView`,
    /// rather than jsut deriving `Clone`, because we don't want `.clone()`
    /// itself to be public, as this method should only be called to return
    /// a `JsPerspectiveView` copy to a JavaScript call.
    pub fn js_get(&self) -> T {
        self.as_jsvalue().unchecked_into::<T>()
    }
}

impl<T> Deref for PerspectiveOwned<T>
where
    T: AsyncDelete + JsCast + 'static,
{
    type Target = T;

    /// `Deref` allows library users to use a `PerspectiveOwned<T>` just like a
    /// `T` in most cases.
    fn deref(&self) -> &Self::Target {
        &self.0 .0
    }
}

/// `PerspectiveOwnedSession<T>` is a newtype wrapper for implementing `Drop`.
/// Alternatively, we could just implement `Drop` directly on
/// `JsPerspectiveView` and `JsPerspectiveTable`.
struct PerspectiveOwnedSession<T: AsyncDelete + JsCast + 'static>(T);

#[async_trait(?Send)]
impl<T: AsyncDelete + JsCast + 'static> Drop for PerspectiveOwnedSession<T> {
    fn drop(&mut self) {
        let obj = self
            .0
            .unchecked_ref::<JsValue>()
            .clone()
            .unchecked_into::<T>();

        spawn_local(async move {
            obj.delete()
                .await
                .expect("Failed to delete perspective object");
        });
    }
}

#[async_trait(?Send)]
pub trait AsyncDelete {
    async fn delete(self) -> ApiResult<JsValue>;
}

#[async_trait(?Send)]
impl AsyncDelete for JsPerspectiveView {
    async fn delete(self) -> ApiResult<JsValue> {
        self.delete().await?;
        Ok(JsValue::UNDEFINED)
    }
}

#[async_trait(?Send)]
impl AsyncDelete for JsPerspectiveTable {
    async fn delete(self) -> ApiResult<JsValue> {
        self.delete().await?;
        Ok(JsValue::UNDEFINED)
    }
}
