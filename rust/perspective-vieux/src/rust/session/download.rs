////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js_object;
use crate::utils::perspective::*;

use js_sys::{Array, Promise, Uint8Array};
use std::iter::FromIterator;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;

type JsResult<T> = Result<T, JsValue>;

/// Download a flat (unpivoted with all columns) CSV.
#[wasm_bindgen]
pub fn download_flat(table: &PerspectiveJsTable) -> Promise {
    let table = table.clone();
    future_to_promise(async move {
        let view = table.view(js_object!()).await?;
        download_async(&view).await?;
        view.delete().await?;
        Ok(JsValue::UNDEFINED)
    })
}

/// Download a CSV
#[wasm_bindgen]
pub fn download(view: &PerspectiveJsView) -> Promise {
    let view = view.clone();
    future_to_promise(async move {
        download_async(&view).await?;
        Ok(JsValue::NULL)
    })
}

/// Download a CSV, but not a `Promise`.  Used to implement the public methods.
async fn download_async(view: &PerspectiveJsView) -> JsResult<()> {
    let csv_fut = view.to_csv(js_object!("formatted", true));
    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();
    let element: web_sys::HtmlElement = document.create_element("a")?.unchecked_into();
    let blob_url = {
        let csv = csv_fut.await.unwrap();
        let csv_str = csv.as_string().unwrap();
        let bytes = csv_str.as_bytes();
        let array = unsafe { Array::from_iter([Uint8Array::view(bytes)].iter()) };
        let blob = web_sys::Blob::new_with_u8_array_sequence(&array)?;
        web_sys::Url::create_object_url_with_blob(&blob)?
    };

    element.set_attribute("download", "perspective.csv")?;
    element.set_attribute("href", &blob_url)?;
    element.style().set_property("display", "none")?;
    document.body().unwrap().append_child(&element)?;
    element.click();
    document.body().unwrap().remove_child(&element)?;
    Ok(())
}
