////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

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

        get selectMode() {
            return 'toggle';
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

        save() {}

        restore() {}
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
    pub type JsPerspectiveViewer;

    #[wasm_bindgen(method, catch)]
    pub fn _update_column_view(this: &JsPerspectiveViewer) -> Result<(), JsValue>;

    #[wasm_bindgen(method, catch)]
    pub fn _set_row_styles(this: &JsPerspectiveViewer) -> Result<(), JsValue>;

    #[wasm_bindgen(method, catch)]
    pub fn _set_column_defaults(this: &JsPerspectiveViewer) -> Result<(), JsValue>;

    #[derive(Clone)]
    pub type JsPerspectiveViewerPlugin;

    #[wasm_bindgen(method, getter)]
    pub fn name(this: &JsPerspectiveViewerPlugin) -> String;

    #[wasm_bindgen(method, getter)]
    pub fn max_columns(this: &JsPerspectiveViewerPlugin) -> Option<usize>;

    #[wasm_bindgen(method, getter)]
    pub fn max_cells(this: &JsPerspectiveViewerPlugin) -> Option<usize>;

    #[wasm_bindgen(method, getter)]
    pub fn render_warning(this: &JsPerspectiveViewerPlugin) -> Option<bool>;

    #[wasm_bindgen(method, setter)]
    pub fn set_render_warning(this: &JsPerspectiveViewerPlugin, val: bool);

    #[wasm_bindgen(method)]
    pub fn save(this: &JsPerspectiveViewerPlugin) -> JsValue;

    #[wasm_bindgen(method)]
    pub fn restore(this: &JsPerspectiveViewerPlugin, token: &JsValue);

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

impl JsPerspectiveViewer {
    pub fn get_dimensions(&self) -> (String, String) {
        let width = self.unchecked_ref::<web_sys::HtmlElement>().client_width();
        let height = self.unchecked_ref::<web_sys::HtmlElement>().client_height();
        (format!("{}px", width), format!("{}px", height))
    }
}
