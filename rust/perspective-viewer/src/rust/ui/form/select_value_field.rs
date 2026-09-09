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
use std::rc::Rc;

use itertools::Itertools;
use yew::{Callback, Properties, function_component, html};

use crate::ui::containers::select::{Select, SelectItem};
use crate::ui::form::optional_field::OptionalField;

#[derive(Properties, Debug, PartialEq, Clone)]
pub struct SelectValueFieldProps<T>
where
    T: Display + PartialEq + Clone + 'static,
{
    pub current_value: Option<T>,
    pub default_value: T,
    pub label: String,
    pub on_change: Callback<Option<T>>,
    pub values: Rc<Vec<T>>,

    #[prop_or_default]
    pub disabled: bool,
}

#[function_component(SelectValueField)]
pub fn select_value_field<T>(props: &SelectValueFieldProps<T>) -> yew::Html
where
    T: Display + PartialEq + Clone + 'static,
{
    let values = yew::use_memo(props.values.clone(), |values| {
        values.iter().cloned().map(SelectItem::Option).collect_vec()
    });

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
