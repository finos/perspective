////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::prelude::*;

pub trait AsBlob {
    /// Standardized conversions from common `wasm_bindgen` types to
    /// `js_sys::Blob`, which is commonly necessary to provide data to a
    /// download or clipboard action.
    fn as_blob(&self) -> Result<web_sys::Blob, JsValue>;
}

impl AsBlob for js_sys::ArrayBuffer {
    fn as_blob(&self) -> Result<web_sys::Blob, JsValue> {
        let array = [js_sys::Uint8Array::new(self)]
            .iter()
            .collect::<js_sys::Array>();
        web_sys::Blob::new_with_u8_array_sequence(&array)
    }
}

impl AsBlob for js_sys::JsString {
    fn as_blob(&self) -> Result<web_sys::Blob, JsValue> {
        let array = [self].iter().collect::<js_sys::Array>();
        let mut options = web_sys::BlobPropertyBag::new();
        options.type_("text/plain");
        web_sys::Blob::new_with_str_sequence_and_options(&array, &options)
    }
}

impl AsBlob for js_sys::Object {
    fn as_blob(&self) -> Result<web_sys::Blob, JsValue> {
        let array = [js_sys::JSON::stringify(self)?]
            .iter()
            .collect::<js_sys::Array>();
        let mut options = web_sys::BlobPropertyBag::new();
        options.type_("text/plain");
        web_sys::Blob::new_with_str_sequence_and_options(&array, &options)
    }
}
