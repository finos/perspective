////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen_test::*;
use yew::prelude::*;

use crate::components::status_bar_counter::*;
use crate::session::ViewStats;
use crate::utils::request_animation_frame;
use crate::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
pub async fn test_counter_none() {
    let div = test_html! {
        <StatusBarRowsCounter stats={ None }>
        </StatusBarRowsCounter>
    };

    assert_eq!(div.inner_html(), "- rows");
}

#[wasm_bindgen_test]
pub async fn test_counter_initializing() {
    let stats = Some(ViewStats {
        num_table_cells: None,
        num_view_cells: None,
        is_group_by: false,
        is_split_by: false,
        is_filtered: false,
    });

    let div = test_html! {
        <StatusBarRowsCounter stats={ stats }>
        </StatusBarRowsCounter>
    };

    assert_eq!(div.inner_html(), "- rows");
}

#[wasm_bindgen_test]
pub async fn test_counter_some_connected_no_view() {
    let stats = Some(ViewStats {
        num_table_cells: Some((123456789, 7)),
        num_view_cells: None,
        is_group_by: false,
        is_split_by: false,
        is_filtered: false,
    });

    let div = test_html! {
        <StatusBarRowsCounter stats={ stats }>
        </StatusBarRowsCounter>
    };

    assert_eq!(div.inner_html(), "123,456,789 rows");
}

#[wasm_bindgen_test]
pub async fn test_counter_some_connected_no_pivot() {
    let stats = Some(ViewStats {
        num_table_cells: Some((123456789, 7)),
        num_view_cells: Some((54321, 4)),
        is_group_by: false,
        is_split_by: false,
        is_filtered: false,
    });

    let div = test_html! {
        <StatusBarRowsCounter stats={ stats }>
        </StatusBarRowsCounter>
    };

    assert_eq!(div.inner_html(), "123,456,789 rows");
}

#[wasm_bindgen_test]
pub async fn test_counter_some_connected_pivot() {
    let stats = Some(ViewStats {
        num_table_cells: Some((123456789, 7)),
        num_view_cells: Some((54321, 4)),
        is_group_by: false,
        is_split_by: false,
        is_filtered: false,
    });

    let div = test_html! {
        <StatusBarRowsCounter stats={ stats }>
        </StatusBarRowsCounter>
    };

    assert_eq!(div.inner_html(), "54,321 ");
}
