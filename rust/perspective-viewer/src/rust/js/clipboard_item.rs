////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::prelude::*;

#[wasm_bindgen(inline_js = "export const ClipboardItem = window.ClipboardItem")]
extern "C" {
    pub type ClipboardItem;

    #[wasm_bindgen(constructor, js_class = "ClipboardItem")]
    pub fn new(files: &js_sys::Object) -> ClipboardItem;
}
