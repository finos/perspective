////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

// Forked from https://github.com/AircastDev/yew-virtual-scroller (Apache 2.0)
// Adds support for Yew 0.19, auto-width and a simplified message structure.

use crate::utils::*;
use crate::*;

use std::marker::PhantomData;
use std::ops::Range;
use std::rc::Rc;
use web_sys::Element;
use yew::prelude::*;

pub struct ScrollPanel<T>
where
    T: Into<Html> + Clone + PartialEq + 'static,
{
    viewport_ref: NodeRef,
    viewport_height: f64,
    viewport_width: f64,
    content_window: Option<ContentWindow>,
    needs_rerender: bool,
    total_height: f64,
    _props: PhantomData<T>,
    _dimensions_reset_sub: Option<Subscription>,
    _resize_sub: Option<Subscription>,
}

#[derive(Properties, Clone)]
pub struct ScrollPanelProps<T>
where
    T: Into<Html> + Clone + PartialEq + 'static,
{
    pub items: Rc<Vec<T>>,
    pub row_height: f64,

    // Named rows are not the same size as the other columns.
    #[prop_or_default]
    pub named_row_count: usize,

    #[prop_or_default]
    pub named_row_height: f64,

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

impl<T> PartialEq for ScrollPanelProps<T>
where
    T: Into<Html> + Clone + PartialEq + 'static,
{
    fn eq(&self, _rhs: &ScrollPanelProps<T>) -> bool {
        false
    }
}

impl<T> ScrollPanelProps<T>
where
    T: Into<Html> + Clone + PartialEq + 'static,
{
    fn total_height(&self, ctx: &Context<ScrollPanel<T>>) -> f64 {
        let named_col_section_height =
            ctx.props().named_row_count as f64 * ctx.props().named_row_height;

        (max!(0, ctx.props().items.len() - ctx.props().named_row_count) as f64)
            .mul_add(ctx.props().row_height, named_col_section_height)
    }
}

#[doc(hidden)]
pub enum ScrollPanelMsg {
    CalculateWindowContent,
    UpdateViewportDimensions,
    ResetAutoWidth,
}

struct ContentWindow {
    start_y: f64,
    visible_range: Range<usize>,
}

impl<T> Component for ScrollPanel<T>
where
    T: Into<Html> + Clone + PartialEq + 'static,
{
    type Message = ScrollPanelMsg;
    type Properties = ScrollPanelProps<T>;

    fn create(ctx: &Context<Self>) -> Self {
        let link = ctx.link().clone();
        let _dimensions_reset_sub = ctx.props().on_dimensions_reset.as_ref().map(|pubsub| {
            pubsub.add_listener(move |_| {
                link.send_message_batch(vec![
                    ScrollPanelMsg::ResetAutoWidth,
                    ScrollPanelMsg::CalculateWindowContent,
                ])
            })
        });

        let link = ctx.link().clone();
        let _resize_sub = ctx.props().on_resize.as_ref().map(|pubsub| {
            pubsub.add_listener(move |_| {
                link.send_message_batch(vec![
                    ScrollPanelMsg::UpdateViewportDimensions,
                    ScrollPanelMsg::CalculateWindowContent,
                ])
            })
        });

        Self {
            viewport_ref: Default::default(),
            viewport_height: 0f64,
            viewport_width: 0f64,
            content_window: None,
            needs_rerender: true,
            total_height: ctx.props().total_height(ctx),
            _props: PhantomData,
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
                let viewport = self.viewport_ref.cast::<Element>().unwrap();
                self.viewport_height = viewport.client_height() as f64;
                self.viewport_width = {
                    let new_width = viewport.client_width() as f64;
                    max!(self.viewport_width, new_width)
                };

                false
            }
            ScrollPanelMsg::CalculateWindowContent => {
                let viewport = self.viewport_ref.cast::<Element>().unwrap();
                let named_col_section_height =
                    ctx.props().named_row_count as f64 * ctx.props().named_row_height;

                let scroll_top = viewport.scroll_top() as f64;
                let start_node = if scroll_top > named_col_section_height {
                    max!(
                        0,
                        ((scroll_top / ctx.props().row_height).floor() as usize
                            + ctx.props().named_row_count) as isize,
                    ) as usize
                } else {
                    max!(0.0, (scroll_top / ctx.props().named_row_height).floor()) as usize
                };

                let total_visible = min!(
                    ((self.viewport_height / ctx.props().row_height).ceil()) as usize + 2,
                    max!(0, ctx.props().items.len() as isize - start_node as isize) as usize,
                );

                let start_y = (max!(
                    0,
                    start_node as isize - ctx.props().named_row_count as isize,
                ) as f64)
                    .mul_add(
                        ctx.props().row_height,
                        min!(ctx.props().named_row_count, start_node) as f64
                            * ctx.props().named_row_height,
                    );

                let end_node = start_node + total_visible;
                if end_node > ctx.props().items.len() {
                    viewport.set_scroll_top(0);
                    false
                } else {
                    self.content_window = Some(ContentWindow {
                        start_y,
                        visible_range: start_node..end_node,
                    });
                    true
                }
            }
        }
    }

    /// If the new total row height is different than last time this component
    /// was rendered, we need to double-render to read the container's
    /// potentially updated height.
    fn changed(&mut self, ctx: &Context<Self>) -> bool {
        let total_height = ctx.props().total_height(ctx);
        self.needs_rerender = (self.total_height - total_height).abs() > 0.1f64;
        self.total_height = total_height;
        ctx.link()
            .send_message(ScrollPanelMsg::CalculateWindowContent);

        false
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let content_style = format!("height:{}px", self.total_height);
        let (window_style, windowed_items) = match &self.content_window {
            None => ("".to_string(), vec![]),
            Some(cw) => (
                format!("transform: translateY({}px);", cw.start_y),
                (&ctx.props().items[cw.visible_range.clone()]).into(),
            ),
        };

        let width_style = format!("width:{}px", max!(self.viewport_width, 0.0));
        if !windowed_items.is_empty() {
            let items = windowed_items.into_iter().map(|item| item.into());
            let onscroll = ctx.link().batch_callback(|_| {
                vec![
                    ScrollPanelMsg::UpdateViewportDimensions,
                    ScrollPanelMsg::CalculateWindowContent,
                ]
            });

            html! {
                <div
                    ref={ self.viewport_ref.clone() }
                    id={ ctx.props().id }
                    onscroll={ onscroll }
                    ondragover={ &ctx.props().dragover }
                    ondragenter={ &ctx.props().dragenter }
                    ondragleave={ &ctx.props().dragleave }
                    ondrop={ &ctx.props().drop }
                    class={ ctx.props().class.clone() }>

                    <div class="scroll-panel-content" style={ content_style }>
                        <div class="scroll-panel-container" style={ window_style }>
                            { for items }
                            <div class="scroll-panel-auto-width" style={ width_style }>
                            </div>
                        </div>
                    </div>
                </div>
            }
        } else {
            html! {
                <div
                    ref={ self.viewport_ref.clone() }
                    id={ ctx.props().id }
                    class={ ctx.props().class.clone() }>

                    <div style={ content_style }>
                    </div>
                </div>
            }
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
