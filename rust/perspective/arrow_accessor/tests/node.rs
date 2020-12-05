/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#![cfg(target_arch = "wasm32")]

use std::fs::File;
use arrow::ipc::reader::StreamReader;
use arrow::record_batch::RecordBatch;

use chrono::NaiveDateTime;

use js_sys::*;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;

use arrow_accessor::accessor::ArrowAccessor;
    
#[wasm_bindgen_test]
fn load_arrow_from_batch() {
    // TODO: no envvars in wasm-pack I assume
    let filename = std::env::var("PSP_RUST_ACCESSOR_TEST_DATA").unwrap();
    let f = File::open(filename).unwrap();
    let reader = StreamReader::try_new(f).unwrap();
    let _batches = reader.map(|batch| {
        Box::new(batch.unwrap())
    }).collect::<Vec<Box<RecordBatch>>>();

    if let [batch] = &_batches[..] {
        let accessor = ArrowAccessor::new(batch.clone(), batch.schema());
        assert_eq!(accessor.column_paths, vec!["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"])
    } else {
        panic!("Arrow should only contain a single record batch.")
    }
}

#[wasm_bindgen_test]
fn load_arrow_from_uint8array() {
    let filename = std::env::var("PSP_RUST_ACCESSOR_TEST_DATA").unwrap();
    let f = File::open(filename).unwrap();
    let reader = StreamReader::try_new(f).unwrap();
    let _batches = reader.map(|batch| {
        Box::new(batch.unwrap())
    }).collect::<Vec<Box<RecordBatch>>>();

    if let [batch] = &_batches[..] {
        let accessor = ArrowAccessor::new(batch.clone(), batch.schema());
        assert_eq!(accessor.column_paths, vec!["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"])
    } else {
        panic!("Arrow should only contain a single record batch.")
    }
}

