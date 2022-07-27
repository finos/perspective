////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::export_app;
use super::export_method::*;
use super::get_viewer_config::*;
use super::structural::*;
use crate::config::*;
use crate::js::JsPerspectiveViewerPlugin;
use crate::utils::*;

use futures::join;
use itertools::Itertools;
use js_intern::*;
use std::collections::HashSet;
use std::future::Future;
use std::pin::Pin;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;

fn tag_name_to_package(plugin: &JsPerspectiveViewerPlugin) -> String {
    let tag_name = plugin.unchecked_ref::<web_sys::HtmlElement>().tag_name();
    let tag_parts = tag_name.split('-').take(3).map(|x| x.to_lowercase());
    Itertools::intersperse(tag_parts, "-".to_owned()).collect::<String>()
}

/// Export functionality, for downloads and copy-to-clipboard, are mostly shared
/// behavior, but require access to a few state objects depending on which
/// format is desired.  The `CopyExportModel` groups this functionality in a
/// shared location, rather than distributing in the various state objects
/// that are relevent per-format.
pub trait CopyExportModel: HasSession + HasRenderer + HasTheme + GetViewerConfigModel {
    fn html_as_jsvalue(&self) -> Pin<Box<dyn Future<Output = Result<web_sys::Blob, JsValue>>>> {
        let view_config = self.get_viewer_config();
        let session = self.session().clone();
        let plugins = self
            .renderer()
            .get_all_plugins()
            .iter()
            .map(tag_name_to_package)
            .collect::<HashSet<String>>()
            .into_iter()
            .collect::<Vec<_>>();

        Box::pin(async move {
            let (arrow, config) = join!(session.arrow_as_vec(true), view_config);
            let arrow = arrow?;
            let mut config = config?;
            config.settings = false;
            let js_config = serde_json::to_string(&config).into_jserror()?;
            let html = export_app::render(&base64::encode(arrow), &js_config, &plugins);
            js_sys::JsString::from(html.trim()).as_blob()
        })
    }

    /// Create a blob of this plugin's `.png` rendering by calling the
    /// `Plugin::render` method dynamically (as it may not exist e.g. for
    /// datagrid).
    ///
    /// # Errors
    ///
    /// It is assumed that `Plugin::render` exists on the plugin's Custom
    /// Element.
    fn png_as_jsvalue(&self) -> Pin<Box<dyn Future<Output = Result<web_sys::Blob, JsValue>>>> {
        let renderer = self.renderer().clone();
        Box::pin(async move {
            let plugin = renderer.get_active_plugin()?;
            let render = js_sys::Reflect::get(&plugin, js_intern!("render"))?;
            let render_fun = render.unchecked_into::<js_sys::Function>();
            let png = render_fun.call0(&plugin)?;
            let result = JsFuture::from(png.unchecked_into::<js_sys::Promise>())
                .await?
                .unchecked_into();
            Ok(result)
        })
    }

    /// Generate a result `Blob` for all types of `ExportMethod`.
    fn export_method_to_jsvalue(
        &self,
        method: ExportMethod,
    ) -> Pin<Box<dyn Future<Output = Result<web_sys::Blob, JsValue>>>> {
        match method {
            ExportMethod::Csv => {
                let session = self.session().clone();
                Box::pin(async move { session.csv_as_jsvalue(false).await?.as_blob() })
            }
            ExportMethod::CsvAll => {
                let session = self.session().clone();
                Box::pin(async move { session.csv_as_jsvalue(true).await?.as_blob() })
            }
            ExportMethod::Json => {
                let session = self.session().clone();
                Box::pin(async move { session.json_as_jsvalue(false).await?.as_blob() })
            }
            ExportMethod::JsonAll => {
                let session = self.session().clone();
                Box::pin(async move { session.json_as_jsvalue(true).await?.as_blob() })
            }
            ExportMethod::Arrow => {
                let session = self.session().clone();
                Box::pin(async move { session.arrow_as_jsvalue(false).await?.as_blob() })
            }
            ExportMethod::ArrowAll => {
                let session = self.session().clone();
                Box::pin(async move { session.arrow_as_jsvalue(true).await?.as_blob() })
            }
            ExportMethod::Html => {
                let html_task = self.html_as_jsvalue();
                Box::pin(async move { html_task.await })
            }
            ExportMethod::Png => {
                let png_task = self.png_as_jsvalue();
                Box::pin(async move { png_task.await })
            }
            ExportMethod::JsonConfig => {
                let config_task = self.get_viewer_config();
                Box::pin(async move {
                    config_task
                        .await?
                        .encode(&Some(ViewerConfigEncoding::JSONString))?
                        .dyn_into::<js_sys::JsString>()?
                        .as_blob()
                })
            }
        }
    }
}

impl<T: HasRenderer + HasSession + HasTheme> CopyExportModel for T {}
