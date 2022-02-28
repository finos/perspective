////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;

use derivative::Derivative;
use std::cell::{Cell, RefCell};
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::prelude::*;

type BlurHandlerType = Rc<RefCell<Option<Closure<dyn FnMut(FocusEvent)>>>>;

/// A `ModalElement` wraps the parameterized yew `Component` in a Custom Element.
/// Via the `open()` and `close()` methods, a `ModalElement` can be positioned next
/// to any existing on-page elements, accounting for viewport, scroll position, etc.
///
///`#[derive(Clone)]` generates the trait bound `T: Clone`, which is not required
/// because `Scope<T>` implements Clone without this bound;  thus `Clone`
/// must be implemented by the `derivative` crate's
/// [custom bounds](https://mcarton.github.io/rust-derivative/latest/Debug.html#custom-bound)
/// support.
#[derive(Derivative)]
#[derivative(Clone(bound = ""))]
pub struct ModalElement<T: Component> {
    root: Rc<RefCell<Option<AppHandle<T>>>>,
    custom_element: HtmlElement,
    target: Rc<RefCell<Option<HtmlElement>>>,
    blurhandler: BlurHandlerType,
    own_focus: bool,
    resize_sub: Rc<RefCell<Option<Subscription>>>,
    anchor: Rc<Cell<ModalAnchor>>,
}

/// Anchor point enum, `ModalCornerTargetCorner`
#[derive(Clone, Copy)]
enum ModalAnchor {
    BottomRightTopLeft,
    BottomRightBottomLeft,
    BottomRightTopRight,
    BottomLeftTopLeft,
    TopRightTopLeft,
    TopRightBottomRight,
    TopLeftBottomLeft,
}

impl Default for ModalAnchor {
    fn default() -> ModalAnchor {
        ModalAnchor::TopLeftBottomLeft
    }
}

impl ModalAnchor {
    fn is_rev_vert(&self) -> bool {
        matches!(
            self,
            ModalAnchor::BottomLeftTopLeft
                | ModalAnchor::BottomRightBottomLeft
                | ModalAnchor::BottomRightTopLeft
                | ModalAnchor::BottomRightTopRight
        )
    }
}

/// Given the bounds of the target element as previous computed, as well as the
/// browser's viewport and the bounds of the already-connected
/// `<perspectuve-style-menu>` element itself, determine a new (top, left)
/// coordinates that keeps the element on-screen.
fn calc_relative_position(
    elem: &HtmlElement,
    _top: i32,
    left: i32,
    height: i32,
    width: i32,
) -> ModalAnchor {
    let window = web_sys::window().unwrap();
    let rect = elem.get_bounding_client_rect();
    let inner_width = window.inner_width().unwrap().as_f64().unwrap() as i32;
    let inner_height = window.inner_height().unwrap().as_f64().unwrap() as i32;
    let rect_top = rect.top() as i32;
    let rect_height = rect.height() as i32;
    let rect_width = rect.width() as i32;
    let rect_left = rect.left() as i32;

    let elem_over_y = inner_height < rect_top + rect_height;
    let elem_over_x = inner_width < rect_left + rect_width;
    let target_over_x = inner_width < rect_left + width;
    let target_over_y = inner_height < rect_top + height;

    // modal/target
    match (elem_over_y, elem_over_x, target_over_x, target_over_y) {
        (true, _, true, true) => ModalAnchor::BottomRightTopLeft,
        (true, _, true, false) => ModalAnchor::BottomRightBottomLeft,
        (true, true, false, _) => {
            if left + width - rect_width > 0 {
                ModalAnchor::BottomRightTopRight
            } else {
                ModalAnchor::BottomLeftTopLeft
            }
        }
        (true, false, false, _) => ModalAnchor::BottomLeftTopLeft,
        (false, true, true, _) => ModalAnchor::TopRightTopLeft,
        (false, true, false, _) => {
            if left + width - rect_width > 0 {
                ModalAnchor::TopRightBottomRight
            } else {
                ModalAnchor::TopLeftBottomLeft
            }
        }
        _ => ModalAnchor::TopLeftBottomLeft,
    }
}

pub trait ResizableMessage {
    fn resize(y: i32, x: i32, rev_vert: bool) -> Self;
}

