/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
pub mod accessor;

use std::io::Cursor;

use arrow::datatypes::{DataType, DateUnit, TimeUnit};
use arrow::ipc::reader::StreamReader;
use arrow::record_batch::RecordBatch;

use chrono::Datelike;
use js_sys::*;
use wasm_bindgen::prelude::*;

use crate::accessor::ArrowAccessor;

/// Load an arrow binary in stream format.
pub fn load_arrow_stream(buffer: Box<[u8]>) -> Box<ArrowAccessor> {
    let cursor = Cursor::new(buffer);
    let reader = StreamReader::try_new(cursor).unwrap();
    let schema = reader.schema();

    // Iterate over record batches, and collect them into a vector of
    // heap-allocated batches. Do not use the `reader` after this line,
    // as it is consumed by `.map()` below.
    let batches = reader
        .map(|batch| {
            // Panic if it can't read the batch
            Box::new(batch.unwrap())
        })
        .collect::<Vec<Box<RecordBatch>>>();

    if let [batch] = &batches[..] {
        Box::new(ArrowAccessor::new(batch.clone(), schema))
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
pub fn accessor_make(buffer: Box<[u8]>) -> *mut ArrowAccessor {
    set_panic_hook();
    let accessor = load_arrow_stream(buffer);
    Box::into_raw(accessor)
}

#[wasm_bindgen]
pub fn accessor_get_value(accessor: *mut ArrowAccessor, column_name: &str, ridx: usize) -> JsValue {
    let accessor = unsafe { accessor.as_ref().unwrap() };
    let schema = &accessor.schema;

    if schema.contains_key(column_name) {
        let dtype = &schema[column_name];

        // Explicitly return JsValue::NULL here, as `Option::None` returns
        // `undefined` by default.
        match dtype {
            DataType::Int32 => match accessor.get_i32(column_name, ridx) {
                Some(num) => JsValue::from(num),
                None => JsValue::NULL,
            },
            DataType::Int64 => match accessor.get_i64(column_name, ridx) {
                Some(num) => JsValue::from(num as i32),
                None => JsValue::NULL,
            },
            DataType::Float64 => match accessor.get_f64(column_name, ridx) {
                Some(num) => JsValue::from(num),
                None => JsValue::NULL,
            },
            DataType::Date32(DateUnit::Day) => match accessor.get_date(column_name, ridx) {
                Some(value) => JsValue::from(Date::new_with_year_month_day(
                    value.year() as u32,
                    value.month0() as i32,
                    value.day() as i32,
                )),
                None => JsValue::NULL,
            },
            DataType::Timestamp(TimeUnit::Millisecond, _) => {
                match accessor.get_datetime(column_name, ridx) {
                    Some(value) => {
                        let timestamp = JsValue::from(value as f64);
                        JsValue::from(Date::new(&timestamp))
                    }
                    None => JsValue::NULL,
                }
            }
            DataType::Boolean => match accessor.get_bool(column_name, ridx) {
                Some(val) => JsValue::from(val),
                None => JsValue::NULL,
            },
            DataType::Dictionary(ref key_type, _) => match key_type.as_ref() {
                DataType::Int32 => match accessor.get_string(column_name, ridx) {
                    Some(val) => JsValue::from(val),
                    None => JsValue::NULL,
                },
                dtype => panic!(
                    "Unexpected dictionary key type '{:?}' in get_from_rust_accessor()",
                    dtype
                ),
            },
            _ => panic!("Unexpected dtype '{:?}' in get_from_rust_accessor()", dtype),
        }
    } else {
        JsValue::NULL
    }
}

#[wasm_bindgen]
pub fn accessor_drop(accessor: *mut ArrowAccessor) {
    if !accessor.is_null() {
        unsafe { Box::from_raw(accessor) };
    }
}
