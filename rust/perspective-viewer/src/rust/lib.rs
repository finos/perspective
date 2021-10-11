////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

// Required by yew's `html` macro.
#![recursion_limit = "1024"]
#![warn(clippy::all)]

pub mod components;
pub mod config;
pub mod custom_elements;
pub mod dragdrop;
pub mod exprtk;
pub mod js;
pub mod renderer;
pub mod session;
pub mod utils;

use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn register_plugin(name: &str) {
    use crate::renderer::registry::*;
    PLUGIN_REGISTRY.register_plugin(name);
}
