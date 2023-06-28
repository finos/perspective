// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

use std::cell::RefCell;
use std::rc::Rc;

use wasm_bindgen_test::*;

use super::super::pubsub::*;

#[wasm_bindgen_test]
pub async fn test_pub_sub() {
    let pubsub: PubSub<u32> = PubSub::default();
    let called: Rc<RefCell<Option<u32>>> = Rc::new(RefCell::new(None));
    let callback = {
        let called = called.clone();
        move |x| {
            *called.borrow_mut() = Some(x);
        }
    };

    let sub = pubsub.add_listener(callback);
    pubsub.emit_all(1);
    assert_eq!(*called.borrow(), Some(1));
    drop(sub);
}

#[wasm_bindgen_test]
pub async fn test_pub_sub_multiple() {
    let pubsub: PubSub<u32> = PubSub::default();
    let called1: Rc<RefCell<Option<u32>>> = Rc::new(RefCell::new(None));
    let called2: Rc<RefCell<Option<u32>>> = Rc::new(RefCell::new(None));
    let callback1 = {
        let called = called1.clone();
        move |x| {
            *called.borrow_mut() = Some(x);
        }
    };

    let callback2 = {
        let called = called2.clone();
        move |x| {
            *called.borrow_mut() = Some(x);
        }
    };

    // Must be in scope or subscriptions will drop immediately!
    let sub1 = pubsub.add_listener(callback1);
    let sub2 = pubsub.add_listener(callback2);

    pubsub.emit_all(1);
    assert_eq!(*called1.borrow(), Some(1));
    assert_eq!(*called2.borrow(), Some(1));

    drop(sub1);
    drop(sub2);
}

#[wasm_bindgen_test]
pub async fn test_pub_sub_multiple_drop_first() {
    let pubsub: PubSub<u32> = PubSub::default();
    let called1: Rc<RefCell<Option<u32>>> = Rc::new(RefCell::new(None));
    let called2: Rc<RefCell<Option<u32>>> = Rc::new(RefCell::new(None));
    let callback1 = {
        let called = called1.clone();
        move |x| {
            *called.borrow_mut() = Some(x);
        }
    };

    let callback2 = {
        let called = called2.clone();
        move |x| {
            *called.borrow_mut() = Some(x);
        }
    };

    let _ = pubsub.add_listener(callback1);
    let sub = pubsub.add_listener(callback2);

    pubsub.emit_all(1);
    assert_eq!(*called1.borrow(), None);
    assert_eq!(*called2.borrow(), Some(1));

    drop(sub);
}
