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

use yew::{Callback, Children, Html, MouseEvent, Properties, classes, function_component, html};

use crate::ui::form::intl_label::IntlLabel;

#[derive(Properties, PartialEq)]
pub struct OptionalFieldProps {
    pub checked: bool,
    pub children: Children,
    pub label: String,
    pub on_check: Callback<MouseEvent>,

    #[prop_or(String::from("section"))]
    pub class: String,

    #[prop_or_default]
    pub disabled: bool,
}

#[function_component(OptionalField)]
pub fn optional_field(props: &OptionalFieldProps) -> Html {
    html! {
        <>
            <IntlLabel name={props.label.clone()} />
            <div
                class={classes!(props.class.clone(), props.checked.then_some("is-default-value"))}
            >
                { props.children.clone() }
                if props.checked {
                    <span
                        class="reset-default-style"
                        onclick={props.on_check.clone()}
                        id={format!("{}-checkbox", props.label)}
                    />
                } else {
                    <span
                        class="reset-default-style-disabled"
                        id={format!("{}-checkbox", props.label)}
                    />
                }
            </div>
        </>
    }
}
