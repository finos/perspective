////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::radio_list::{RadioList, RadioListMsg};
use crate::utils::WeakComponentLink;
use crate::*;

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen_test::*;
use yew::prelude::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
pub fn test_change_u32() {
    let link: WeakComponentLink<RadioList<u32>> = WeakComponentLink::default();
    let result: Rc<RefCell<u32>> = Rc::new(RefCell::new(1000));
    let on_change = {
        let _result = result.clone();
        Callback::from(move |val| {
            *_result.borrow_mut() = val;
        })
    };

    test_html! {
        <RadioList<u32>
            disabled=false
            selected=2
            on_change={ on_change }
            values={ vec!(1, 2, 3) }
            weak_link={ link.clone() }>

            <span>{ "One" }</span>
            <span>{ "Two" }</span>
            <span>{ "Three" }</span>

        </RadioList<u32>>
    };

    let radio_list = link.borrow().clone().unwrap();
    radio_list.send_message(RadioListMsg::Change("2".to_owned()));
    assert_eq!(*result.borrow(), 2);
    radio_list.send_message(RadioListMsg::Change("3".to_owned()));
    assert_eq!(*result.borrow(), 3);
    radio_list.send_message(RadioListMsg::Change("1".to_owned()));
    assert_eq!(*result.borrow(), 1);
}
