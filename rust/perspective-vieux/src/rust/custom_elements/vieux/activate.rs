////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js::perspective_viewer::PerspectiveViewerJsPlugin;

use std::future::Future;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;

/// Given an async `task` which draws `plugin`, activates the plugin in stages
/// to prevent screen shearing.  First, and plugin is appended ot the DOM with
/// opacity 0, then rendered.  After rendering, the previous plugin is removed
/// and the opacity is set back to 1.
///
/// # Arguments
/// - `elem` the root `<perspective-vieux>` element.
/// - `plugin` the plugin custom element.
/// - `task` an async task which renders the plugin.
pub async fn activate_plugin(
    elem: &HtmlElement,
    plugin: &PerspectiveViewerJsPlugin,
    task: impl Future<Output = Result<JsValue, JsValue>>,
) -> Result<JsValue, JsValue> {
    let elem = elem.parent_node().unwrap();
    let viewer = elem
        .get_root_node()
        .unchecked_into::<web_sys::ShadowRoot>()
        .host();

    let html_plugin = plugin.unchecked_ref::<HtmlElement>();
    if html_plugin.parent_node().is_none() {
        html_plugin.style().set_property("opacity", "0")?;
        viewer.append_child(html_plugin)?;
    }

    let result = task.await;
    let first_child = viewer.children().item(0).unwrap();
    if first_child != *plugin.unchecked_ref::<Element>() {
        viewer.remove_child(&first_child)?;
    }

    html_plugin.style().set_property("opacity", "1")?;
    result
}
