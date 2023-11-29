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

use web_sys::{FocusEvent, HtmlInputElement, KeyboardEvent};
use yew::{classes, function_component, html, Callback, Html, Properties, TargetCast};

use crate::clone;

#[derive(PartialEq, Debug, Properties)]
pub struct EditableHeaderProps {
    pub icon: Option<Html>,
    pub on_value_update: Callback<String>,
    pub editable: bool,
    pub value: String,
    pub default_value: Rc<String>,
}

#[derive(Default, Debug, PartialEq, Copy, Clone)]
pub enum ValueState {
    #[default]
    Unedited,
    Edited,
    Empty,
}

#[function_component(EditableHeader)]
pub fn editable_header(p: &EditableHeaderProps) -> Html {
    let noderef = yew::use_node_ref();
    let value_state = yew::use_state_eq(|| ValueState::Unedited);
    let new_value = yew::use_state_eq(|| p.value.clone());
    let focused = yew::use_state_eq(|| false);

    {
        clone!(value_state, new_value);
        yew::use_effect_with((p.editable, p.value.clone()), move |(editable, value)| {
            if !editable {
                value_state.set(ValueState::Unedited);
            }
            new_value.set(value.to_owned());
        });
    }

    let set_value_state = yew::use_callback(
        (value_state.clone(), p.value.clone()),
        move |target_value: String, (value_state, p_value)| {
            if target_value.is_empty() {
                value_state.set(ValueState::Empty);
            } else if &target_value != p_value {
                value_state.set(ValueState::Edited);
            } else {
                value_state.set(ValueState::Unedited);
            }
        },
    );

    let on_value_update = {
        clone!(value_state);
        p.on_value_update.reform(move |target_value: String| {
            value_state.set(ValueState::Unedited);
            target_value
        })
    };

    let onclick = yew::use_callback(noderef.clone(), |_, noderef| {
        noderef.cast::<HtmlInputElement>().unwrap().focus().unwrap();
    });
    let onfocus = yew::use_callback(focused.clone(), |_, focused| {
        focused.set(true);
    });
    // TODO: Autosave on blur?
    let onblur = yew::use_callback(
        (set_value_state.clone(), focused.clone(), new_value.clone()),
        move |e: FocusEvent, (set_value_state, focused, new_value)| {
            let value = e.target_unchecked_into::<HtmlInputElement>().value();
            set_value_state.emit(value.clone());
            new_value.set(value.trim().to_owned());
            focused.set(false);
        },
    );
    let onkeyup = yew::use_callback(
        (
            on_value_update.clone(),
            set_value_state.clone(),
            new_value.clone(),
        ),
        move |e: KeyboardEvent, (on_value_update, set_value_state, new_value)| {
            let target = e.target_unchecked_into::<HtmlInputElement>();
            let mut target_value = target.value();
            set_value_state.emit(target_value.clone());

            if let "Enter" = &*e.key() && !target_value.is_empty() {
                target_value = target_value.trim().to_owned();
                on_value_update.emit(target_value.clone());
            }
            new_value.set(target_value.clone());
        },
    );

    let mut classes = classes!("sidebar_header_contents");
    if p.editable {
        classes.push("editable");
    }
    match *value_state {
        ValueState::Unedited => {},
        ValueState::Edited => classes.push("edited"),
        ValueState::Empty => classes.push("empty"),
    }
    if *focused {
        classes.push("focused");
    }
    let split = p
        .default_value
        .split_once('\n')
        .map(|(a, _)| a)
        .unwrap_or(&p.default_value);
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
                {onfocus}
                value={(*new_value).clone()}
                {placeholder}
            />
        </div>
    }
}
