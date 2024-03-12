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

use yew::{classes, function_component, html, Callback, Children, Html, MouseEvent, Properties};

#[derive(Properties, PartialEq)]
pub struct OptionalFieldProps {
    pub label: String,
    pub on_check: Callback<MouseEvent>,
    pub checked: bool,
    pub children: Children,

    #[prop_or(String::from("section"))]
    pub class: String,

    #[prop_or_default]
    pub disabled: bool,
}

#[function_component(OptionalField)]
pub fn optional_field(props: &OptionalFieldProps) -> Html {
    html! {
        <>
            <label style="font-size: 9px">{ props.label.clone() }</label>
            <div
                class={classes!(props.class.clone(), props.checked.then_some("is-default-value"))}
            >
                { props.children.clone() }
                if props.checked {
                    <span
                        class="reset-default-style"
                        onclick={props.on_check.clone()}
                        id={format!("{}-checkbox", props.label.replace(' ', "-"))}
                    />
                } else {
                    <span
                        class="reset-default-style-disabled"
                        id={format!("{}-checkbox", props.label.replace(' ', "-"))}
                    />
                }
            </div>
        </>
    }
}
