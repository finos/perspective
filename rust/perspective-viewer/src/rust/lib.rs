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
#![warn(
    clippy::all,
    clippy::panic_in_result_fn,
    clippy::await_holding_refcell_ref
)]

mod components;
mod config;
pub mod custom_elements;
mod custom_events;
mod dragdrop;
mod exprtk;
mod js;
mod model;
mod renderer;
mod session;
mod theme;
mod utils;

use custom_elements::copy_dropdown::CopyDropDownMenuElement;
use custom_elements::date_column_style::PerspectiveDateColumnStyleElement;
use custom_elements::datetime_column_style::PerspectiveDatetimeColumnStyleElement;
use custom_elements::export_dropdown::ExportDropDownMenuElement;
use custom_elements::number_column_style::PerspectiveNumberColumnStyleElement;
use custom_elements::string_column_style::PerspectiveStringColumnStyleElement;
use custom_elements::viewer::PerspectiveViewerElement;

use utils::{define_web_component, ToJsValueError};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = "registerPlugin")]
pub fn register_plugin(name: &str) {
    use crate::renderer::*;
    PLUGIN_REGISTRY.register_plugin(name);
}

#[wasm_bindgen(js_name = "getExprTKCommands")]
pub fn get_exprtk_commands() -> Result<Box<[JsValue]>, JsValue> {
    crate::exprtk::COMPLETIONS
        .with(|x| {
            x.suggestions
                .iter()
                .map(JsValue::from_serde)
                .collect::<Result<Box<[_]>, serde_json::Error>>()
        })
        .into_jserror()
}

#[wasm_bindgen(js_name = "defineWebComponents")]
pub fn define_web_components() {
    if cfg!(feature = "define_custom_elements_async") {
        define_web_component::<PerspectiveViewerElement>();
    }

    define_web_component::<PerspectiveDateColumnStyleElement>();
    define_web_component::<PerspectiveDatetimeColumnStyleElement>();
    define_web_component::<PerspectiveStringColumnStyleElement>();
    define_web_component::<PerspectiveNumberColumnStyleElement>();
    define_web_component::<ExportDropDownMenuElement>();
    define_web_component::<CopyDropDownMenuElement>();
}
