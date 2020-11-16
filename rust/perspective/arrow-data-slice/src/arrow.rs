/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
use std::str;
use std::io::Cursor;
use arrow::error::{ArrowError, Result};
use arrow::ipc::reader::{StreamReader};
use arrow::record_batch::RecordBatch;
use arrow::datatypes::Schema;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // FIXME: remove log redefinition/find a way to pass log down to submodules
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Load an arrow binary in stream format.
pub fn load_arrow_stream(buffer: Box<[u8]>) {
    let cursor = Cursor::new(buffer);
    let reader = StreamReader::try_new(cursor).unwrap();
    let schema = reader.schema();
    let mut batches: Vec<RecordBatch> = Vec::new();
    log(format!("Schema from Rust StreamReader: {}", schema).as_str());

    reader.for_each(|batch| {
        match batch {
            Ok(val) => {
                batches.push(val);
            },
            Err(err) => log(format!("{}", err).as_str())
        }
    });

    for b in batches {
        let num_columns: usize = b.num_columns();
        let num_rows: usize = b.num_rows();
        log(format!("{} x {}", num_columns, num_rows).as_str());
    }
}

#[wasm_bindgen]
pub fn get_from_arrow(column_name: &str, ridx: usize) -> JsValue {
    println!("{}[{}]", column_name, ridx);
    println!("Returning JS null");
    JsValue::NULL
}