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

use std::collections::HashSet;

use itertools::Itertools;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::html::ImplicitClone;
use yew::{props, Callback};

use crate::components::row_dropdown::{RowDropDown, RowDropDownMsg, RowDropDownProps};
use crate::custom_elements::modal::*;
use crate::session::Session;
use crate::utils::ApiFuture;
use crate::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct RowDropDownElement {
    column: String,
    modal: ModalElement<RowDropDown>,
    session: Session,
}
impl PartialEq for RowDropDownElement {
    fn eq(&self, other: &Self) -> bool {
        self.column == other.column && self.session == other.session
    }
}

impl ImplicitClone for RowDropDownElement {}

impl RowDropDownElement {
    pub fn new(session: Session, column: String) -> Self {
        let document = window().unwrap().document().unwrap();
        let dropdown = document
            .create_element("perspective-dropdown")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        let props = props!(RowDropDownProps {});
        let modal = ModalElement::new(dropdown, props, false, None);
        Self {
            modal,
            session,
            column,
        }
    }

    pub fn autocomplete(
        &self,
        target: HtmlInputElement,
        exclude: HashSet<String>,
        callback: Callback<String>,
    ) -> Option<()> {
        let input = target.value();
        let lowercase_input = input.to_lowercase();
        clone!(self.modal, self.session, self.column);
        ApiFuture::spawn(async move {
            let values = if lowercase_input.is_empty() {
                vec![]
            } else {
                session
                    .get_column_values(column)
                    .await?
                    .into_iter()
                    .filter(|val| {
                        !exclude.contains(val) && val.to_lowercase().contains(&lowercase_input)
                    })
                    .take(10)
                    .collect_vec()
            };
            let classes = modal.custom_element.class_list();
            let no_results = json!(["no-results"]);
            if values.is_empty() {
                classes.add(&no_results).unwrap();
            } else {
                classes.remove(&no_results).unwrap();
            }

            modal.send_message_batch(vec![
                RowDropDownMsg::SetCallback(callback),
                RowDropDownMsg::SetValues(values, target.get_bounding_client_rect().width()),
            ]);
            modal.open(target.unchecked_into(), None).await
        });

        Some(())
    }

    pub fn item_select(&self) {
        self.modal.send_message(RowDropDownMsg::ItemSelect);
    }

    pub fn item_down(&self) {
        self.modal.send_message(RowDropDownMsg::ItemDown);
    }

    pub fn item_up(&self) {
        self.modal.send_message(RowDropDownMsg::ItemUp);
    }

    pub fn hide(&self) -> ApiResult<()> {
        self.modal.hide()
    }

    pub fn connected_callback(&self) {}
}
