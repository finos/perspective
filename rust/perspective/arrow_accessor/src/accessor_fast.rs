/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
use std::collections::HashMap;

use arrow::array::*;
use arrow::datatypes::*;
use arrow::record_batch::RecordBatch;
use chrono::NaiveDate;
use chrono::Datelike;

use js_sys::Date;
use wasm_bindgen::prelude::*;

pub struct ArrowAccessorFast {
    pub data: HashMap<String, Vec<JsValue>>
}

impl ArrowAccessorFast {
    // Create a new arrow accessor by converting each column in the record
    // batch into a vector of `JsValue`s, ready to be passed into Javascript.
    pub fn new(batch: Box<RecordBatch>, batch_schema: SchemaRef) -> Self {
        let num_columns = batch.num_columns();
        let mut data: HashMap<String, Vec<JsValue>> = HashMap::new();

        for cidx in 0..num_columns {
            let col = batch.column(cidx);
            let name = batch_schema.field(cidx).name();
            let dtype = col.data_type();
            let nrows = col.len();
            let mut converted: Vec<JsValue> = Vec::with_capacity(nrows);
        
            match dtype {
                DataType::Boolean => {
                    let typed_col = col
                        .as_any()
                        .downcast_ref::<BooleanArray>()
                        .unwrap();
                    for ridx in 0..nrows {
                        if col.is_valid(ridx) {
                            converted.push(JsValue::from(typed_col.value(ridx)));
                        } else {
                            converted.push(JsValue::NULL);
                        }
                    }
                },
                DataType::Int32 => {
                    let typed_col = col
                        .as_any()
                        .downcast_ref::<Int32Array>()
                        .unwrap();
                    for ridx in 0..nrows {
                        if col.is_valid(ridx) {
                            converted.push(JsValue::from(typed_col.value(ridx)));
                        } else {
                            converted.push(JsValue::NULL);
                        }
                    }
                },
                DataType::Int64 => {
                    let typed_col = col
                        .as_any()
                        .downcast_ref::<Int64Array>()
                        .unwrap();
                    for ridx in 0..nrows {
                        if col.is_valid(ridx) {
                            converted.push(JsValue::from(typed_col.value(ridx) as f64));
                        } else {
                            converted.push(JsValue::NULL);
                        }
                    }
                },
                DataType::Float64 => {
                    let typed_col = col
                        .as_any()
                        .downcast_ref::<Float64Array>()
                        .unwrap();
                    for ridx in 0..nrows {
                        if col.is_valid(ridx) {
                            converted.push(JsValue::from(typed_col.value(ridx)));
                        } else {
                            converted.push(JsValue::NULL);
                        }
                    }
                },
                DataType::Date32(DateUnit::Day) => {
                    let typed_col = col
                        .as_any()
                        .downcast_ref::<Date32Array>()
                        .unwrap();
                    for ridx in 0..nrows {
                        if col.is_valid(ridx) {
                            // Construct a new `Date()` object in the browser's local
                            // time, and use the object's Unix timestamp, otherwise
                            // the browser will attempt to coerce to UTC and offset the
                            // timestamp value again when it is not needed.
                            let value: NaiveDate = typed_col.value_as_date(ridx).unwrap();
                            let dt = Date::new_with_year_month_day(
                                value.year() as u32,
                                value.month0() as i32,
                                value.day() as i32,
                            );
                            converted.push(JsValue::from(JsValue::from(dt.value_of())));
                        } else {
                            converted.push(JsValue::NULL);
                        }
                    }
                },
                DataType::Timestamp(TimeUnit::Millisecond, _) => {
                    let typed_col = col
                        .as_any()
                        .downcast_ref::<TimestampMillisecondArray>()
                        .unwrap();
                    for ridx in 0..nrows {
                        if col.is_valid(ridx) {
                            converted.push(JsValue::from(typed_col.value(ridx) as f64));
                        } else {
                            converted.push(JsValue::NULL);
                        }
                    }
                },
                DataType::Dictionary(ref key_type, _) => match key_type.as_ref() {
                    DataType::Int32 => {
                        let dict_array = col
                            .as_any()
                            .downcast_ref::<Int32DictionaryArray>()
                            .unwrap();
                        let values = dict_array.values();
                        let strings = values
                            .as_any()
                            .downcast_ref::<StringArray>()
                            .unwrap();
                        for ridx in 0..nrows {
                            if col.is_valid(ridx) {
                                let key = dict_array.keys_array().value(ridx) as usize;
                                let val = String::from(strings.value(key));
                                converted.push(JsValue::from(val));
                            } else {
                                converted.push(JsValue::NULL);
                            }
                        }
                    }
                    dtype => panic!("Unexpected dictionary key type {:?}", dtype),
                },
                dtype => panic!("Unexpected data type {:?}", dtype),
            };

            data.insert(name.clone(), converted);
        }

        ArrowAccessorFast {
            data,
        }
    }
}