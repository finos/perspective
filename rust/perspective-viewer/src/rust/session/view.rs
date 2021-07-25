////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js::perspective::*;

use async_trait::async_trait;
use derivative::Derivative;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;

/// `PerspectiveOwned` is a newtype-ed `Rc` smart pointer which guarantees either a
/// `JsPerspectiveView` or `JsPerspectiveTable` will have its `.delete()` method
/// called when it is dropped.
#[derive(Derivative)]
#[derivative(Clone(bound = ""))]
pub struct PerspectiveOwned<T>(Rc<PerspectiveOwnedSession<T>>)
where
    T: AsyncDelete + 'static;

/// An owned `JsPerspectiveView` which calls its JavaScript `delete()` method when
/// this struct is `drop()`-ed.
pub type View = PerspectiveOwned<JsPerspectiveView>;

/// `<perspective-viewer>` does not currently take ownership of `Table`. objects
/// so this is not currently needed, but it will be in the future and this polymorphism
/// is th emotiviation behind the `PerspectiveOwned<T>` type.
#[allow(dead_code)]
pub type Table = PerspectiveOwned<JsPerspectiveTable>;

impl<T> PerspectiveOwned<T>
where
    T: AsyncDelete + 'static + JsCast,
{
    /// Take ownership of a `T` and construct a `PerspectiveOwned<T>`.
    pub fn new(obj: T) -> PerspectiveOwned<T> {
        PerspectiveOwned(Rc::new(PerspectiveOwnedSession(Some(obj))))
    }

    /// Get a reference to the owned object as a `JsValue`, which is necessary to
    /// pass it back to other JavaScript APIs.
    pub fn as_jsvalue(&self) -> JsValue {
        self.0
             .0
            .as_ref()
            .unwrap()
            .unchecked_ref::<JsValue>()
            .clone()
    }
}

impl<T> Deref for PerspectiveOwned<T>
where
    T: AsyncDelete + 'static,
{
    type Target = T;

    /// `Deref` allows library users to use a `PerspectiveOwned<T>` just like a
    /// `T` in most cases.
    fn deref(&self) -> &Self::Target {
        self.0 .0.as_ref().unwrap()
    }
}

/// `PerspectiveOwnedSession<T>` is a newtype wrapper for implementing `Drop`.
/// Alternatively, we could just implement `Drop` directly on `JsPerspectiveView` and
/// `JsPerspectiveTable`.
struct PerspectiveOwnedSession<T: AsyncDelete + 'static>(Option<T>);

#[async_trait(?Send)]
impl<T: AsyncDelete + 'static> Drop for PerspectiveOwnedSession<T> {
    fn drop(&mut self) {
        let obj = self.0.take().unwrap();
        spawn_local(async move {
            obj.delete()
                .await
                .expect("Failed to delete perspective object");
        });
    }
}

#[async_trait(?Send)]
pub trait AsyncDelete {
    async fn delete(self) -> Result<JsValue, JsValue>;
}

#[async_trait(?Send)]
impl AsyncDelete for JsPerspectiveView {
    async fn delete(self) -> Result<JsValue, JsValue> {
        self.delete().await?;
        Ok(JsValue::UNDEFINED)
    }
}

#[async_trait(?Send)]
impl AsyncDelete for JsPerspectiveTable {
    async fn delete(self) -> Result<JsValue, JsValue> {
        self.delete().await?;
        Ok(JsValue::UNDEFINED)
    }
}
