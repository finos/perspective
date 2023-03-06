////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_test::*;

use super::super::testing::*;
use crate::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

// #[wasm_bindgen_test]
// pub async fn test_table_size() {
//     let table = get_mock_table().await;
//     let size = table.num_rows().await.unwrap();
//     assert!(size - 3_f64 < 0.01);
// }

#[wasm_bindgen_test]
pub async fn test_table_validate_valid_expressions() {
    let exprs = vec!["\"A\" * 2"];
    let array = exprs.into_iter().map(JsValue::from).collect();
    let table = get_mock_table().await;
    let results = table.validate_expressions(array).await.unwrap();
    let errors = results.errors();
    let len = js_sys::Object::keys(&errors).length();
    assert_eq!(len, 0);
}

#[wasm_bindgen_test]
pub async fn test_table_validate_invalid_expressions() {
    let exprs = vec!["\"B\" * 2"];
    let array = exprs.into_iter().map(JsValue::from).collect();
    let table = get_mock_table().await;
    let results = table.validate_expressions(array).await.unwrap();
    let errors = results.errors();
    let len = js_sys::Object::keys(&errors).length();
    assert_eq!(len, 1);
}

#[wasm_bindgen_test]
pub async fn test_view_to_csv() {
    let table = get_mock_table().await;
    let view = table.view(json!({}).unchecked_ref()).await.unwrap();
    let csv: String = view.to_csv(json!({})).await.unwrap().into();
    assert_eq!(csv, "\"A\"\n1\n2\n3\n");
}

#[wasm_bindgen_test]
pub async fn test_view_num_rows() {
    let table = get_mock_table().await;
    let view = table.view(json!({}).unchecked_ref()).await.unwrap();
    let num_rows = view.dimensions().await.unwrap().num_view_rows();
    assert!(num_rows - 3_f64 < 0.01);
}

// #[wasm_bindgen_test]
// pub async fn test_view_get_config() {
//     let table = get_mock_table().await;
//     let view = table.view(json!({}).unchecked_ref()).await.unwrap();
//     let config = view.get_config().await.unwrap();
//     assert!(JsValue::is_object(&config));
//     let group_by_len = config.group_by().length();
//     assert_eq!(group_by_len, 0);
//     let col_pivot_len = config.split_by().length();
//     assert_eq!(col_pivot_len, 0);
// }
