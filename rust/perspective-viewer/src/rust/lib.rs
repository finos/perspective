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

// Required by yew's `html` macro.
#![recursion_limit = "1024"]
#![feature(const_type_name)]
#![feature(lazy_cell)]
#![feature(macro_metavar_expr)]
#![feature(let_chains)]
#![feature(stmt_expr_attributes)]
#![warn(
    clippy::all,
    clippy::panic_in_result_fn,
    clippy::await_holding_refcell_ref
)]

pub mod components;
pub mod config;
pub mod custom_elements;
mod custom_events;
mod dragdrop;
mod exprtk;
mod js;
mod model;
mod presentation;
mod renderer;
mod session;
pub mod utils;

use utils::JsValueSerdeExt;
use wasm_bindgen::prelude::*;

use crate::utils::ApiResult;

/// Register a plugin globally.
#[wasm_bindgen(js_name = "registerPlugin")]
pub fn register_plugin(name: &str) {
    use crate::renderer::*;
    PLUGIN_REGISTRY.register_plugin(name);
}

/// Initialize process-wide state, must be called before any other methods
/// after WebAssembly compilation.
#[wasm_bindgen(js_name = "init")]
pub fn init() {
    crate::utils::set_global_logging();
}

/// Export all ExprTK commands, for use in generating documentation.
#[wasm_bindgen(js_name = "getExprTKCommands")]
pub fn get_exprtk_commands() -> ApiResult<Box<[JsValue]>> {
    crate::exprtk::COMPLETIONS.with(|x| {
        Ok(x.iter()
            .map(<JsValue as JsValueSerdeExt>::from_serde_ext)
            .collect::<Result<Box<[_]>, serde_wasm_bindgen::Error>>()?)
    })
}

/// Register this crate's Custom Elements in the browser's current session.
/// This must occur before calling any public API methods on these Custom
/// Elements from JavaScript, as the methods themselves won't be defined yet.
/// This macro is provided for bootstrapping the `perspectve` crate when used
/// as a dependency in another Rust crate; there is no need to call this
/// function for disting directly to JavaScript, as we recreate this logic
/// in TypeScript to make sure the custom element is defined before the
/// WebAssembly is asynchronously loaded.
#[macro_export]
macro_rules! define_web_components {
    ($x:expr) => {{
        use wasm_bindgen::prelude::{wasm_bindge, JsValue};
        use $crate::custom_elements::viewer::PerspectiveViewerElement;
        use $crate::utils::define_web_component;

        #[wasm_bindgen(inline_js = $x)]
        extern "C" {
            #[wasm_bindgen(js_name = "psp")]
            static PSP: JsValue;
        }

        define_web_component::<PerspectiveViewerElement>(PSP);
    }};
}
