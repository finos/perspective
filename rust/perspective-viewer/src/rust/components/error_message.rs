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

use perspective_client::clone;
use yew::prelude::*;
use yew::{function_component, html, Properties};

use crate::components::style::LocalStyle;
use crate::css;
use crate::session::Session;
use crate::utils::AddListener;

#[derive(PartialEq, Properties)]
pub struct ErrorMessageProps {
    pub session: Session,
}

#[function_component(ErrorMessage)]
pub fn error_message(p: &ErrorMessageProps) -> yew::Html {
    let error = use_state(|| p.session.get_error());
    use_effect_with(
        (error.setter(), p.session.clone()),
        |(set_error, session)| {
            let sub = session.table_errored.add_listener({
                clone!(set_error);
                move |y| set_error.set(y)
            });

            || drop(sub)
        },
    );
    tracing::error!("Fucked");
    html! {
        <>
            <LocalStyle href={css!("render-warning")} />
            <div
                class="plugin_information plugin_information--warning"
                id="plugin_information--size"
            >
                <span class="plugin_information__icon" />
                <span class="plugin_information__text" id="plugin_information_count">
                    if let Some(msg) = error.as_ref() { { msg } }
                </span>
            </div>
        </>
    }
}
