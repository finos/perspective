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

/// The state for the `Resizing` action, including the `MouseEvent` callbacks
/// and panel starting dimensions.
struct ResizingState {
    mousemove: Closure<dyn Fn(MouseEvent)>,
    mouseup: Closure<dyn Fn(MouseEvent)>,
    cursor: String,
    index: usize,
    start: i32,
    total: i32,
    alt: i32,
    orientation: Orientation,
    reverse: bool,
    body_style: web_sys::CssStyleDeclaration,
}

impl Drop for ResizingState {
    /// On `drop`, we must remove these event listeners from the document
    /// `body`. Without this, the `Closure` objects would not leak, but the
    /// document will continue to call them, causing runtime exceptions.
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

/// When the instantiated, capture the initial dimensions and create the
/// MouseEvent callbacks.
impl ResizingState {
    pub fn new(
        index: usize,
        client_offset: i32,
        orientation: Orientation,
        reverse: bool,
        split_panel: &Scope<SplitPanel>,
        first_elem: &HtmlElement,
    ) -> Result<ResizingState, JsValue> {
        let document = web_sys::window().unwrap().document().unwrap();
        let body = document.body().unwrap();
        let mut state = ResizingState {
            index,
            cursor: "".to_owned(),
            start: client_offset,
            orientation,
            reverse,
            total: match orientation {
                Orientation::Horizontal => first_elem.offset_width(),
                Orientation::Vertical => first_elem.offset_height(),
            },
            alt: match orientation {
                Orientation::Horizontal => first_elem.offset_height(),
                Orientation::Vertical => first_elem.offset_width(),
            },
            body_style: body.style(),
            mouseup: split_panel
                .callback(|_| SplitPanelMsg::StopResizing)
                .into_closure(),
            mousemove: split_panel
                .callback(move |event: MouseEvent| {
                    SplitPanelMsg::MoveResizing(match orientation {
                        Orientation::Horizontal => event.client_x(),
                        Orientation::Vertical => event.client_y(),
                    })
                })
                .into_closure(),
        };

        state.capture_cursor()?;
        state.register_listeners()?;

        Ok(state)
    }

    fn get_offset(&self, client_offset: i32) -> i32 {
        let delta = if self.reverse {
            self.start - client_offset
        } else {
            client_offset - self.start
        };

        max(0, self.total + delta)
    }

    pub fn get_style(&self, client_offset: i32) -> Option<String> {
        let offset = self.get_offset(client_offset);
        Some(match self.orientation {
            Orientation::Horizontal => format!("width:{}px", offset),
            Orientation::Vertical => format!("height:{}px", offset),
        })
    }

    pub fn get_dimensions(&self, client_offset: i32) -> (i32, i32) {
        let offset = self.get_offset(client_offset);
        match self.orientation {
            Orientation::Horizontal => (std::cmp::max(0, offset), self.alt),
            Orientation::Vertical => (self.alt, std::cmp::max(0, offset)),
        }
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

    /// Helper functions capture and release the global cursor while dragging is
    /// occurring.
    fn capture_cursor(&mut self) -> Result<(), JsValue> {
        self.cursor = self.body_style.get_property_value("cursor")?;
        self.body_style
            .set_property("cursor", match self.orientation {
                Orientation::Horizontal => "col-resize",
                Orientation::Vertical => "row-resize",
            })
    }

    /// " but for release
    fn release_cursor(&self) -> Result<(), JsValue> {
        self.body_style.set_property("cursor", &self.cursor)
    }
}

#[derive(Clone, Copy, PartialEq)]
pub enum Orientation {
    Horizontal,
    Vertical,
}

impl Default for Orientation {
    fn default() -> Orientation {
        Orientation::Horizontal
    }
}

#[derive(Properties, Default)]
pub struct SplitPanelProps {
    pub children: Children,

    #[prop_or_default]
    pub id: Option<String>,

    #[prop_or_default]
    pub orientation: Orientation,

    #[prop_or_default]
    pub reverse: bool,

    #[prop_or_default]
    pub on_reset: Option<Callback<()>>,

    #[prop_or_default]
    pub on_resize: Option<Callback<(i32, i32)>>,

    #[prop_or_default]
    pub on_resize_finished: Option<Callback<()>>,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakScope<SplitPanel>,
}

impl SplitPanelProps {
    fn validate(&self) -> bool {
        !self.children.is_empty()
    }
}

impl PartialEq for SplitPanelProps {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
            && self.children == other.children
            && self.orientation == other.orientation
            && self.reverse == other.reverse
    }
}

pub enum SplitPanelMsg {
    StartResizing(usize, i32),
    MoveResizing(i32),
    StopResizing,
    Reset(usize),
}

/// A panel with 2 sub panels and a mouse-draggable divider which allows
/// apportioning the panel's width.
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
    refs: Vec<NodeRef>,
    styles: Vec<Option<String>>,
    on_reset: Option<Callback<()>>,
}

impl Component for SplitPanel {
    type Message = SplitPanelMsg;
    type Properties = SplitPanelProps;

