////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::cell::*;
use std::rc::*;

use wasm_bindgen_futures::spawn_local;
use wasm_bindgen_test::*;

use crate::utils::*;
use crate::*;

#[wasm_bindgen_test]
async fn test_request_animation_frame_async() {
    // Merely test that this Promise resolves at all ..
    await_animation_frame().await.unwrap();
}

#[wasm_bindgen_test]
async fn test_async_in_correct_order() {
    let cell = Rc::new(RefCell::new(vec![]));
    spawn_local({
        clone!(cell);
        async move {
            await_animation_frame().await.unwrap();
            cell.borrow_mut().push("1");
        }
    });

    await_animation_frame().await.unwrap();
    cell.borrow_mut().push("2");
    await_animation_frame().await.unwrap();
    assert_eq!(vec!["2", "1"], *cell.borrow());
}
