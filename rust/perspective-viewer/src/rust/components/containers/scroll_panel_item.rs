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

// Forked from https://github.com/AircastDev/yew-virtual-scroller (Apache 2.0)
// Adds support for Yew 0.19, auto-width and a simplified message structure.

#[cfg(debug_assertions)]
use std::cell::Cell;
#[cfg(debug_assertions)]
use std::rc::Rc;

use yew::prelude::*;

#[derive(PartialEq, Properties)]
pub struct ScrollPanelItemProps {
    /// The expected size of this component in pixels. Calculating this value
    /// ahead of time makes it easier to implement a high-performance virtual
    /// renderer without resorting to weird tricks, _but_ checking that this
    /// hint is correct is nearly as expensive. So, we only generate the
    /// validation code in debug builds.
    pub size_hint: f64,
    pub children: Children,

    #[cfg(debug_assertions)]
    #[prop_or_default]
    measured_size: Rc<Cell<Option<f64>>>,
}

impl ScrollPanelItemProps {
    #[cfg(debug_assertions)]
    pub fn get_size(&self) -> f64 {
        self.measured_size.get().unwrap_or(self.size_hint)
    }

    #[cfg(not(debug_assertions))]
    pub fn get_size(&self) -> f64 {
        self.size_hint
    }
}

#[cfg(debug_assertions)]
pub struct ScrollPanelItem {
    node: NodeRef,
}

#[cfg(not(debug_assertions))]
pub struct ScrollPanelItem {}

impl Component for ScrollPanelItem {
    type Message = ();
    type Properties = ScrollPanelItemProps;

    #[cfg(debug_assertions)]
    fn create(ctx: &Context<Self>) -> Self {
        ctx.props().measured_size.set(Some(ctx.props().size_hint));
        Self {
            node: NodeRef::default(),
        }
    }

    #[cfg(not(debug_assertions))]
    fn create(_ctx: &Context<Self>) -> Self {
        Self {}
    }

    #[cfg(debug_assertions)]
    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <div class="debug-size-wrapper" style="display:grid" ref={ self.node.clone() }>
                { for ctx.props().children.iter() }
            </div>
        }
    }

    #[cfg(not(debug_assertions))]
    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            { for ctx.props().children.iter() }
        }
    }

    #[cfg(debug_assertions)]
    fn changed(&mut self, ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        ctx.props().measured_size.set(Some(ctx.props().size_hint));
        true
    }

    #[cfg(debug_assertions)]
    fn rendered(&mut self, ctx: &Context<Self>, first_render: bool) {
        if first_render {
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
