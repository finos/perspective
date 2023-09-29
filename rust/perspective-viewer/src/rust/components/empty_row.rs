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
use std::rc::Rc;

use web_sys::*;
use yew::prelude::*;

use crate::components::style::LocalStyle;
use crate::css;
use crate::custom_elements::RowDropDownElement;

#[derive(Default)]
pub struct EmptyRow {
    input_ref: NodeRef,
}

#[derive(Properties)]
pub struct EmptyRowProps {
    pub row_dropdown: Rc<RowDropDownElement>,
    pub exclude: HashSet<String>,
    pub on_select: Callback<String>,
    pub focused: bool,
    pub index: usize,
    pub set_focused_index: Callback<Option<usize>>,
    pub value: String,
}

impl PartialEq for EmptyRowProps {
    fn eq(&self, _other: &Self) -> bool {
        false
    }
}

pub enum EmptyRowMsg {
    KeyDown(u32),
    Blur,
    Input,
    Focus,
}

use EmptyRowMsg::*;

impl Component for EmptyRow {
    type Message = EmptyRowMsg;
    type Properties = EmptyRowProps;

    fn view(&self, ctx: &Context<Self>) -> Html {
        let onblur = ctx.link().callback(|_| Blur);
        let oninput = ctx.link().callback(|_| Input);
        let onkeydown = ctx
            .link()
            .callback(|event: KeyboardEvent| KeyDown(event.key_code()));

        if ctx.props().focused {
            // do this on the next render cycle so we know the ref is there
            ctx.link().callback(|_| Focus).emit(());
        }

        html! {
            <div class="pivot-column column-empty">
                <LocalStyle href={ css!("empty-column") } />
                <input
                    spellcheck="false"
                    ref={ self.input_ref.clone() }
                    { onblur }
                    { onkeydown }
                    { oninput }
                    class="column-empty-input"
                />
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
        ctx.props().row_dropdown.hide().unwrap();
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        let p = ctx.props();
        match msg {
            Focus => {
                if let Some(elem) = self.input_ref.cast::<HtmlInputElement>() {
                    elem.set_value(&ctx.props().value);
                    elem.focus().unwrap();
                }

                false
            }
            Blur => {
                p.row_dropdown.hide().unwrap();
                if let Some(elem) = self.input_ref.cast::<HtmlInputElement>() {
                    elem.set_value("");
                }
                p.set_focused_index.emit(Some(p.index + 1));

                false
            }
            KeyDown(40) => {
                p.row_dropdown.item_down();
                false
            }
            KeyDown(38) => {
                p.row_dropdown.item_up();
                false
            }
            KeyDown(13) => {
                p.row_dropdown.item_select();
                p.row_dropdown.hide().unwrap();
                p.set_focused_index.emit(Some(p.index + 1));
                true
            }
            KeyDown(_) => false,
            Input => {
                if let Some(elem) = self.input_ref.cast::<HtmlInputElement>() {
                    ctx.props().row_dropdown.autocomplete(
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
