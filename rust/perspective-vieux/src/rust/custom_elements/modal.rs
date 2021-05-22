////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::prelude::*;

/// A `ModalElement` wraps the parameterized yew `Component` in a Custom Element.
/// Via the `open()` and `close()` methods, a `ModalElement` can be positioned next
/// to any existing on-page elements, accounting for viewport, scroll position, etc.
pub struct ModalElement<T: Component> {
    root: ComponentLink<T>,
    elem: HtmlElement,
    target: Rc<RefCell<Option<HtmlElement>>>,
    blurhandler: Rc<RefCell<Option<Closure<dyn FnMut(FocusEvent)>>>>,
}

// `#[derive(Clone)]` generates the trait bound `T: Clone`, which is not required
// because `ComponentLink<T>` implements Clone without this bound;  thus `Clone`
// must be implemented by hand.
impl<T> Clone for ModalElement<T>
where
    T: Component,
{
    fn clone(&self) -> Self {
        ModalElement {
            root: self.root.clone(),
            elem: self.elem.clone(),
            target: self.target.clone(),
            blurhandler: self.blurhandler.clone(),
        }
    }
}

/// Calculate the absolute coordinates (top, left) relative to `<body>` of a
/// `target` element.
fn calc_page_position(target: &HtmlElement) -> Result<(u32, u32), JsValue> {
    let mut top = 0;
    let mut left = 0;
    let mut elem = target.clone().unchecked_into::<HtmlElement>();
    while !elem.is_undefined() {
        let is_sticky = match web_sys::window().unwrap().get_computed_style(&elem)? {
            Some(x) => x.get_property_value("position")? == "sticky",
            _ => false,
        };

        top += elem.offset_top();
        left += elem.offset_left();
        elem = match elem.offset_parent() {
            Some(elem) => {
                if is_sticky {
                    top -= elem.scroll_top();
                    left -= elem.scroll_left();
                }
                elem.unchecked_into::<HtmlElement>()
            }
            None => match elem.dyn_into::<ShadowRoot>() {
                Ok(root) => root.host().unchecked_into::<HtmlElement>(),
                Err(_) => JsValue::UNDEFINED.unchecked_into::<HtmlElement>(),
            },
        };
    }

    Ok((top as u32, left as u32))
}

/// Given the bounds of the target element as previous computed, as well as the
/// browser's viewport and the bounds of the already-connected
/// `<perspectuve-style-menu>` element itself, determine a new (top, left)
/// coordinates that keeps the element on-screen.
fn calc_relative_position(
    elem: &HtmlElement,
    top: u32,
    left: u32,
    height: u32,
    width: u32,
) -> Option<(u32, u32)> {
    let window = web_sys::window().unwrap();
    let rect = elem.get_bounding_client_rect();
    let inner_width = window.inner_width().unwrap().as_f64().unwrap() as u32;
    let inner_height = window.inner_height().unwrap().as_f64().unwrap() as u32;
    let rect_top = rect.top() as u32;
    let rect_height = rect.height() as u32;
    let rect_width = rect.width() as u32;
    let rect_left = rect.left() as u32;

    let elem_over_y = inner_height < rect_top + rect_height;
    let elem_over_x = inner_width < rect_left + rect_width;
    let target_over_x = inner_width < rect_left + width;
    let target_over_y = inner_height < rect_top + height;

    match (elem_over_y, elem_over_x, target_over_x, target_over_y) {
        (true, _, true, true) => {
            // bottom right/top left
            Some((top - rect_height, left - rect_width))
        }
        (true, _, true, false) => {
            // bottom right, bottom left
            Some((top - rect_height + height, left - rect_width))
        }
        (true, true, false, _) => {
            // bottom right/top right
            Some((top - rect_height, left + width - rect_width))
        }
        (true, false, false, _) => {
            // bottom left/top left
            Some((top - rect_height, left))
        }
        (false, true, true, _) => {
            // top right/top left
            Some((top, left - rect_width))
        }
        (false, true, false, _) => {
            // top right/bottom right
            Some((top + height, left + width - rect_width))
        }
        _ => None,
    }
}

pub trait ResizableMessage {
    fn resize(y: u32, x: u32) -> Self;
}

impl<T> ModalElement<T>
where
    T: Component,
    <T as Component>::Message: ResizableMessage,
{
    pub fn new(elem: web_sys::HtmlElement, props: T::Properties) -> ModalElement<T> {
        elem.set_attribute("tabindex", "0").unwrap();
        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = elem
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        let app = App::<T>::new();
        let root = app.mount_with_props(shadow_root, props);
        let blurhandler = Rc::new(RefCell::new(None));
        ModalElement {
            root,
            elem,
            target: Rc::new(RefCell::new(None)),
            blurhandler,
        }
    }

    fn open_within_viewport(&mut self, target: HtmlElement) -> Result<(), JsValue> {
        let height = target.offset_height() as u32;
        let width = target.offset_width() as u32;
        let (top, left) = calc_page_position(&target)?;
        *self.target.borrow_mut() = Some(target);

        // Default, top left/bottom left
        let msg = T::Message::resize((top + height) as u32, left as u32);
        self.root.send_message(msg);

        let window = web_sys::window().unwrap();
        window
            .document()
            .unwrap()
            .body()
            .unwrap()
            .append_child(&self.elem)?;

        // Check if the modal has been positioned off-screen and re-locate if necessary
        match calc_relative_position(&self.elem, top, left, height, width) {
            None => (),
            Some((top, left)) => {
                let msg = T::Message::resize(top as u32, left as u32);
                self.root.send_message(msg);
            }
        };

        let mut this = self.clone();
        *self.blurhandler.borrow_mut() =
            Some(Closure::wrap(Box::new(move |_event: FocusEvent| {
                this.close().unwrap();
            }) as Box<dyn FnMut(FocusEvent)>));

        self.elem.add_event_listener_with_callback(
            "blur",
            self.blurhandler
                .borrow()
                .as_ref()
                .unwrap()
                .as_ref()
                .unchecked_ref(),
        )?;

        self.elem.focus()
    }

    /// Open this modal by attaching directly to `document.body` with position
    /// absolutely positioned relative to an alread-connected `target`
    /// element.
    ///
    /// Because the Custom Element has a `blur` handler, we must invoke this before
    /// attempting to re-parent the element.
    pub fn open(&mut self, target: web_sys::HtmlElement) -> Result<(), JsValue> {
        self.elem.blur().unwrap();
        let window = web_sys::window().unwrap();
        let mut this = self.clone();
        window.request_animation_frame(
            Closure::once_into_js(move || this.open_within_viewport(target))
                .unchecked_ref(),
        )?;
        Ok(())
    }

    /// Remove from document and cleanup.
    pub fn close(&mut self) -> Result<(), JsValue> {
        self.elem.remove_event_listener_with_callback(
            "blur",
            self.blurhandler
                .borrow()
                .as_ref()
                .unwrap()
                .as_ref()
                .unchecked_ref(),
        )?;

        *self.blurhandler.borrow_mut() = None;
        web_sys::window()
            .unwrap()
            .document()
            .unwrap()
            .body()
            .unwrap()
            .remove_child(&self.elem)?;

    
        let target = self.target.borrow_mut().take().unwrap();
        let event = web_sys::CustomEvent::new("-perspective-close-expression")?;        
        target.dispatch_event(&event)?;
        Ok(())
    }
}
