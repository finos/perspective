////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::js::perspective::*;
use crate::*;

use super::view::*;

use js_sys::JsString;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

/// Copy a flat (unpivoted with all columns) CSV to the clipboard.
pub async fn copy_flat(table: &JsPerspectiveTable) -> Result<(), JsValue> {
    let csv_ref: Rc<RefCell<Option<String>>> = Rc::new(RefCell::new(None));
    poll(0, csv_ref.clone())?;
    let view = table.view(&ViewConfig::default().as_jsvalue()?).await?;
    let csv = copy_async(&view).await?;
    view.delete().await?;
    *csv_ref.borrow_mut() = Some(csv.as_string().unwrap());
    Ok(())
}

/// Copy a `JsPerspectiveView` to the clipboard as a CSV.
pub async fn copy(view: &View) -> Result<(), JsValue> {
    let csv_ref: Rc<RefCell<Option<String>>> = Rc::new(RefCell::new(None));
    poll(0, csv_ref.clone())?;
    let csv = copy_async(&view).await?;
    *csv_ref.borrow_mut() = Some(csv.as_string().unwrap());
    Ok(())
}

/// This method must be called from an event handler, subject to the browser's
/// restrictions on clipboard access.  See
/// [ws](https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard).
fn poll(count: u32, csv_ref: Rc<RefCell<Option<String>>>) -> Result<(), JsValue> {
    if let Some(csv) = csv_ref.borrow().as_ref() {
        let _promise = web_sys::window()
            .unwrap()
            .navigator()
            .clipboard()
            .write_text(csv);
    } else {
        clone!(csv_ref);
        let f: js_sys::Function =
            Closure::once(Box::new(move || poll(count + 1, csv_ref)))
                .into_js_value()
                .unchecked_into();

        web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(&f, 50)?;
    }
    Ok(())
}

/// Copy a CSV, but not a `Promise`.  Used to implement the public methods.
async fn copy_async(view: &JsPerspectiveView) -> Result<JsString, JsValue> {
    let csv = view.to_csv(js_object!("formatted", true));
    Ok(csv.await.unwrap())
}