    fn create(ctx: &Context<Self>) -> Self {
        assert!(ctx.props().validate());
        enable_weak_link_test!(ctx.props(), ctx.link());
        let len = ctx.props().children.len();
        Self {
            resize_state: None,
            refs: vec![Default::default(); len],
            styles: vec![Default::default(); len],
            on_reset: None,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            SplitPanelMsg::Reset(index) => {
                self.styles[index] = None;
                self.on_reset = ctx.props().on_reset.clone();
            }
            SplitPanelMsg::StartResizing(index, client_offset) => {
                let elem = self.refs[index].cast::<HtmlElement>().unwrap();
                let state = ResizingState::new(
                    index,
                    client_offset,
                    ctx.props().orientation,
                    ctx.props().reverse,
                    ctx.link(),
                    &elem,
                );

                self.resize_state = state.ok();
            }
            SplitPanelMsg::StopResizing => {
                self.resize_state = None;
                if let Some(cb) = &ctx.props().on_resize_finished {
                    cb.emit(());
                }
            }
            SplitPanelMsg::MoveResizing(client_offset) => {
                if let Some(state) = self.resize_state.as_ref() {
                    if let Some(ref cb) = ctx.props().on_resize {
                        cb.emit(state.get_dimensions(client_offset));
                    }

                    self.styles[state.index] = state.get_style(client_offset);
                }
            }
        };
        true
    }

    fn rendered(&mut self, _ctx: &Context<Self>, _first_render: bool) {
        if let Some(on_reset) = self.on_reset.take() {
            on_reset.emit(());
        }
    }

    fn changed(&mut self, ctx: &Context<Self>) -> bool {
        assert!(ctx.props().validate());
        let new_len = ctx.props().children.len();
        self.refs.resize(new_len, Default::default());
        self.styles.resize(new_len, Default::default());
        true
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let mut iter = ctx.props().children.iter();
        let orientation = ctx.props().orientation;
        let mut classes = classes!("split-panel");
        if orientation == Orientation::Vertical {
            classes.push("orient-vertical");
        }

        if ctx.props().reverse {
            classes.push("orient-reverse");
        }

        html! {
            <div id={ ctx.props().id.clone() } class={ classes }>
                <SplitPanelChild
                    style={ self.styles[0].clone() }
                    ref_={ self.refs[0].clone() }>

                    { iter.next().unwrap() }
                </SplitPanelChild>
                {
                    for iter.enumerate().map(|(i, x)| {
                        html_template! {
                            <SplitPanelDivider
                                i={ i }
                                orientation={ ctx.props().orientation }
                                link={ ctx.link().clone() }>
                            </SplitPanelDivider>
                            <SplitPanelChild
                                style={ self.styles[i + 1].clone() }
                                ref_={ self.refs[i + 1].clone() }>

                                { x }
                            </SplitPanelChild>
                        }
                    })
                }
            </div>
        }
    }
}

#[derive(Properties)]
struct SplitPanelDividerProps {
    i: usize,
    orientation: Orientation,
    link: Scope<SplitPanel>,
}

impl PartialEq for SplitPanelDividerProps {
    fn eq(&self, rhs: &SplitPanelDividerProps) -> bool {
        self.i == rhs.i && self.orientation == rhs.orientation
    }
}

/// The resize handle for a `SplitPanel`.
#[function_component(SplitPanelDivider)]
fn split_panel_divider(props: &SplitPanelDividerProps) -> Html {
    let orientation = props.orientation;
    let i = props.i;
    let link = props.link.clone();
    let onmousedown = link.callback(move |event: MouseEvent| {
        SplitPanelMsg::StartResizing(i, match orientation {
            Orientation::Horizontal => event.client_x(),
            Orientation::Vertical => event.client_y(),
        })
    });

    let ondblclick = props.link.callback(move |event: MouseEvent| {
        event.prevent_default();
        event.stop_propagation();
        SplitPanelMsg::Reset(i)
    });

    // TODO Not sure why, but under some circumstances this can trugger a
    // `dragstart`, leading to further drag events which cause perspective
    // havoc.  `event.prevent_default()` in `onmousedown` alternatively fixes
    // this, but also prevents this event from trigger focus-stealing e.g. from
    // open dialogs.
    let ondragstart = Callback::from(|event: DragEvent| event.prevent_default());

    html_template! {
        <div
            class="split-panel-divider"
            ondragstart={ ondragstart }
            onmousedown={ onmousedown }
            ondblclick={ ondblclick }>
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct SplitPanelChildProps {
    style: Option<String>,
    ref_: NodeRef,
    children: Children,
}

#[function_component(SplitPanelChild)]
fn split_panel_child(props: &SplitPanelChildProps) -> Html {
    let class = if props.style.is_some() {
        classes!("split-panel-child", "is-width-override")
    } else {
        classes!("split-panel-child")
    };

    html! {
        <div
            class={ class }
            ref={ props.ref_.clone() }
            style={ props.style.clone() }>
            { props.children.iter().next().unwrap() }
        </div>
    }
}
