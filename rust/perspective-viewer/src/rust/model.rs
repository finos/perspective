////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod columns_iter_set;
mod export_method;

pub use self::columns_iter_set::*;
pub use self::export_method::*;
use crate::config::*;
use crate::dragdrop::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use futures::join;
use js_intern::*;
use std::future::Future;
use std::pin::Pin;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
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

    fn html_as_jsvalue(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<web_sys::Blob, JsValue>>>> {
        let view_config = self.get_viewer_config();
        let session = self.session().clone();
        Box::pin(async move {
            let (arrow, config) = join!(session.get_table_arrow(), view_config);
            let arrow = arrow?;
            let mut config = config?;
            config.settings = false;
            let js_config = serde_json::to_string(&config).into_jserror()?;
            let html = JsValue::from(format!("<!DOCTYPE html lang=\"en\">
<html>
<head>
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no\"/>
<link rel=\"stylesheet\" crossorigin=\"anonymous\" href=\"https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@vlatest/dist/css/themes.css\"/>
<script type=\"module\">
import perspective from \"https://cdn.jsdelivr.net/npm/@finos/perspective@vlatest/dist/cdn/perspective.js\";
import \"https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@vlatest/dist/cdn/perspective-viewer.js\";
import \"https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@vlatest/dist/cdn/perspective-viewer-datagrid.js\";
import \"https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@vlatest/dist/cdn/perspective-viewer-d3fc.js\";
const worker = perspective.worker();
const binary_string = window.atob(window.data.textContent);
const len = binary_string.length;
const bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) {{
bytes[i] = binary_string.charCodeAt(i);
}}
window.viewer.load(worker.table(bytes.buffer));
window.viewer.restore(JSON.parse(window.layout.textContent));
</script>
<style>perspective-viewer{{position:absolute;top:0;left:0;right:0;bottom:0}}</style>
</head>
<body>
<script id='data' type=\"application/octet-stream\">{}</script>
<script id='layout' type=\"application/json\">{}</script>
<perspective-viewer id='viewer'></perspective-viewer>
</body>
</html>
", base64::encode(arrow), js_config));
            let array = [html].iter().collect::<js_sys::Array>();
            Ok(web_sys::Blob::new_with_u8_array_sequence(&array)?)
        })
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

    fn config_as_jsvalue(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<web_sys::Blob, JsValue>>>> {
        let viewer_config = self.get_viewer_config();
        Box::pin(async move {
            let config = viewer_config
                .await?
                .encode(&Some(ViewerConfigEncoding::JSONString))?;
            let array = [config].iter().collect::<js_sys::Array>();
            let mut options = web_sys::BlobPropertyBag::new();
            options.type_("text/plain");
            web_sys::Blob::new_with_str_sequence_and_options(&array, &options)
        })
    }

    fn export_method_to_jsvalue(
        &self,
        method: ExportMethod,
    ) -> Pin<Box<dyn Future<Output = Result<web_sys::Blob, JsValue>>>> {
        match method {
            ExportMethod::Csv => {
                let session = self.session().clone();
                Box::pin(async move { session.csv_as_jsvalue(false).await })
            }
            ExportMethod::CsvAll => {
                let session = self.session().clone();
                Box::pin(async move { session.csv_as_jsvalue(true).await })
            }
            ExportMethod::Json => {
                let session = self.session().clone();
                Box::pin(async move { session.json_as_jsvalue(false).await })
            }
            ExportMethod::JsonAll => {
                let session = self.session().clone();
                Box::pin(async move { session.json_as_jsvalue(true).await })
            }
            ExportMethod::Arrow => {
                let session = self.session().clone();
                Box::pin(async move { session.arrow_as_jsvalue(false).await })
            }
            ExportMethod::ArrowAll => {
                let session = self.session().clone();
                Box::pin(async move { session.arrow_as_jsvalue(true).await })
            }
            ExportMethod::Html => {
                let html_task = self.html_as_jsvalue();
                Box::pin(async move { html_task.await })
            }
            ExportMethod::Png => {
                let renderer = self.renderer().clone();
                Box::pin(async move {
                    let plugin = renderer.get_active_plugin()?;
                    let render = js_sys::Reflect::get(&plugin, js_intern!("render"))?;
                    let render_fun = render.unchecked_into::<js_sys::Function>();
                    let png = render_fun.call0(&plugin)?;
                    let result =
                        JsFuture::from(png.unchecked_into::<js_sys::Promise>())
                            .await?
                            .unchecked_into();
                    Ok(result)
                })
            }
            ExportMethod::JsonConfig => {
                let config_task = self.config_as_jsvalue();
                Box::pin(async move { config_task.await })
            }
        }
    }
}

impl crate::model::SessionRendererModel for (&Session, &Renderer) {
    fn session(&self) -> &'_ Session {
        self.0
    }

    fn renderer(&self) -> &'_ Renderer {
        self.1
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
