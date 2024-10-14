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
#![feature(let_chains)]
#![feature(macro_metavar_expr)]
#![feature(iter_intersperse)]
#![feature(stmt_expr_attributes)]
#![warn(
    clippy::all,
    clippy::panic_in_result_fn,
    clippy::await_holding_refcell_ref
)]
#![doc = include_str!("../../docs/viewer.md")]

pub mod components;
pub mod config;
pub mod custom_elements;
mod custom_events;
mod dragdrop;
pub mod exprtk;
mod js;

#[doc(hidden)]
pub mod model;
mod presentation;
mod renderer;
mod session;
pub mod utils;

use perspective_js::utils::*;
use wasm_bindgen::prelude::*;

use crate::custom_elements::copy_dropdown::CopyDropDownMenuElement;
use crate::custom_elements::debug_plugin::PerspectiveDebugPluginElement;
use crate::custom_elements::export_dropdown::ExportDropDownMenuElement;
use crate::custom_elements::viewer::PerspectiveViewerElement;
use crate::utils::define_web_component;

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
import type * as perspective from "../../dist/pkg/ViewConfigUpdate.ts";
"#;

/// Register a plugin globally.
#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn registerPlugin(name: &str) {
    use crate::renderer::*;
    PLUGIN_REGISTRY.register_plugin(name);
}

// // #[cfg(feature = "metadata")]
// #[wasm_bindgen(js_name = "getTypes")]
// pub fn generate_type_bindings() -> String {
//     use perspective_js::generate_type_bindings;
//     use specta::ts;
//     use specta::ts::ExportConfig;
//     let mut parts = vec![];
//     let config = ExportConfig::default();
//     use config::*;

//     parts.push(ts::export::<CompactDisplay>(&config).unwrap());
//     parts.push(ts::export::<NumberBackgroundMode>(&config).unwrap());
//     parts.push(ts::export::<NumberForegroundMode>(&config).unwrap());
//     parts.push(ts::export::<CurrencySign>(&config).unwrap());
//     parts.push(ts::export::<CurrencyDisplay>(&config).unwrap());
//     parts.push(ts::export::<CurrencyCode>(&config).unwrap());
//     parts.push(ts::export::<UnitDisplay>(&config).unwrap());
//     parts.push(ts::export::<Unit>(&config).unwrap());
//     parts.push(ts::export::<SignDisplay>(&config).unwrap());
//     parts.push(ts::export::<UseGrouping>(&config).unwrap());
//     parts.push(ts::export::<RoundingPriority>(&config).unwrap());
//     parts.push(ts::export::<RoundingMode>(&config).unwrap());
//     parts.push(ts::export::<TrailingZeroDisplay>(&config).unwrap());
//     parts.push(ts::export::<SimpleDatetimeStyleConfig>(&config).unwrap());
//     parts.push(ts::export::<SimpleDatetimeFormat>(&config).unwrap());
//     parts.push(ts::export::<CustomDatetimeStyleConfig>(&config).unwrap());
//     parts.push(ts::export::<FormatUnit>(&config).unwrap());
//     parts.push(ts::export::<CustomDatetimeFormat>(&config).unwrap());
//     parts.push(ts::export::<DatetimeColorMode>(&config).unwrap());
//     parts.push(ts::export::<OptionalUpdate<()>>(&config).unwrap());
//     parts.push(ts::export::<StringColumnStyleConfig>(&config).unwrap());
//     parts.push(ts::export::<FormatMode>(&config).unwrap());
//     parts.push(ts::export::<StringColorMode>(&config).unwrap());
//     parts.push(ts::export::<CustomNumberFormatConfig>(&config).unwrap());
//     parts.push(ts::export::<Notation>(&config).unwrap());
//     parts.push(ts::export::<RoundingIncrement>(&config).unwrap());
//     parts.push(ts::export::<UnitNumberFormatStyle>(&config).unwrap());
//     parts.push(ts::export::<CurrencyNumberFormatStyle>(&config).unwrap());
//     parts.push(ts::export::<NumberFormatStyle>(&config).unwrap());
//     parts.push(ts::export::<NumberColumnStyleConfig>(&config).unwrap());
//     parts.push(ts::export::<DatetimeColumnStyleConfig>(&config).unwrap());
//     parts.push(ts::export::<DatetimeFormatType>(&config).unwrap());
//     parts.push(ts::export::<ColumnConfigValues>(&config).unwrap());
//     parts.push(ts::export::<ViewerConfigUpdate>(&config).unwrap());
//     format!("{}\n{}", generate_type_bindings(), parts.join("\n\n"))
// }

/// Export all ExprTK commands, for use in generating documentation.
// #[cfg(feature = "metadata")]
// #[wasm_bindgen(js_name = "getExprTKCommands")]
// pub fn js_get_exprtk_commands() -> ApiResult<Box<[JsValue]>> {
//     crate::exprtk::COMPLETIONS.with(|x| {
//         Ok(x.iter()
//             .map(<JsValue as JsValueSerdeExt>::from_serde_ext)
//             .collect::<Result<Box<[_]>, _>>()?)
//     })
// }

/// Register this crate's Custom Elements in the browser's current session.
///
/// This must occur before calling any public API methods on these Custom
/// Elements from JavaScript, as the methods themselves won't be defined yet.
/// By default, this crate does not register `PerspectiveViewerElement` (as to
/// preserve backwards-compatible synchronous API).
#[cfg(not(feature = "external-bootstrap"))]
#[wasm_bindgen(js_name = "init")]
pub fn js_init() {
    perspective_js::utils::set_global_logging();
    define_web_components!("export * as psp from '../../perspective-viewer.js'");
    tracing::info!("Perspective initialized.");
}

/// Register Web Components with the global registry, given a Perspective
/// module.
///
/// This function shouldn't be called directly;  instead, use the
/// `define_web_components!` macro to both call this method and hook the
/// wasm_bindgen module object.
pub fn bootstrap_web_components(psp: &JsValue) {
    define_web_component::<PerspectiveViewerElement>(psp);
    define_web_component::<PerspectiveDebugPluginElement>(psp);

    define_web_component::<ExportDropDownMenuElement>(psp);
    define_web_component::<CopyDropDownMenuElement>(psp);
}

#[macro_export]
macro_rules! define_web_components {
    ($x:expr) => {{
        #[wasm_bindgen::prelude::wasm_bindgen(inline_js = $x)]
        extern "C" {
            #[wasm_bindgen::prelude::wasm_bindgen(js_name = "psp")]
            pub static PSP: wasm_bindgen::prelude::JsValue;
        }

        $crate::bootstrap_web_components(&PSP);
    }};
}
