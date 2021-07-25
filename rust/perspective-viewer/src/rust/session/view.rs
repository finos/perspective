////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js::perspective::*;

use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;

/// `View` is a newtype-ed `Rc` smart pointer which guarantees `JsPerspectiveView`
/// will have its `.delete()` method called when it is dropped.
#[derive(Clone)]
pub struct View(Rc<ViewSession>);

impl Deref for View {
    type Target = JsPerspectiveView;
    fn deref(&self) -> &Self::Target {
        &self.0 .0
    }
}

impl View {
    pub fn new(view: JsPerspectiveView) -> View {
        View(Rc::new(ViewSession(view)))
    }

    pub fn as_jsvalue(&self) -> JsValue {
        self.0 .0.clone().unchecked_into::<JsValue>()
    }
}

struct ViewSession(JsPerspectiveView);

impl Drop for ViewSession {
    fn drop(&mut self) {
        let view = self.0.clone().unchecked_into::<JsPerspectiveView>();
        spawn_local(async move {
            view.delete().await.expect("Failed to delete View");
        });
    }
}
