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

use std::fmt::{Debug, Display};
use std::sync::Arc;

use itertools::Itertools;
use strum::IntoEnumIterator;
use yew::{function_component, html, Callback, Properties};

use crate::components::containers::select::{Select, SelectItem};
use crate::components::form::optional_field::OptionalField;

#[derive(Properties, Debug, PartialEq, Clone)]
pub struct SelectEnumFieldProps<T>
where
    T: IntoEnumIterator + Display + Default + PartialEq + Clone + 'static,
{
    pub label: String,
    pub current_value: Option<T>,
    pub on_change: Callback<Option<T>>,

    #[prop_or_default]
    pub default_value: Option<T>,

    #[prop_or_default]
    pub disabled: bool,
}

#[function_component(SelectEnumField)]
pub fn select_enum_field<T>(props: &SelectEnumFieldProps<T>) -> yew::Html
where
    T: IntoEnumIterator + Debug + Display + Default + PartialEq + Clone + 'static,
{
    let values = T::iter().map(SelectItem::Option).collect_vec();
    let selected = props.current_value.clone().unwrap_or_default();
    let checked = selected != props.default_value.clone().unwrap_or_default();
    let reset_value = props.default_value.clone();
    html! {
        <div class="row">
            <OptionalField
                label={props.label.clone()}
                on_check={props.on_change.reform(move |_| reset_value.clone())}
                {checked}
                disabled={props.disabled}
            >
                <Select<T> {values} {selected} on_select={props.on_change.reform(Option::Some)} />
            </OptionalField>
        </div>
    }
}

#[derive(Properties, Debug, PartialEq, Clone)]
pub struct SelectValueFieldProps<T>
where
    T: Display + PartialEq + Clone + 'static,
{
    pub label: String,
    pub current_value: Option<T>,
    pub default_value: T,
    pub values: Arc<Vec<T>>,
    pub on_change: Callback<Option<T>>,

    #[prop_or_default]
    pub disabled: bool,
}

#[function_component(SelectValueField)]
pub fn select_value_field<T>(props: &SelectValueFieldProps<T>) -> yew::Html
where
    T: Display + PartialEq + Clone + 'static,
{
    let values = props
        .values
        .iter()
        .cloned()
        .map(SelectItem::Option)
        .collect_vec();

    let selected = props
        .current_value
        .clone()
        .unwrap_or_else(|| props.default_value.clone());

    let checked = selected != props.default_value;
    html! {
        <div class="row">
            <OptionalField
                label={props.label.clone()}
                on_check={props.on_change.reform(|_| None)}
                {checked}
                disabled={props.disabled}
            >
                <Select<T> {values} {selected} on_select={props.on_change.reform(Option::Some)} />
            </OptionalField>
        </div>
    }
}
