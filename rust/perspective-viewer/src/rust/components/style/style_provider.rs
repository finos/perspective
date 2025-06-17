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

use web_sys::HtmlStyleElement;
use yew::prelude::*;
use yew::virtual_dom::VNode;

use super::style_cache::StyleCache;

#[derive(Properties, PartialEq)]
pub struct StyleProviderProps {
    pub root: web_sys::HtmlElement,
    #[prop_or(true)]
    pub is_shadow: bool,
    pub children: Children,
}

/// A context which injects any CSS snippet registered within its tree, doing
/// so only once for each unqiue snippet name.
///
/// CSS can be registered within sub-components via the `<LocalStyle>` component
/// and `css!()` resource inlining macro.
pub struct StyleProvider {
    cache: StyleCache,
}

impl Component for StyleProvider {
    type Message = ();
    type Properties = StyleProviderProps;

    fn create(ctx: &Context<Self>) -> Self {
        let cache = StyleCache::new(ctx.props().is_shadow, &ctx.props().root);
        Self { cache }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <ContextProvider<StyleCache> context={self.cache.clone()}>
                { for ctx.props().children.iter() }
            </ContextProvider<StyleCache>>
        }
    }
}

#[derive(Properties, PartialEq)]
struct StyleKeyedProps {
    elem: HtmlStyleElement,
}

/// Necessary only to attach `key` to individual `HtmlStylElement` children,
/// as `yew` does not calculate list updates correctly for sequences of these
/// without keys.
#[function_component(StyleKeyed)]
fn style_renderer(props: &StyleKeyedProps) -> Html {
    VNode::VRef(props.elem.clone().into())
}
