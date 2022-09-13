////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

// Required by yew's `html` macro.
#![recursion_limit = "1024"]
#![feature(const_type_name)]
#![feature(macro_metavar_expr)]
#![warn(
    clippy::all,
    clippy::panic_in_result_fn,
    clippy::await_holding_refcell_ref
)]

mod components;
pub mod config;
pub mod custom_elements;
mod custom_events;
mod dragdrop;
mod exprtk;
mod js;
mod model;
mod renderer;
mod session;
mod theme;
pub mod utils;

use crate::custom_elements::copy_dropdown::CopyDropDownMenuElement;
use crate::custom_elements::date_column_style::PerspectiveDateColumnStyleElement;
use crate::custom_elements::datetime_column_style::PerspectiveDatetimeColumnStyleElement;
use crate::custom_elements::export_dropdown::ExportDropDownMenuElement;
use crate::custom_elements::number_column_style::PerspectiveNumberColumnStyleElement;
use crate::custom_elements::string_column_style::PerspectiveStringColumnStyleElement;
use crate::custom_elements::viewer::PerspectiveViewerElement;

use crate::utils::define_web_component;
use crate::utils::ApiResult;
use wasm_bindgen::prelude::*;

#[cfg(feature = "define_custom_elements_async")]
pub use components::{LocalStyle, StyleProvider};

/// Register a plugin globally.
#[wasm_bindgen(js_name = "registerPlugin")]
pub fn register_plugin(name: &str) {
    use crate::renderer::*;
    PLUGIN_REGISTRY.register_plugin(name);
}

/// Export all ExprTK commands, for use in generating documentation.
#[wasm_bindgen(js_name = "getExprTKCommands")]
pub fn get_exprtk_commands() -> ApiResult<Box<[JsValue]>> {
    crate::exprtk::COMPLETIONS.with(|x| {
        Ok(x.iter()
            .map(JsValue::from_serde)
            .collect::<Result<Box<[_]>, serde_json::Error>>()?)
    })
}

/// Register this crate's Custom Elements in the browser's current session.
/// This must occur before calling any public API methods on these Custom
/// Elements from JavaScript, as the methods themselves won't be defined yet.
/// By default, this crate does not register `PerspectiveViewerElement` (as to
/// preserve backwards-compatible synchronous API).
#[cfg(not(test))]
#[cfg(not(feature = "define_custom_elements_async"))]
#[wasm_bindgen(js_name = "defineWebComponents")]
pub fn js_define_web_components() {
    tracing_wasm::set_as_global_default();
    define_web_components!(
        "export * as psp from '@finos/perspective-viewer/dist/pkg/perspective.js'"
    );
}

/// Register Web Components with the global registry, given a Perspective
/// module.  This function shouldn't be called directly;  instead, use the
/// `define_web_components!` macro to both call this method and hook the
/// wasm_bindgen module object.
pub fn bootstrap_web_components(psp: &JsValue) {
    if cfg!(feature = "define_custom_elements_async") {
        define_web_component::<PerspectiveViewerElement>(psp);
    }

    define_web_component::<PerspectiveDateColumnStyleElement>(psp);
    define_web_component::<PerspectiveDatetimeColumnStyleElement>(psp);
    define_web_component::<PerspectiveStringColumnStyleElement>(psp);
    define_web_component::<PerspectiveNumberColumnStyleElement>(psp);
    define_web_component::<ExportDropDownMenuElement>(psp);
    define_web_component::<CopyDropDownMenuElement>(psp);
}

#[macro_export]
macro_rules! define_web_components {
    (@prelude $x:expr) => {{
        #[wasm_bindgen::prelude::wasm_bindgen(inline_js = $x)]
        extern "C" {
            #[wasm_bindgen::prelude::wasm_bindgen(js_name = "psp")]
            pub static PSP: wasm_bindgen::prelude::JsValue;
        }

        &PSP
    }};
    (@custom_elements $psp:expr) => {{
        $crate::bootstrap_web_components($psp);
    }};
    ($x:expr) => {{
        let psp = $crate::define_web_components!(@prelude $x);
        $crate::define_web_components!(@custom_elements psp);
    }};
}
