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

use std::cell::Cell;
use std::rc::Rc;

use yew::prelude::*;

#[derive(PartialEq, Properties)]
pub struct ScrollPanelItemProps {
    pub children: Children,

    pub size_hint: f64,

    #[prop_or_default]
    pub is_debug_mode: bool,

    #[prop_or_default]
    measured_size: Rc<Cell<Option<f64>>>,
}

impl ScrollPanelItemProps {
    pub(crate) fn get_size(&self) -> f64 {
        if self.is_debug_mode {
            self.measured_size.get().unwrap_or(self.size_hint)
        } else {
            self.size_hint
        }
    }
}

pub struct ScrollPanelItem {
    node: NodeRef,
}

impl Component for ScrollPanelItem {
    type Message = ();
    type Properties = ScrollPanelItemProps;

    fn create(ctx: &Context<Self>) -> Self {
        if ctx.props().is_debug_mode {
            ctx.props().measured_size.set(Some(ctx.props().size_hint));
        }

        Self {
            node: NodeRef::default(),
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            if ctx.props().is_debug_mode {
                <div class="debug-size-wrapper" style="display: flow-root" ref={self.node.clone()}>
                    for child in ctx.props().children.iter() {
                        { child }
                    }
                </div>
            } else {
                for child in ctx.props().children.iter() {
                    { child }
                }
            }
        }
    }

    fn changed(&mut self, ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        if ctx.props().is_debug_mode {
            ctx.props().measured_size.set(Some(ctx.props().size_hint));
        }

        true
    }

    fn rendered(&mut self, ctx: &Context<Self>, first_render: bool) {
        if first_render && ctx.props().is_debug_mode {
            let elem = self.node.cast::<web_sys::HtmlElement>().unwrap();
            let new_height = elem.get_bounding_client_rect().height();
            if ctx.props().measured_size.get() != Some(new_height) {
                tracing::warn!(
                    "ScrollPanel size_hint does not match element size: {} != {}",
                    ctx.props().size_hint,
                    new_height
                );
                web_sys::console::warn_1(&elem);
                ctx.props().measured_size.set(Some(new_height));
            }
        }
    }
}
