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

use std::rc::Rc;

use derivative::Derivative;
use itertools::Itertools;
use web_sys::{FocusEvent, HtmlInputElement, KeyboardEvent};
use yew::{classes, function_component, html, Callback, Html, Properties, TargetCast};

use crate::clone;
use crate::session::Session;

#[derive(PartialEq, Properties, Derivative)]
#[derivative(Debug)]
pub struct EditableHeaderProps {
    pub icon: Option<Html>,
    pub on_change: Callback<(Option<String>, bool)>,
    pub editable: bool,
    pub initial_value: Option<String>,
    pub placeholder: Rc<String>,
    #[prop_or_default]
    pub reset_count: u8,
    #[derivative(Debug = "ignore")]
    pub session: Session,
}

#[derive(Default, Debug, PartialEq, Copy, Clone)]
pub enum ValueState {
    #[default]
    Unedited,
    Edited,
}

#[function_component(EditableHeader)]
pub fn editable_header(p: &EditableHeaderProps) -> Html {
    let noderef = yew::use_node_ref();
    let value_state = yew::use_state_eq(|| ValueState::Unedited);
    let valid = yew::use_state_eq(|| true);
    let new_value = yew::use_state_eq(|| p.initial_value.clone());

    {
        clone!(new_value, p.initial_value);
        yew::use_effect_with(p.reset_count, move |_| new_value.set(initial_value.clone()));
    }
    {
        clone!(value_state.setter());
        yew::use_effect_with(p.initial_value.clone(), move |_| {
            setter.set(ValueState::Unedited);
        })
    }

    let set_new_value = yew::use_callback(
        (
            new_value.clone(),
            p.on_change.clone(),
            p.initial_value.clone(),
            value_state.clone(),
            valid.clone(),
            p.session.clone(),
        ),
        |s: String, (new_value, on_change, initial_value, value_state, valid, session)| {
            let maybe_s = (!s.is_empty()).then_some(s);
            if maybe_s == *initial_value {
                value_state.set(ValueState::Unedited);
            } else {
                value_state.set(ValueState::Edited);
            }

            let title_is_valid = initial_value == &maybe_s
                || maybe_s
                    .as_ref()
                    .and_then(|s| {
                        let metadata = session.metadata();
                        let expressions = metadata.get_expression_columns();
                        let found = metadata
                            .get_table_columns()?
                            .iter()
                            .chain(expressions)
                            .contains(s);
                        Some(!found)
                    })
                    .unwrap_or(true);

            valid.set(title_is_valid);
            new_value.set(maybe_s.clone());
            on_change.emit((maybe_s, title_is_valid));
        },
    );

    {
        clone!(value_state, new_value);
        yew::use_effect_with(
            (p.editable, p.initial_value.clone()),
            move |(editable, value)| {
                if !editable {
                    value_state.set(ValueState::Unedited);
                }
                new_value.set(value.to_owned());
            },
        );
    }

    let onclick = yew::use_callback(noderef.clone(), |_, noderef| {
        noderef.cast::<HtmlInputElement>().unwrap().focus().unwrap();
    });
    let onblur = yew::use_callback(
        set_new_value.clone(),
        move |e: FocusEvent, set_new_value| {
            let value = e.target_unchecked_into::<HtmlInputElement>().value();
            set_new_value.emit(value);
        },
    );
    let onkeyup = yew::use_callback(
        set_new_value.clone(),
        move |e: KeyboardEvent, set_new_value| {
            let value = e.target_unchecked_into::<HtmlInputElement>().value();
            set_new_value.emit(value);
        },
    );

    let mut classes = classes!("sidebar_header_contents");
    if p.editable {
        classes.push("editable");
    }
    if !*valid {
        classes.push("invalid");
    }
    match *value_state {
        ValueState::Unedited => {},
        ValueState::Edited => classes.push("edited"),
    }
    let split = p
        .placeholder
        .split_once('\n')
        .map(|(a, _)| a)
        .unwrap_or(&p.placeholder);
    let placeholder = match split.char_indices().nth(25) {
        None => split.to_string(),
        Some((idx, _)) => split[..idx].to_owned(),
    };

    html! {
        <div
            class={classes}
            {onclick}
        >
            if let Some(icon) = p.icon.clone() {
                {icon}
            }
            <input
                ref={noderef}
                type="search"
                class="sidebar_header_title"
                disabled={!p.editable}
                {onblur}
                {onkeyup}
                value={(*new_value).clone()}
                {placeholder}
            />
        </div>
    }
}
