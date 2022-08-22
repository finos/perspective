////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::style_cache::StyleCache;
use crate::*;
use web_sys::HtmlStyleElement;
use yew::prelude::*;
use yew::virtual_dom::VNode;

#[derive(Properties, PartialEq)]
pub struct StyleProviderProps {
    pub children: Children,
}

/// A context which injects any CSS snippet registered within its tree, doing
/// so only once for each unqiue snippet name.  CSS can be registered within
/// sub-components via the `<LocalStyle>` component and `css!()` resource
/// inlining macro.
pub struct StyleProvider {
    cache: StyleCache,
}

impl Component for StyleProvider {
    type Message = ();
    type Properties = StyleProviderProps;

    fn create(_ctx: &Context<Self>) -> Self {
        let cache = StyleCache::default();
        StyleProvider { cache }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let styles = self.cache.iter_styles();
        html_template! {
            {
                for styles.map(|x| {
                    html! {
                        <StyleKeyed key={ x.0 } elem={ x.1 } />
                    }
                })
            }
            <ContextProvider<StyleCache> context={ self.cache.clone() }>
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
