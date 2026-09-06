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

use wasm_bindgen::{JsCast, JsValue};
use yew::prelude::*;

#[derive(Properties, PartialEq)]
pub struct StyleProviderProps {
    pub root: web_sys::HtmlElement,
    #[prop_or(true)]
    pub is_shadow: bool,
    pub sheet: web_sys::CssStyleSheet,
    pub children: Children,
}

pub struct StyleProvider;

impl Component for StyleProvider {
    type Message = ();
    type Properties = StyleProviderProps;

    fn create(ctx: &Context<Self>) -> Self {
        adopt_sheet(ctx.props());
        Self
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! { <>{ for ctx.props().children.iter() }</> }
    }
}

fn adopt_sheet(props: &StyleProviderProps) {
    let root: JsValue = if props.is_shadow {
        props.root.shadow_root().unwrap().into()
    } else {
        web_sys::window().unwrap().document().unwrap().into()
    };

    let sheets = js_sys::Reflect::get(&root, &"adoptedStyleSheets".into())
        .unwrap()
        .unchecked_into::<js_sys::Array>();

    let sheet_val: &JsValue = props.sheet.as_ref();
    if sheets.index_of(sheet_val, 0) < 0 {
        sheets.push(sheet_val);
    }
}
