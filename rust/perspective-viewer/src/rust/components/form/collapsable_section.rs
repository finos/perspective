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

use web_sys::Event;
use yew::{function_component, html, Callback, Children, Html, Properties};

#[derive(Properties, PartialEq)]
pub struct CollapsableSectionProps {
    pub label: String,
    pub on_check: Callback<Event>,
    // Should this be state?
    pub checked: bool,
    #[prop_or_default]
    pub disabled: bool,
    #[prop_or_default]
    pub wrapper_class: String,
    pub children: Children,
}

#[function_component(CollapsableSection)]
pub fn collapsable_section(props: &CollapsableSectionProps) -> Html {
    let id = format!("{}-checkbox", props.label.replace(' ', "-"));
    html! {
        <fieldset
            style="border: none; padding-left: 0px; padding-right: 0px;"
            disabled={props.disabled}
        >
            <div
                class="section bool-field"
                style="display:flex"
            >
                <input
                    type="checkbox"
                    id={id.clone()}
                    // this isn't necessary to disable the field but is necessary for the style
                     disabled={props.disabled}
                    onchange={props.on_check.clone()}
                    checked={props.checked}
                />
                <label
                    for={id}
                    style="font-size: 11px;"
                >
                    { props.label.clone() }
                </label>
            </div>
            <div
                class="section"
                style="padding-left: 4px; padding-right: 4px;"
            >
                if props.checked {
                    { props.children.clone() }
                }
            </div>
        </fieldset>
    }
}
