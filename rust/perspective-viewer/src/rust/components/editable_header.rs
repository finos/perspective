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
    pub on_change: Callback<Option<String>>,
    pub on_submit: Callback<Option<String>>,
    pub editable: bool,
    pub value: Option<String>,
    pub placeholder: Rc<String>,
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
    let initial_value = yew::use_state_eq(|| p.value.clone());
    let value_state = yew::use_state_eq(|| ValueState::Unedited);
    let new_value = yew::use_state_eq(|| p.value.clone());
    let set_new_value = yew::use_callback(
        (
            new_value.clone(),
            p.on_change.clone(),
            initial_value.clone(),
            value_state.clone(),
        ),
        |s: String, (new_value, on_change, initial_value, value_state)| {
            let maybe_s = (!s.is_empty()).then_some(s);
            if maybe_s == **initial_value {
                value_state.set(ValueState::Unedited);
            } else {
                value_state.set(ValueState::Edited);
            }
            new_value.set(maybe_s.clone());
            on_change.emit(maybe_s);
        },
    );

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

    let on_submit = {
        clone!(value_state, initial_value);
        p.on_submit.reform(move |target_value: String| {
            let new_value = (!target_value.is_empty()).then_some(target_value);
            initial_value.set(new_value.clone());
            value_state.set(ValueState::Unedited);
            new_value
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
        (focused.clone(), set_new_value.clone()),
        move |e: FocusEvent, (focused, set_new_value)| {
            let value = e.target_unchecked_into::<HtmlInputElement>().value();
            set_new_value.emit(value.trim().to_owned());
            focused.set(false);
        },
    );
    let onkeyup = yew::use_callback(
        (on_submit.clone(), set_new_value.clone()),
        move |e: KeyboardEvent, (on_submit, set_new_value)| {
            let target = e.target_unchecked_into::<HtmlInputElement>();
            let target_value = target.value().trim().to_owned();
            set_new_value.emit(target_value.clone());
            if let "Enter" = &*e.key() {
                on_submit.emit(target_value);
            }
        },
    );

    let mut classes = classes!("sidebar_header_contents");
    if p.editable {
        classes.push("editable");
    }
    match *value_state {
        ValueState::Unedited => {},
        ValueState::Edited => classes.push("edited"),
    }
    if *focused {
        classes.push("focused");
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
                {onfocus}
                value={(*new_value).clone()}
                {placeholder}
            />
        </div>
    }
}
