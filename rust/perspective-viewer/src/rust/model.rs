////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod columns_iter_set;

pub use self::columns_iter_set::*;

use crate::config::*;
use crate::dragdrop::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use std::future::Future;
use std::pin::Pin;
use wasm_bindgen::prelude::*;
use yew::prelude::*;

/// A `SessionRendererModel` is any struct with `session` and `renderer` fields, as
/// this method is boilerplate but has no other trait to live on currently.  As
/// I'm too lazy to be bothered to implement a `proc-macro` crate, instead this
/// trait can be conveniently derived via the `derive_session_renderer_model!()` macro
/// on a suitable struct.
pub trait SessionRendererModel {
    fn session(&self) -> &'_ Session;
    fn renderer(&self) -> &'_ Renderer;

    fn update_and_render(&self, update: crate::config::ViewConfigUpdate) {
        self.session().update_view_config(update);
        let session = self.session().clone();
        let renderer = self.renderer().clone();
        let _ = promisify_ignore_view_delete(async move {
            let view = session.validate().await;
            drop(renderer.draw(view.create_view()).await?);
            Ok(JsValue::UNDEFINED)
        });
    }

    fn render_callback(&self) -> Callback<()> {
        let session = self.session().clone();
        let renderer = self.renderer().clone();
        Callback::from(move |_| {
            let session = session.clone();
            let renderer = renderer.clone();
            drop(promisify_ignore_view_delete(async move {
                drop(renderer.draw(async { Ok(&session) }).await?);
                Ok(JsValue::UNDEFINED)
            }))
        })
    }

    fn render(&self) {
        let session = self.session().clone();
        let renderer = self.renderer().clone();
        let _ = promisify_ignore_view_delete(async move {
            drop(renderer.draw(async { Ok(&session) }).await?);
            Ok(JsValue::UNDEFINED)
        });
    }

    fn get_viewer_config(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<ViewerConfig, JsValue>>>> {
        let view_config = self.session().get_view_config();
        let js_plugin = self.renderer().get_active_plugin();
        let renderer = self.renderer().clone();
        Box::pin(async move {
            let settings = renderer.is_settings_open();
            let js_plugin = js_plugin?;
            let plugin = js_plugin.name();
            let plugin_config = js_plugin
                .save()
                .into_serde::<serde_json::Value>()
                .into_jserror()?;

            let theme = renderer.get_theme_name().await;
            Ok(ViewerConfig {
                plugin,
                plugin_config,
                settings,
                view_config,
                theme,
            })
        })
    }
}

#[macro_export]
macro_rules! derive_session_renderer_model {
    ($key:ty) => {
        impl crate::model::SessionRendererModel for $key {
            fn session(&self) -> &'_ Session {
                &self.session
            }

            fn renderer(&self) -> &'_ Renderer {
                &self.renderer
            }
        }
    };
}

pub trait ViewerModel: SessionRendererModel {
    fn dragdrop(&self) -> &'_ DragDrop;

    fn column_selector_iter_set<'a>(
        &'a self,
        config: &'a ViewConfig,
    ) -> ColumnsIteratorSet<'a> {
        ColumnsIteratorSet::new(
            config,
            self.session(),
            self.renderer(),
            self.dragdrop(),
        )
    }
}

#[macro_export]
macro_rules! derive_viewer_model {
    ($key:ty) => {
        derive_session_renderer_model!($key);
        impl crate::model::ViewerModel for $key {
            fn dragdrop(&self) -> &'_ DragDrop {
                &self.dragdrop
            }
        }
    };
}
