////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;
use crate::*;

use std::cmp::max;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::HtmlElement;
use yew::html::Scope;
use yew::prelude::*;

/// The state for the `Resizing` action, including the `MouseEvent` callbacks and
/// panel starting dimensions.
struct ResizingState {
    mousemove: Closure<dyn Fn(MouseEvent)>,
    mouseup: Closure<dyn Fn(MouseEvent)>,
    cursor: String,
    start: i32,
    width: i32,
    body_style: web_sys::CssStyleDeclaration,
}

impl Drop for ResizingState {
    /// On `drop`, we must remove these event listeners from the document `body`.
    /// Without this, the `Closure` objects would not leak, but the document will
    /// continue to call them, causing runtime exceptions.
    fn drop(&mut self) {
        let result: Result<(), JsValue> = maybe! {
            let document = web_sys::window().unwrap().document().unwrap();
            let body = document.body().unwrap();
            let mousemove = self.mousemove.as_ref().unchecked_ref();
            body.remove_event_listener_with_callback("mousemove", mousemove)?;

            let mouseup = self.mouseup.as_ref().unchecked_ref();
            body.remove_event_listener_with_callback("mouseup", mouseup)?;

            self.release_cursor()?;
            Ok(())
        };

        result.expect("Drop failed")
    }
}

/// When the instantiated, capture the initial dimensions and create the MouseEvent
/// callbacks.
impl ResizingState {
    pub fn new(
        client_x: i32,
        split_panel: &Scope<SplitPanel>,
        first_elem: &HtmlElement,
    ) -> Result<ResizingState, JsValue> {
        let document = web_sys::window().unwrap().document().unwrap();
        let body = document.body().unwrap();
        let mut state = ResizingState {
            cursor: "".to_owned(),
            start: client_x,
            width: first_elem.offset_width(),
            body_style: body.style(),
            mouseup: split_panel
                .callback(|_| SplitPanelMsg::StopResizing)
                .into_closure(),
            mousemove: split_panel
                .callback(|event: MouseEvent| {
                    let client_x = event.client_x();
                    SplitPanelMsg::MoveResizing(client_x)
                })
                .into_closure(),
        };

        state.capture_cursor()?;
        state.register_listeners()?;

        Ok(state)
    }

    /// Adds the event listeners, the corollary of `Drop`.
    fn register_listeners(&self) -> Result<(), JsValue> {
        let document = web_sys::window().unwrap().document().unwrap();
        let body = document.body().unwrap();
        let mousemove = self.mousemove.as_ref().unchecked_ref();
        body.add_event_listener_with_callback("mousemove", mousemove)?;

        let mouseup = self.mouseup.as_ref().unchecked_ref();
        body.add_event_listener_with_callback("mouseup", mouseup)
    }

    /// Helpr functions capture and release the global cursor while dragging is
    /// occurring.
    fn capture_cursor(&mut self) -> Result<(), JsValue> {
        self.cursor = self.body_style.get_property_value("cursor")?;
        self.body_style.set_property("cursor", "col-resize")
    }

    /// " but for release
    fn release_cursor(&self) -> Result<(), JsValue> {
        self.body_style.set_property("cursor", &self.cursor)
    }
}

#[derive(Properties, Clone, Default)]
pub struct SplitPanelProps {
    pub id: String,
    pub children: Children,

    #[prop_or_default]
    pub on_resize: Option<Callback<(i32, i32)>>,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakScope<SplitPanel>,
}

impl PartialEq for SplitPanelProps {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id && self.children == other.children
    }
}

pub enum SplitPanelMsg {
    StartResizing(i32),
    MoveResizing(i32),
    StopResizing,
    Reset,
}

fn validate(props: &SplitPanelProps) -> bool {
    props.children.len() == 2
}

/// A panel with 2 sub panels and a mouse-draggable divider which allows apportioning
/// the panel's width.
///
/// # Examples
///
/// ```
/// html! {
///     <SplitPanel id="app_panel">
///         <div id="A">
///         <div id="B">
///             <a href=".."></a>
///         </div>
///     </SplitPanel>
/// }
/// ```
pub struct SplitPanel {
    resize_state: Option<ResizingState>,
    first_elem: NodeRef,
    style: Option<String>,
}

impl Component for SplitPanel {
    type Message = SplitPanelMsg;
    type Properties = SplitPanelProps;

    fn create(ctx: &Context<Self>) -> Self {
        assert!(validate(ctx.props()));
        enable_weak_link_test!(ctx.props(), ctx.link());
        Self {
            resize_state: None,
            first_elem: NodeRef::default(),
            style: None,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            SplitPanelMsg::Reset => self.style = None,
            SplitPanelMsg::StartResizing(client_x) => {
                let first = self.first_elem.cast::<HtmlElement>().unwrap();
                let state = ResizingState::new(client_x, ctx.link(), &first).ok();
                self.resize_state = state;
            }
            SplitPanelMsg::StopResizing => {
                self.resize_state = None;
            }
            SplitPanelMsg::MoveResizing(client_x) => {
                self.style = self.resize_state.as_ref().map(|state| {
                    let width = max(0, state.width + (client_x - state.start));
                    if let Some(ref cb) = ctx.props().on_resize {
                        cb.emit((std::cmp::max(0, width), 400));
                    }

                    format!("width: {}px", width)
                })
            }
        };
        true
    }

    fn changed(&mut self, ctx: &Context<Self>) -> bool {
        assert!(validate(ctx.props()));
        true
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let mut iter = ctx.props().children.iter().take(2);
        let _ref = self.first_elem.clone();
        let style = self.style.clone();
        let onmousedown = ctx.link().callback(|event: MouseEvent| {
            event.prevent_default();
            event.stop_propagation();
            SplitPanelMsg::StartResizing(event.client_x())
        });

        let ondblclick = ctx.link().callback(|event: MouseEvent| {
            event.prevent_default();
            event.stop_propagation();
            SplitPanelMsg::Reset
        });

        let class = if style.is_some() {
            "split-panel-child is-width-override"
        } else {
            "split-panel-child"
        };

        html! {
            <div id={ ctx.props().id.clone() } class="split-panel">
                <div class={ class } ref={ _ref } style={ style }>
                    { iter.next().unwrap() }
                </div>
                <div
                    class="split-panel-divider"
                    onmousedown={onmousedown}
                    ondblclick={ondblclick}>
                </div>
                <div class="split-panel-child">
                    { iter.next().unwrap() }
                </div>
            </div>
        }
    }
}
