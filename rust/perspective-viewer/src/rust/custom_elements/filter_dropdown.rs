////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::filter_dropdown::*;
use crate::custom_elements::modal::*;
use crate::session::Session;

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use web_sys::*;
use yew::prelude::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct FilterDropDownElement {
    modal: ModalElement<FilterDropDown>,
    session: Session,
    column: Rc<RefCell<Option<(usize, String)>>>,
    values: Rc<RefCell<Option<Vec<String>>>>,
    target: Rc<RefCell<Option<HtmlElement>>>,
}

impl ResizableMessage for <FilterDropDown as Component>::Message {
    fn resize(y: i32, x: i32) -> Self {
        FilterDropDownMsg::SetPos(y, x)
    }
}

impl FilterDropDownElement {
    pub fn new(session: Session) -> FilterDropDownElement {
        let document = window().unwrap().document().unwrap();
        let dropdown = document
            .create_element("perspective-filter-dropdown")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        let column: Rc<RefCell<Option<(usize, String)>>> = Rc::new(RefCell::new(None));

        let modal = ModalElement::new(dropdown, (), false);
        let values = Rc::new(RefCell::new(None));
        FilterDropDownElement {
            modal,
            session,
            column,
            values,
            target: Default::default(),
        }
    }

    pub fn reautocomplete(&self) {
        self.modal.open(self.target.borrow().clone().unwrap());
    }

    pub fn autocomplete(
        &self,
        column: (usize, String),
        input: String,
        target: HtmlElement,
        callback: Callback<String>,
    ) {
        let current_column = self.column.borrow().clone();
        match current_column {
            Some(filter_col) if filter_col == column => {
                let values = filter_values(&input, &self.values);
                self.modal.send_message_batch(vec![
                    FilterDropDownMsg::SetCallback(callback),
                    FilterDropDownMsg::SetValues(values),
                ]);
            }
            _ => {
                // TODO is this a race condition? `column` and `values` are out-of-sync
                // across an `await` point.
                *self.column.borrow_mut() = Some(column.clone());
                *self.target.borrow_mut() = Some(target.clone());
                let _ = future_to_promise({
                    let modal = self.modal.clone();
                    let session = self.session.clone();
                    let values_ref = self.values.clone();
                    async move {
                        let values = session.get_column_values(column.1).await?;
                        *values_ref.borrow_mut() = Some(values);
                        let values = filter_values(&input, &values_ref);
                        modal.send_message_batch(vec![
                            FilterDropDownMsg::SetCallback(callback),
                            FilterDropDownMsg::SetValues(values),
                        ]);

                        modal.open(target);
                        Ok(JsValue::UNDEFINED)
                    }
                });
            }
        }
    }

    pub fn item_select(&self) {
        self.modal.send_message(FilterDropDownMsg::ItemSelect);
    }

    pub fn item_down(&self) {
        self.modal.send_message(FilterDropDownMsg::ItemDown);
    }

    pub fn item_up(&self) {
        self.modal.send_message(FilterDropDownMsg::ItemUp);
    }

    pub fn hide(&self) -> Result<(), JsValue> {
        let result = self.modal.hide();
        drop(self.column.borrow_mut().take());
        result
    }

    pub fn connected_callback(&self) {}
}

fn filter_values(
    input: &str,
    values: &Rc<RefCell<Option<Vec<String>>>>,
) -> Vec<String> {
    let input = input.to_lowercase();
    if let Some(values) = &*values.borrow() {
        values
            .iter()
            .filter(|x| x.to_lowercase().contains(&input))
            .take(10)
            .cloned()
            .collect::<Vec<String>>()
    } else {
        vec![]
    }
}
