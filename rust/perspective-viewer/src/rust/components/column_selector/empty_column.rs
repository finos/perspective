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

use std::collections::HashSet;

use web_sys::*;
use yew::prelude::*;

use crate::components::style::LocalStyle;
use crate::config::Expression;
use crate::css;
use crate::custom_elements::ColumnDropDownElement;

#[derive(Default)]
pub struct EmptyColumn {
    input_ref: NodeRef,
}

#[derive(Clone, Debug)]
pub enum InPlaceColumn {
    Column(String),
    // ExpressionAlias(String),
    Expression(Expression<'static>),
}

#[derive(Properties)]
pub struct EmptyColumnProps {
    pub column_dropdown: ColumnDropDownElement,
    pub exclude: HashSet<String>,
    pub on_select: Callback<InPlaceColumn>,
}

impl PartialEq for EmptyColumnProps {
    fn eq(&self, _other: &Self) -> bool {
        false
    }
}

pub enum EmptyColumnMsg {
    KeyDown(u32),
    Blur,
    Input,
}

use EmptyColumnMsg::*;

impl Component for EmptyColumn {
    type Message = EmptyColumnMsg;
    type Properties = EmptyColumnProps;

    fn view(&self, ctx: &Context<Self>) -> Html {
        let onblur = ctx.link().callback(|_| Blur);
        let oninput = ctx.link().callback(|_| Input);
        let onkeydown = ctx
            .link()
            .callback(|event: KeyboardEvent| KeyDown(event.key_code()));

        html! {
            <div class="pivot-column column-empty">
                <LocalStyle href={ css!("empty-column") } />
                <input
                    spellcheck="false"
                    ref={ self.input_ref.clone() }
                    { onblur }
                    { onkeydown }
                    { oninput }
                    class="column-empty-input" />
            </div>
        }
    }

    fn changed(&mut self, _ctx: &Context<Self>, _old_props: &Self::Properties) -> bool {
        if let Some(elem) = self.input_ref.cast::<HtmlInputElement>() {
            elem.blur().unwrap();
        }

        false
    }

    fn destroy(&mut self, ctx: &Context<Self>) {
        ctx.props().column_dropdown.hide().unwrap();
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Blur => {
                ctx.props().column_dropdown.hide().unwrap();
                if let Some(elem) = self.input_ref.cast::<HtmlInputElement>() {
                    elem.set_value("");
                }

                false
            }
            KeyDown(40) => {
                ctx.props().column_dropdown.item_down();
                false
            }
            KeyDown(38) => {
                ctx.props().column_dropdown.item_up();
                false
            }
            KeyDown(13) => {
                ctx.props().column_dropdown.item_select();
                ctx.props().column_dropdown.hide().unwrap();
                false
            }
            KeyDown(_) => false,
            Input => {
                if let Some(elem) = self.input_ref.cast::<HtmlInputElement>() {
                    ctx.props().column_dropdown.autocomplete(
                        elem,
                        ctx.props().exclude.clone(),
                        ctx.props().on_select.clone(),
                    );
                }

                false
            }
        }
    }

    fn create(_ctx: &Context<Self>) -> Self {
        Self::default()
    }
}
