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
use arrow::ipc::reader::{FileReader, StreamReader};
use arrow::record_batch::RecordBatch;
use arrow::datatypes::Schema;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // FIXME: remove log redefinition/find a way to pass log down to submodules
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Load an arrow binary from a slice.
pub fn load_arrow_slice(slice: &[u8]) {
    // let slice = std::slice::from_raw_parts(ptr, length);
    let cursor = Cursor::new(slice);

    // Perspective generates streams - shortcut here
    load_arrow_stream(cursor);

    // // Check whether the first 6 bytes are `ARROW1` - if so, then
    // // the arrow is a file format, otherwise it is a stream format.
    // let arrow_header = slice.get(0..6);

    // match arrow_header {
    //     Some(v) => {
    //         match str::from_utf8(v) {
    //             Ok(v) => {
    //                 match v {
    //                     "ARROW1" => load_arrow_file(cursor),
    //                     _ => load_arrow_stream(cursor)
    //                 }
    //             },
    //             Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
    //         };
    //     },
    //     None => panic!("Could not get arrow header from buffer!")
    // }           
}

/// Load an arrow binary from a raw pointer to a block of memory.
/// 
/// # Arguments
/// 
/// * `ptr` - a pointer to a block of memory containing an arrow binary
/// * `length` - the length of the binary located at ptr
pub fn load_arrow_ptr(ptr: *const u8, length: usize) {
    unsafe {
        let slice = std::slice::from_raw_parts(ptr, length);
        let cursor = Cursor::new(slice);

        // Check whether the first 6 bytes are `ARROW1` - if so, then
        // the arrow is a file format, otherwise it is a stream format.
        let arrow_header = slice.get(0..6);

        match arrow_header {
            Some(v) => {
                match str::from_utf8(v) {
                    Ok(v) => {
                        match v {
                            "ARROW1" => load_arrow_file(cursor),
                            _ => load_arrow_stream(cursor)
                        }
                    },
                    Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
                };
            },
            None => panic!("Could not get arrow header from buffer!")
        }
        
    };
        
}

fn load_arrow_stream(cursor: Cursor<&[u8]>) {
    let reader = StreamReader::try_new(cursor);
    match reader {
        Ok(v) => {
            let schema = v.schema();
            log(format!("Schema from Rust StreamReader: {}", schema).as_str());
            // let batches = v.collect::<Result<_>>()?;
        },
        Err(e) => panic!("Could not read arrow stream: {}", e)
    }
}

fn load_arrow_file(cursor: Cursor<&[u8]>) {
    let reader = FileReader::try_new(cursor);
    match reader {
        Ok(v) => {
            let schema = v.schema();
            println!("Schema from FileReader: {}", schema);
            // let batches = v.collect::<Result<_>>()?;
        },
        Err(e) => panic!("Could not read arrow file: {}", e)
    }
}

#[wasm_bindgen]
pub fn get_from_arrow(column_name: &str, ridx: usize) -> JsValue {
    println!("Returning JS null");
    JsValue::NULL
}