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

use std::fmt::Display;

use itertools::Itertools;
use strum::IntoEnumIterator;
use yew::{function_component, html, Callback, Properties};

use crate::components::containers::select::{Select, SelectItem};
use crate::components::form::optional_field::OptionalField;
use crate::components::form::required_field::RequiredField;

#[derive(Properties, Debug, PartialEq, Clone)]
pub struct SelectFieldProps<T>
where
    T: IntoEnumIterator + Display + Default + PartialEq + Clone + 'static,
{
    pub label: String,
    pub current_value: Option<T>,
    pub on_change: Callback<Option<T>>,
    #[prop_or_default]
    pub disabled: bool,
    #[prop_or_default]
    pub required: bool,
}

#[function_component(SelectField)]
pub fn select_field<T>(props: &SelectFieldProps<T>) -> yew::Html
where
    T: IntoEnumIterator + Display + Default + PartialEq + Clone + 'static,
{
    let values = T::iter().map(SelectItem::Option).collect_vec();
    let selected = props.current_value.clone().unwrap_or_default();
    let checked = selected != T::default();
    html! {
        if props.required {
            <RequiredField label={props.label.clone()}>
                <Select<T> {values} {selected} on_select={props.on_change.reform(Option::Some)} />
            </RequiredField>
        } else {
            <OptionalField
                label={props.label.clone()}
                on_check={props.on_change.reform(|_| None)}
                {checked}
                disabled={props.disabled}
            >
                <Select<T> {values} {selected} on_select={props.on_change.reform(Option::Some)} />
            </OptionalField>
        }
    }
}
