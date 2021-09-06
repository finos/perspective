////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;

use serde::*;
use wasm_bindgen::prelude::*;

use super::perspective::JsPerspectiveView;

/// Perspective FFI
#[wasm_bindgen(inline_js = "

    class DebugPlugin extends HTMLElement {
        constructor() {
            super();
        }

        get name() {
            return 'Debug';
        }

        get select_mode() {
            return 'select';
        }

        get min_config_columns() {
            return undefined;
        }

        get config_column_names() {
            return undefined;
        }

        update(...args) {
            return this.draw(...args);
        }

        async draw(view) {
            this.style.backgroundColor = '#fff';
            let perspective_viewer = this.parentElement;
            const csv = await view.to_csv({config: {delimiter: '|'}});
            const css = `margin:0;overflow:scroll;position:absolute;width:100%;height:100%`;
            this.innerHTML = `<pre style='${css}'>${csv}</pre>`;
        }

        async clear() {
            this.innerHtml = '';
        }

        async resize() {}

        async restyle() {}

        save() {}

        restore() {}

        delete() {}
    }

    export function register_default_plugin_web_component() {
        if (!window.__test_plugin__) {
            window.__test_plugin__ = true;
            customElements.define('perspective-viewer-debug', DebugPlugin);
        }
    }
        

")]
#[rustfmt::skip]
extern "C" {

    #[wasm_bindgen(js_name = "register_default_plugin_web_component", catch)]
    pub fn register_default_plugin_web_component() -> Result<(), JsValue>;

    #[derive(Clone)]
    pub type JsPerspectiveViewerPlugin;

    #[wasm_bindgen(method, getter)]
    pub fn name(this: &JsPerspectiveViewerPlugin) -> String;

    #[wasm_bindgen(method, getter)]
    pub fn max_columns(this: &JsPerspectiveViewerPlugin) -> Option<usize>;

    #[wasm_bindgen(method, getter)]
    pub fn max_cells(this: &JsPerspectiveViewerPlugin) -> Option<usize>;

    // TODO This can be an internal property
    #[wasm_bindgen(method, getter)]
    pub fn render_warning(this: &JsPerspectiveViewerPlugin) -> Option<bool>;

    #[wasm_bindgen(method, setter)]
    pub fn set_render_warning(this: &JsPerspectiveViewerPlugin, val: bool);

    #[wasm_bindgen(method, getter)]
    pub fn select_mode(this: &JsPerspectiveViewerPlugin) -> JsValue;

    #[wasm_bindgen(method, getter)]
    pub fn min_config_columns(this: &JsPerspectiveViewerPlugin) -> Option<usize>;

    #[wasm_bindgen(method, getter)]
    pub fn config_column_names(this: &JsPerspectiveViewerPlugin) -> Option<js_sys::Array>;

    #[wasm_bindgen(method)]
    pub fn save(this: &JsPerspectiveViewerPlugin) -> JsValue;

    #[wasm_bindgen(method)]
    pub fn restore(this: &JsPerspectiveViewerPlugin, token: &JsValue);

    #[wasm_bindgen(method)]
    pub fn delete(this: &JsPerspectiveViewerPlugin);

    #[wasm_bindgen(method, catch)]
    pub async fn restyle(
        this: &JsPerspectiveViewerPlugin, 
        view: &JsPerspectiveView
    ) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn draw(
        this: &JsPerspectiveViewerPlugin,
        view: &JsPerspectiveView,
        column_limit: Option<usize>,
        row_limit: Option<usize>,
        force: bool
    ) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn update(
        this: &JsPerspectiveViewerPlugin,
        view: &JsPerspectiveView,
        column_limit: Option<usize>,
        row_limit: Option<usize>,
        force: bool
    ) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn clear(this: &JsPerspectiveViewerPlugin) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn resize(this: &JsPerspectiveViewerPlugin) -> Result<JsValue, JsValue>;
}

#[derive(Clone, Copy, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ColumnSelectMode {
    Toggle,
    Select,
}

impl Default for ColumnSelectMode {
    fn default() -> Self {
        ColumnSelectMode::Toggle
    }
}

#[derive(Debug, Clone, Default)]
pub struct ViewConfigRequirements {
    pub min: Option<usize>,
    pub names: Option<Vec<String>>,
    pub mode: ColumnSelectMode,
    pub max_columns: Option<usize>,
    pub max_cells: Option<usize>,
    pub name: String,
    pub render_warning: bool,
}

impl ViewConfigRequirements {
    pub fn is_swap(&self, index: usize) -> bool {
        self.names
            .as_ref()
            .map(|x| index < x.len() - 1)
            .unwrap_or(false)
    }
}

impl JsPerspectiveViewerPlugin {
    pub fn get_requirements(&self) -> Result<ViewConfigRequirements, JsValue> {
        Ok(ViewConfigRequirements {
            min: self.min_config_columns(),
            mode: self
                .select_mode()
                .into_serde::<ColumnSelectMode>()
                .into_jserror()?,
            names: self
                .config_column_names()
                .map(|x| x.into_serde::<Vec<String>>().unwrap()),
            max_columns: self.max_columns(),
            max_cells: self.max_cells(),
            name: self.name(),
            render_warning: self.render_warning().unwrap_or(true),
        })
    }
}
