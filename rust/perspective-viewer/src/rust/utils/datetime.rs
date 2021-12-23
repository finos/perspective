////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;

use chrono::{DateTime, FixedOffset, NaiveDateTime, TimeZone, Utc};
use wasm_bindgen::prelude::*;

fn input_value_format(x: &str) -> Result<&str, JsValue> {
    match x.len() {
        23 => Ok("%Y-%m-%dT%H:%M:%S%.3f"),
        19 => Ok("%Y-%m-%dT%H:%M:%S"),
        16 => Ok("%Y-%m-%dT%H:%M"),
        _ => Err(format!("Unknown format {}", x).into()),
    }
}

fn get_local_tz() -> FixedOffset {
    FixedOffset::west(js_sys::Date::new(&0.into()).get_timezone_offset() as i32 * 60)
}

pub fn posix_to_utc_str(x: f64) -> Result<String, JsValue> {
    let tz = get_local_tz();
    if x > 0_f64 {
        Ok(Utc
            .timestamp(x as i64 / 1000, ((x as i64 % 1000) * 1000000) as u32)
            .with_timezone(&tz)
            .format("%Y-%m-%dT%H:%M:%S%.3f")
            .to_string())
    } else {
        Err(format!("Unknown timestamp {}", x).into())
    }
}

pub fn str_to_utc_posix(val: &str) -> Result<f64, JsValue> {
    let tz = get_local_tz();
    NaiveDateTime::parse_from_str(val, input_value_format(val)?)
        .map(|ref posix| {
            DateTime::<Utc>::from(tz.from_local_datetime(posix).unwrap())
                .timestamp_millis() as f64
        })
        .into_jserror()
}
