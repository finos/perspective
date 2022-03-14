////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

// Required by yew's `html` macro.
#![recursion_limit = "1024"]
#![warn(clippy::all, clippy::panic_in_result_fn)]

pub mod custom_elements;

mod components;
mod config;
mod custom_events;
mod dragdrop;
mod exprtk;
mod js;
mod model;
mod renderer;
mod session;
mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn register_plugin(name: &str) {
    use crate::renderer::registry::*;
    PLUGIN_REGISTRY.register_plugin(name);
}
