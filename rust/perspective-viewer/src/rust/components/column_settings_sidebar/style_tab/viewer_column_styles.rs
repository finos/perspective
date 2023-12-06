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

mod float;
mod integer;

use float::FloatStyles;
use integer::IntegerStyles;
use yew::{function_component, html, Html, Properties};

use crate::components::column_settings_sidebar::style_tab::stub::Stub;
use crate::config::Type;
use crate::custom_events::CustomEvents;
use crate::presentation::Presentation;
use crate::renderer::Renderer;
use crate::session::Session;

#[derive(Properties, PartialEq)]
pub struct ViewerColumnStyleProps {
    pub renderer: Renderer,
    pub session: Session,
    pub presentation: Presentation,
    pub custom_events: CustomEvents,

    pub maybe_view_ty: Option<Type>,
    pub column_name: String,
}

#[function_component(ViewerColumnStyles)]
pub fn viewer_column_styles(p: &ViewerColumnStyleProps) -> Html {
    match p.maybe_view_ty {
        Some(view_type) => match view_type {
            Type::Integer => html! {
                <IntegerStyles
                    column_name={p.column_name.clone()}
                    presentation={p.presentation.clone()}
                    renderer={p.renderer.clone()}
                    session={p.session.clone()}
                    custom_events={p.custom_events.clone()}
                />
            },
            Type::Float => html! {
                <FloatStyles
                    column_name={p.column_name.clone()}
                    presentation={p.presentation.clone()}
                    renderer={p.renderer.clone()}
                    session={p.session.clone()}
                    custom_events={p.custom_events.clone()}
                />
            },
            _ => html! {},
        },
        None => html! {
            <Stub message="No viewer styles available" error="View type is none!" />
        },
    }
}
