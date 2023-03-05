////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

// Forked from https://github.com/AircastDev/yew-virtual-scroller (Apache 2.0)
// Adds support for Yew 0.19, auto-width and a simplified message structure.

use std::ops::Range;
use std::rc::Rc;

use itertools::Itertools;
use web_sys::Element;
use yew::prelude::*;
use yew::virtual_dom::VChild;

use crate::components::style::LocalStyle;
use crate::utils::*;
use crate::*;

#[derive(PartialEq, Properties)]
pub struct ScrollPanelItemProps {
    pub size: f64,
    pub children: Children,
}

pub struct ScrollPanelItem {}

impl Component for ScrollPanelItem {
    type Message = ();
    type Properties = ScrollPanelItemProps;

    fn create(_ctx: &Context<Self>) -> Self {
        Self {}
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        ctx.props().children.iter().collect()
    }
}

pub struct ScrollPanel {
    viewport_ref: NodeRef,
    viewport_height: f64,
    viewport_width: f64,
    content_window: Option<ContentWindow>,
    needs_rerender: bool,
    total_height: f64,
    _dimensions_reset_sub: Option<Subscription>,
    _resize_sub: Option<Subscription>,
}

#[derive(Properties)]
pub struct ScrollPanelProps {
    #[prop_or_default]
    pub children: Vec<VChild<ScrollPanelItem>>,

    #[prop_or_default]
    pub viewport_ref: Option<NodeRef>,

    #[prop_or_default]
    pub class: Classes,

    #[prop_or_default]
    pub id: &'static str,

    #[prop_or_default]
    pub dragenter: Callback<DragEvent>,

    #[prop_or_default]
    pub dragover: Callback<DragEvent>,

    #[prop_or_default]
    pub dragleave: Callback<DragEvent>,

    #[prop_or_default]
    pub on_resize: Option<Rc<PubSub<()>>>,

    #[prop_or_default]
    pub on_dimensions_reset: Option<Rc<PubSub<()>>>,

    #[prop_or_default]
    pub drop: Callback<DragEvent>,
}

impl ScrollPanelProps {
    /// Calculate the total virtual height of this scroll panel from the `size`
    /// prop of its children.
    fn total_height(&self) -> f64 {
        self.children
            .iter()
            .map(|x| x.props.size)
            .reduce(|x, y| x + y)
            .unwrap_or_default()
    }
}

impl PartialEq for ScrollPanelProps {
    fn eq(&self, _rhs: &Self) -> bool {
        false
    }
}

#[doc(hidden)]
pub enum ScrollPanelMsg {
    CalculateWindowContent,
    UpdateViewportDimensions,
    ResetAutoWidth,
}

impl ScrollPanel {
    fn viewport<'a, 'b: 'a, 'c: 'a>(&'b self, ctx: &'c Context<Self>) -> &'a NodeRef {
        ctx.props()
            .viewport_ref
            .as_ref()
            .unwrap_or(&self.viewport_ref)
    }

    fn viewport_elem(&self, ctx: &Context<Self>) -> Element {
        self.viewport(ctx).cast::<Element>().unwrap()
    }
}

#[derive(PartialEq)]
struct ContentWindow {
    scroll_top: f64,
    start_y: f64,
    visible_range: Range<usize>,
}

impl Component for ScrollPanel {
    type Message = ScrollPanelMsg;
    type Properties = ScrollPanelProps;

