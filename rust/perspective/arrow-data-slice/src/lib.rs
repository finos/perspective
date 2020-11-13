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

use js_sys::{ArrayBuffer, Uint8Array};
use wasm_bindgen::prelude::*;

use crate::arrow::load_arrow_slice;
use crate::utils::set_panic_hook;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn load_arrow_buffer(buffer: ArrayBuffer) {
    // Print errors to console.error
    set_panic_hook();

    log(format!("Arrow bytelength in rust, {}", buffer.byte_length()).as_str());

    // Do a little dance to convert an `ArrayBuffer` to a `&[u8]`
    let mut body = vec![0; buffer.byte_length() as usize];
    let typebuf = Uint8Array::new(&buffer);

    // Copy the `UInt8Array` to the `vec[u8]`
    typebuf.copy_to(&mut body[..]);

    // Load it into the arrow reader.
    load_arrow_slice(&body);
}

#[wasm_bindgen]
pub fn run() -> Result<(), JsValue> {
    if cfg!(debug_assertions) {
        set_panic_hook();
    }

    println!("Hello from rust!");
    Ok(())
}
