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

use web_sys::{FocusEvent, HtmlInputElement, KeyboardEvent};
use yew::{classes, function_component, html, Callback, Html, Properties, TargetCast};

use crate::clone;

#[derive(PartialEq, Debug, Properties)]
pub struct EditableHeaderProps {
    pub icon: Option<Html>,
    pub on_value_update: Callback<String>,
    pub editable: bool,
    pub value: String,
}

#[derive(Default, Debug, PartialEq, Copy, Clone)]
pub enum ValueState {
    #[default]
    Unedited,
    Focused,
    Edited,
    Errored,
}

#[function_component(EditableHeader)]
pub fn editable_header(p: &EditableHeaderProps) -> Html {
    let noderef = yew::use_node_ref();
    let value_state = yew::use_state_eq(|| ValueState::Unedited);
    let new_value = yew::use_state_eq(|| p.value.clone());

    {
        clone!(value_state, new_value);
        yew::use_effect_with((p.editable, p.value.clone()), move |(editable, value)| {
            if !editable {
                value_state.set(ValueState::Unedited);
            }
            new_value.set(value.to_owned());
        });
    }

    let onclick = yew::use_callback(noderef.clone(), |_, noderef| {
        noderef.cast::<HtmlInputElement>().unwrap().focus().unwrap();
    });
    let onfocus = yew::use_callback(value_state.clone(), |_, value_state| {
        value_state.set(ValueState::Focused);
    });
    let onblur = yew::use_callback(
        (value_state.clone(), new_value.clone(), p.value.clone()),
        move |e: FocusEvent, (value_state, new_value, value)| {
            let target_value = e.target_unchecked_into::<HtmlInputElement>().value();
            if target_value.is_empty() {
                value_state.set(ValueState::Errored);
            } else if target_value != *value {
                value_state.set(ValueState::Edited);
            } else {
                value_state.set(ValueState::Unedited);
            }
            new_value.set(target_value);

            // Alternative implementation: Autosave on blur.
            // Autosave feels really bad bc we close the sidebar on save rn.
        },
    );

    let onkeydown = yew::use_callback(
        (p.on_value_update.clone(), value_state.clone()),
        move |e: KeyboardEvent, (on_value_update, value_state)| match &*e.key() {
            "Enter" | "Tab" => {
                if !matches!(**value_state, ValueState::Errored) {
                    on_value_update.emit(e.target_unchecked_into::<HtmlInputElement>().value());
                    value_state.set(ValueState::Unedited)
                }
            }
            _ => {}
        },
    );

    let mut classes = classes!("sidebar_header_contents");
    if p.editable {
        classes.push("editable");
    }
    match *value_state {
        ValueState::Unedited => {}
        ValueState::Focused => classes.push("focused"),
        ValueState::Edited => classes.push("edited"),
        ValueState::Errored => classes.push("errored"),
    }

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
                type="text"
                class="sidebar_header_title"
                disabled={!p.editable}
                {onblur}
                {onkeydown}
                {onfocus}
                value={(*new_value).clone()}
            />
        </div>
    }
}