    fn create(ctx: &Context<Self>) -> Self {
        let _dimensions_reset_sub = ctx.props().on_dimensions_reset.as_ref().map(|pubsub| {
            let link = ctx.link().clone();
            pubsub.add_listener(move |_| {
                link.send_message_batch(vec![
                    ScrollPanelMsg::ResetAutoWidth,
                    ScrollPanelMsg::CalculateWindowContent,
                ])
            })
        });

        let _resize_sub = ctx.props().on_resize.as_ref().map(|pubsub| {
            let link = ctx.link().clone();
            pubsub.add_listener(move |_| {
                link.send_message_batch(vec![
                    ScrollPanelMsg::UpdateViewportDimensions,
                    ScrollPanelMsg::CalculateWindowContent,
                ])
            })
        });

        let total_height = ctx.props().total_height();
        Self {
            viewport_ref: Default::default(),
            viewport_height: 0f64,
            viewport_width: 0f64,
            content_window: None,
            needs_rerender: true,
            total_height,
            _dimensions_reset_sub,
            _resize_sub,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            ScrollPanelMsg::ResetAutoWidth => {
                self.viewport_width = 0.0;
                false
            }
            ScrollPanelMsg::UpdateViewportDimensions => {
                let viewport = self.viewport_elem(ctx);
                let rect = viewport.get_bounding_client_rect();
                self.viewport_height = rect.height() - 8.0;
                self.viewport_width = max!(self.viewport_width, rect.width() - 6.0);
                false
            }
            ScrollPanelMsg::CalculateWindowContent => {
                let viewport = self.viewport_elem(ctx);
                let scroll_top = viewport.scroll_top() as f64;
                let mut start_node = 0;
                let mut start_y = 0_f64;
                let mut offset = 0_f64;
                let end_node = ctx
                    .props()
                    .children
                    .iter()
                    .enumerate()
                    .find_or_last(|(i, x)| {
                        if offset + x.props.size < scroll_top {
                            start_node = *i + 1;
                            start_y = offset + x.props.size;
                        }

                        offset += x.props.size;
                        offset > scroll_top + self.viewport_height
                    })
                    .map(|x| x.0)
                    .unwrap_or_default();

                // Why is this `end_node + 2`, I can see you asking yourself? `end_node` is the
                // index of the last visible child, but [`Range`] is an open interval so we must
                // increment by 1. The next rendered element is always occluded by the parent
                // container, it may seem unnecessary to render it, however not doing so causing
                // scroll glitching in Chrome:
                // * When the first pixel of the `end_node + 1` child is scrolled into view, the
                //   container element it is embedded in will expand past the end of the scroll
                //   container.
                // * Chrome detects this and helpfuls scrolls this new element into view,
                //   retriggering the on scroll callback.
                let visible_range = start_node..min!(ctx.props().children.len(), end_node + 2);
                self.content_window = Some(ContentWindow {
                    scroll_top,
                    start_y,
                    visible_range,
                });

                true
            }
        }
    }

    /// If the new total row height is different than last time this component
    /// was rendered, we need to double-render to read the container's
    /// potentially updated height.
    fn changed(&mut self, ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        let total_height = ctx.props().total_height();
        self.needs_rerender =
            self.needs_rerender || (self.total_height - total_height).abs() > 0.1f64;
        self.total_height = total_height;
        ctx.link().send_message_batch(vec![
            ScrollPanelMsg::UpdateViewportDimensions,
            ScrollPanelMsg::CalculateWindowContent,
        ]);

        false
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let content_style = format!("height:{}px", self.total_height);
        let (window_style, windowed_items) = match &self.content_window {
            None => ("".to_string(), &[][..]),
            Some(cw) => (
                format!(
                    "position:sticky;top:0;transform:translateY({}px);",
                    cw.start_y - cw.scroll_top
                ),
                (&ctx.props().children[cw.visible_range.clone()]),
            ),
        };

        let width_style = format!("width:{}px", max!(self.viewport_width, 0.0));
        let items = if !windowed_items.is_empty() {
            let onscroll = ctx.link().batch_callback(|_| {
                vec![
                    ScrollPanelMsg::UpdateViewportDimensions,
                    ScrollPanelMsg::CalculateWindowContent,
                ]
            });

            // TODO This glitches - we should use the `sticky` positioning strategy that
            // `regular-table` uses.
            html! {
                <div
                    ref={ self.viewport(ctx) }
                    id={ ctx.props().id }
                    onscroll={ onscroll }
                    ondragover={ &ctx.props().dragover }
                    ondragenter={ &ctx.props().dragenter }
                    ondragleave={ &ctx.props().dragleave }
                    ondrop={ &ctx.props().drop }
                    class={ ctx.props().class.clone() }>

                    <div class="scroll-panel-container" style={ window_style }>
                        { for windowed_items.iter().cloned().map(Html::from) }
                        <div
                            class="scroll-panel-auto-width"
                            style={ width_style }>
                        </div>
                    </div>
                    <div class="scroll-panel-content" style={ content_style }>

                    </div>
                </div>
            }
        } else {
            html! {
                <div
                    ref={ self.viewport(ctx) }
                    id={ ctx.props().id }
                    class={ ctx.props().class.clone() }>

                    <div style={ content_style }>
                    </div>
                </div>
            }
        };

        html_template! {
            <LocalStyle href={ css!("containers/scroll-panel") } />
            { items }
        }
    }

    fn rendered(&mut self, ctx: &Context<Self>, first_render: bool) {
        if first_render || self.needs_rerender {
            self.needs_rerender = false;
            ctx.link().send_message_batch(vec![
                ScrollPanelMsg::UpdateViewportDimensions,
                ScrollPanelMsg::CalculateWindowContent,
            ]);
        }
    }
}
