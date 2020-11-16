/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
mod utils;
mod arrow;

use wasm_bindgen::prelude::*;

use crate::arrow::load_arrow_stream;
use crate::utils::set_panic_hook;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn load_arrow(buffer: Box<[u8]>) {
    set_panic_hook();
    load_arrow_stream(buffer);
}