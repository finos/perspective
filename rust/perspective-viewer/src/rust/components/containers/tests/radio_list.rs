////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::super::radio_list::{RadioList, RadioListMsg};
use crate::utils::{await_animation_frame, WeakScope};
use crate::*;

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen_test::*;
use yew::prelude::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
pub async fn test_change_u32() {
    let link: WeakScope<RadioList<String>> = WeakScope::default();
    let result: Rc<RefCell<String>> = Rc::new(RefCell::new("false".to_owned()));
    let on_change = {
        clone!(result);
        Callback::from(move |val| {
            *result.borrow_mut() = val;
        })
    };

    test_html! {
        <RadioList<String>
            disabled=false
            selected="2"
            on_change={ on_change }
            values={ vec!("1".to_owned(), "2".to_owned(), "3".to_owned()) }
            weak_link={ link.clone() }>

            <span>{ "One" }</span>
            <span>{ "Two" }</span>
            <span>{ "Three" }</span>

        </RadioList<String>>
    };

    await_animation_frame().await.unwrap();
    let radio_list = link.borrow().clone().unwrap();
    radio_list.send_message(RadioListMsg::Change("2".to_owned()));
    await_animation_frame().await.unwrap();

    assert_eq!(*result.borrow(), "2");
    radio_list.send_message(RadioListMsg::Change("3".to_owned()));
    await_animation_frame().await.unwrap();

    assert_eq!(*result.borrow(), "3");
    radio_list.send_message(RadioListMsg::Change("1".to_owned()));
    await_animation_frame().await.unwrap();

    assert_eq!(*result.borrow(), "1");
}
