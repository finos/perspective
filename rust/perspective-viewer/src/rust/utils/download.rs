////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

pub fn download(name: &str, value: &JsValue) -> Result<(), JsValue> {
    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();
    let element: web_sys::HtmlElement = document.create_element("a")?.unchecked_into();
    let blob_url = {
        let array = [value].iter().collect::<js_sys::Array>();
        let blob = web_sys::Blob::new_with_u8_array_sequence(&array)?;
        web_sys::Url::create_object_url_with_blob(&blob)?
    };

    element.set_attribute("download", name)?;
    element.set_attribute("href", &blob_url)?;
    element.style().set_property("display", "none")?;
    document.body().unwrap().append_child(&element)?;
    element.click();
    document.body().unwrap().remove_child(&element)?;
    Ok(())
}
