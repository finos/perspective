////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::super::debounce::*;
use super::super::request_animation_frame::set_timeout;

use futures::channel::oneshot::*;
use futures::future::join_all;
use std::cell::Cell;
use std::rc::Rc;
use wasm_bindgen::*;
use wasm_bindgen_futures::spawn_local;
use wasm_bindgen_test::*;

#[wasm_bindgen_test]
pub async fn test_lock() {
    let debounce_mutex = DebounceMutex::default();
    let cell = Rc::new(Cell::new(0));
    let (sender, receiver) = channel::<bool>();
    spawn_local({
        let cell = cell.clone();
        let debounce_mutex = debounce_mutex.clone();
        async move {
            debounce_mutex
                .lock(async {
                    cell.set(1);
                    set_timeout(10).await.unwrap();
                    cell.set(2);
                })
                .await
        }
    });

    spawn_local({
        let cell = cell.clone();
        let debounce_mutex = debounce_mutex.clone();
        async move {
            debounce_mutex
                .lock(async {
                    for _ in 0..10 {
                        set_timeout(1).await.unwrap();
                        if cell.get() == 1 {
                            sender.send(false).unwrap();
                            return;
                        }
                    }
                    sender.send(cell.get() == 2).unwrap();
                })
                .await
        }
    });

    assert!(receiver.await.unwrap());
}

#[wasm_bindgen_test]
pub async fn test_lock_seq() {
    let debounce_mutex = DebounceMutex::default();
    let cell: Rc<Cell<u32>> = Rc::new(Cell::new(0));

    let tasks = (0..10)
        .map(|_| {
            let cell = cell.clone();
            let debounce_mutex = debounce_mutex.clone();
            async move {
                debounce_mutex
                    .lock(async {
                        set_timeout(10).await.unwrap();
                        cell.set(cell.get() + 1);
                    })
                    .await;
            }
        })
        .collect::<Vec<_>>();

    assert_eq!(join_all(tasks).await.len(), 10);
    assert_eq!(cell.get(), 10);
}

#[wasm_bindgen_test]
pub async fn test_debounce_seq() {
    let debounce_mutex = DebounceMutex::default();
    let cell: Rc<Cell<u32>> = Rc::new(Cell::new(0));

    let tasks = (0..10)
        .map(|_| {
            let cell = cell.clone();
            let debounce_mutex = debounce_mutex.clone();
            async move {
                debounce_mutex
                    .debounce(async {
                        set_timeout(10).await.unwrap();
                        cell.set(cell.get() + 1);
                        Ok(JsValue::UNDEFINED)
                    })
                    .await
                    .unwrap();
            }
        })
        .collect::<Vec<_>>();

    assert_eq!(join_all(tasks).await.len(), 10);
    assert!(cell.get() < 10);
    assert!(cell.get() > 0);
}
