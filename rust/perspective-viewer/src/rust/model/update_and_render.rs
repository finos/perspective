////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.der;

use super::structural::*;
use crate::utils::*;
use crate::*;

use wasm_bindgen::prelude::*;
use yew::prelude::*;

/// While `Renderer` manages the plugin and thus the render call itself, the
/// current `View` is handled by the `Session` which must be validated and
/// locked while drawing is in progress.  `UpdateAndRender` provides methods
/// that synchronize this behavior, so these methods should be used to initiate
/// rendering of the current `Plugin` and `View`.
pub trait UpdateAndRender: HasRenderer + HasSession {
    /// Create a `Callback` that renders from the current `View` and `Plugin`.
    fn render_callback(&self) -> Callback<()> {
        clone!(self.session(), self.renderer());
        Callback::from(move |_| {
            clone!(session, renderer);
            drop(promisify_ignore_view_delete(async move {
                drop(renderer.draw(async { Ok(&session) }).await?);
                Ok(JsValue::UNDEFINED)
            }))
        })
    }

    /// Apply a `ViewConfigUpdate` to the current `View` and render.
    fn update_and_render(&self, update: crate::config::ViewConfigUpdate) {
        self.session().update_view_config(update);
        clone!(self.session(), self.renderer());
        let _ = promisify_ignore_view_delete(async move {
            let view = session.validate().await?;
            drop(renderer.draw(view.create_view()).await?);
            Ok(JsValue::UNDEFINED)
        });
    }
}

impl<T: HasRenderer + HasSession> UpdateAndRender for T {}