impl<T> ModalElement<T>
where
    T: Component,
    <T as Component>::Message: ResizableMessage,
{
    pub fn new(
        custom_element: web_sys::HtmlElement,
        props: T::Properties,
        own_focus: bool,
    ) -> ModalElement<T> {
        custom_element.set_attribute("tabindex", "0").unwrap();
        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = custom_element
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        let root = Rc::new(RefCell::new(Some(yew::start_app_with_props_in_element(
            shadow_root,
            props,
        ))));

        let blurhandler = Rc::new(RefCell::new(None));
        ModalElement {
            root,
            custom_element,
            target: Rc::new(RefCell::new(None)),
            own_focus,
            blurhandler,
            resize_sub: Rc::new(RefCell::new(None)),
            anchor: Default::default(),
        }
    }

    fn calc_anchor_position(&self, target: &HtmlElement) -> (i32, i32) {
        let height = target.offset_height() as i32;
        let width = target.offset_width() as i32;
        let elem = target.clone().unchecked_into::<HtmlElement>();
        let rect = elem.get_bounding_client_rect();
        let top = rect.top() as i32;
        let left = rect.left() as i32;

        let self_rect = self.custom_element.get_bounding_client_rect();
        let rect_height = self_rect.height() as i32;
        let rect_width = self_rect.width() as i32;

        match self.anchor.get() {
            ModalAnchor::BottomRightTopLeft => {
                (top - rect_height, left - rect_width + 1)
            }
            ModalAnchor::BottomRightBottomLeft => {
                (top - rect_height + height, left - rect_width + 1)
            }
            ModalAnchor::BottomRightTopRight => {
                (top - rect_height + 1, left + width - rect_width)
            }
            ModalAnchor::BottomLeftTopLeft => (top - rect_height + 1, left),
            ModalAnchor::TopRightTopLeft => (top, left - rect_width + 1),
            ModalAnchor::TopRightBottomRight => {
                (top + height - 1, left + width - rect_width)
            }
            ModalAnchor::TopLeftBottomLeft => ((top + height - 1), left),
        }
    }

    fn open_within_viewport(&mut self, target: HtmlElement) -> Result<(), JsValue> {
        let height = target.offset_height() as i32;
        let width = target.offset_width() as i32;
        let elem = target.clone().unchecked_into::<HtmlElement>();
        let rect = elem.get_bounding_client_rect();
        let top = rect.top() as i32;
        let left = rect.left() as i32;

        *self.target.borrow_mut() = Some(target.clone());

        // Default, top left/bottom left
        let msg = T::Message::resize((top + height - 1) as i32, left as i32, false);
        self.root.borrow().as_ref().unwrap().send_message(msg);

        let window = web_sys::window().unwrap();
        window
            .document()
            .unwrap()
            .body()
            .unwrap()
            .append_child(&self.custom_element)?;

        // Check if the modal has been positioned off-screen and re-locate if necessary
        self.anchor.set(calc_relative_position(
            &self.custom_element,
            top,
            left,
            height,
            width,
        ));

        let (top, left) = self.calc_anchor_position(&target);
        let msg = T::Message::resize(top, left, self.anchor.get().is_rev_vert());
        self.root.borrow().as_ref().unwrap().send_message(msg);

        if self.own_focus {
            let mut this = Some(self.clone());
            *self.blurhandler.borrow_mut() = Some(
                (move |_| this.take().and_then(|x| x.hide().ok()).unwrap_or(()))
                    .into_closure_mut(),
            );

            self.custom_element.add_event_listener_with_callback(
                "blur",
                self.blurhandler
                    .borrow()
                    .as_ref()
                    .unwrap()
                    .as_ref()
                    .unchecked_ref(),
            )?;

            self.custom_element.focus()
        } else {
            Ok(())
        }
    }

    pub fn send_message(&self, msg: T::Message) {
        self.root.borrow().as_ref().unwrap().send_message(msg)
    }

    pub fn send_message_batch(&self, msg: Vec<T::Message>) {
        self.root.borrow().as_ref().unwrap().send_message_batch(msg)
    }

    /// Open this modal by attaching directly to `document.body` with position
    /// absolutely positioned relative to an alread-connected `target`
    /// element.
    ///
    /// Because the Custom Element has a `blur` handler, we must invoke this before
    /// attempting to re-parent the element.
    pub fn open(
        &self,
        target: web_sys::HtmlElement,
        resize_pubsub: Option<&PubSub<()>>,
    ) {
        if let Some(resize) = resize_pubsub {
            let this = self.clone();
            let target = target.clone();
            let anchor = self.anchor.clone();
            *self.resize_sub.borrow_mut() = Some(resize.add_listener(move |()| {
                let (top, left) = this.calc_anchor_position(&target);
                let msg = T::Message::resize(top, left, anchor.get().is_rev_vert());
                this.root.borrow().as_ref().unwrap().send_message(msg);
            }));
        };

        if !self.is_open() {
            self.custom_element.blur().unwrap();
            let window = web_sys::window().unwrap();
            let mut this = self.clone();
            window
                .request_animation_frame(
                    Closure::once_into_js(move || {
                        target.class_list().add_1("modal-target")?;
                        let theme = get_theme(&target);
                        this.open_within_viewport(target)?;
                        if let Some(theme) = theme {
                            this.custom_element.set_attribute("theme", &theme)?;
                        }

                        Ok(())
                    })
                    .unchecked_ref(),
                )
                .unwrap();
        }
    }

    pub fn is_open(&self) -> bool {
        self.custom_element.is_connected()
    }

    /// Remove from document.
    pub fn hide(&self) -> Result<(), JsValue> {
        if self.is_open() {
            if self.own_focus {
                self.custom_element.remove_event_listener_with_callback(
                    "blur",
                    self.blurhandler
                        .borrow()
                        .as_ref()
                        .unwrap()
                        .as_ref()
                        .unchecked_ref(),
                )?;

                *self.blurhandler.borrow_mut() = None;
            }

            web_sys::window()
                .unwrap()
                .document()
                .unwrap()
                .body()
                .unwrap()
                .remove_child(&self.custom_element)?;

            let target = self.target.borrow_mut().take().unwrap();
            let event = web_sys::CustomEvent::new("-perspective-close-expression")?;
            target.class_list().remove_1("modal-target").unwrap();
            if get_theme(&target).is_some() {
                self.custom_element.remove_attribute("theme")?;
            }

            target.dispatch_event(&event)?;
        }

        Ok(())
    }

    /// Remove from document and cleanup.
    pub fn destroy(self) -> Result<(), JsValue> {
        self.hide()?;
        self.root.borrow_mut().take().unwrap().destroy();
        Ok(())
    }
}

fn get_theme(elem: &HtmlElement) -> Option<String> {
    let styles = window().unwrap().get_computed_style(elem).unwrap().unwrap();
    styles
        .get_property_value("--theme-name")
        .ok()
        .and_then(|x| {
            let trimmed = x.trim();
            if !trimmed.is_empty() {
                Some(trimmed[1..trimmed.len() - 1].to_owned())
            } else {
                None
            }
        })
}
