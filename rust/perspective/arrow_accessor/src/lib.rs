/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
pub mod accessor;
pub mod accessor_fast;

use std::io::Cursor;

use arrow::ipc::reader::StreamReader;
use arrow::record_batch::RecordBatch;

use js_sys::Array;
use wasm_bindgen::prelude::*;

use crate::accessor_fast::ArrowAccessorFast;

/// Load an arrow binary in stream format.
pub fn load_arrow_stream(buffer: Box<[u8]>) -> Box<ArrowAccessorFast> {
    let cursor = Cursor::new(buffer);
    let reader = StreamReader::try_new(cursor).unwrap();
    let schema = reader.schema();

    // Iterate over record batches, and collect them into a vector of
    // heap-allocated batches.
    let batches = reader
        .map(|batch| {
            // Panic if it can't read the batch
            Box::new(batch.unwrap())
        })
        .collect::<Vec<Box<RecordBatch>>>();

    if let [batch] = &batches[..] {
        Box::new(ArrowAccessorFast::new(batch.clone(), schema))
    } else {
        panic!("Arrow should only contain a single record batch.")
    }
}

// Debug `panic!` messages inside console.error().
pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn accessor_make(buffer: Box<[u8]>) -> *const ArrowAccessorFast {
    set_panic_hook();
    let accessor = load_arrow_stream(buffer);
    Box::into_raw(accessor)
}

#[wasm_bindgen]
pub fn accessor_get_column_paths(accessor: *const ArrowAccessorFast) -> Vec<JsValue> {
    let accessor = unsafe { accessor.as_ref().unwrap() };
    accessor.column_paths
        .iter()
        .map(|path| JsValue::from(path))
        .collect::<Vec<JsValue>>()
}

// #[wasm_bindgen]
// pub fn accessor_get_column(accessor: *const ArrowAccessorFast, column_name: &str) -> Vec<JsValue> {
//     let accessor = unsafe { accessor.as_ref().unwrap() };
//     let cidx = accessor.column_indices[column_name];
//     accessor.data[cidx].to_vec()
// }

#[wasm_bindgen]
pub fn accessor_get_data(accessor: *mut ArrowAccessorFast) -> Array {
    let accessor = unsafe { accessor.as_mut().unwrap() };
    accessor.data.take().unwrap()
}

#[wasm_bindgen]
pub fn accessor_drop(accessor: *const ArrowAccessorFast) {
    if !accessor.is_null() {
        unsafe { Box::from_raw(accessor as *mut ArrowAccessorFast) };
    }
}
