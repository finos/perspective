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

mod expression_editor;

use std::rc::Rc;

use expression_editor::ExprEditorAttr;
use yew::{function_component, html, Callback, Html, Properties};

use crate::components::viewer::ColumnLocator;
use crate::custom_events::CustomEvents;
use crate::html_template;
use crate::renderer::Renderer;
use crate::session::Session;

#[derive(PartialEq, Clone, Properties)]
pub struct AttributesTabProps {
    pub column_name: String,
    pub selected_column: ColumnLocator,
    pub on_close: Callback<()>,
    pub session: Session,
    pub renderer: Renderer,
    pub custom_events: CustomEvents,
    pub on_input: Callback<Rc<String>>,
}

#[function_component]
pub fn AttributesTab(p: &AttributesTabProps) -> Html {
    html_template! {
        <div id="attributes-tab">
            <div class="tab-section">
                <ExprEditorAttr
                    on_close={p.on_close.clone()}
                    column_name={p.column_name.clone()}
                    selected_column={p.selected_column.clone()}
                    session={p.session.clone()}
                    renderer={p.renderer.clone()}
                    on_input={p.on_input.clone()}
                />
            </div>
        </div>
    }
}
