////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;

use derivative::Derivative;
use std::cell::RefCell;
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
}

/// Given the bounds of the target element as previous computed, as well as the
/// browser's viewport and the bounds of the already-connected
/// `<perspectuve-style-menu>` element itself, determine a new (top, left)
/// coordinates that keeps the element on-screen.
fn calc_relative_position(
    elem: &HtmlElement,
    top: i32,
    left: i32,
    height: i32,
    width: i32,
) -> Option<(i32, i32)> {
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

    // target/moadl
    match (elem_over_y, elem_over_x, target_over_x, target_over_y) {
        (true, _, true, true) => {
            // bottom right/top left
            Some((top - rect_height, left - rect_width + 1))
        }
        (true, _, true, false) => {
            // bottom right, bottom left
            Some((top - rect_height + height, left - rect_width + 1))
        }
        (true, true, false, _) => {
            if left + width - rect_width > 0 {
                // bottom right/top right
                Some((top - rect_height + 1, left + width - rect_width))
            } else {
                // bottom left/top left
                Some((top - rect_height + 1, left))
            }
        }
        (true, false, false, _) => {
            // bottom left/top left
            Some((top - rect_height + 1, left))
        }
        (false, true, true, _) => {
            // top right/top left
            Some((top, left - rect_width + 1))
        }
        (false, true, false, _) => {
            if left + width - rect_width > 0 {
                // top right/bottom right
                Some((top + height - 1, left + width - rect_width))
            } else {
                None
            }
        }
        _ => None,
    }
}

pub trait ResizableMessage {
    fn resize(y: i32, x: i32) -> Self;
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
        }
    }

    fn open_within_viewport(&mut self, target: HtmlElement) -> Result<(), JsValue> {
        let height = target.offset_height() as i32;
        let width = target.offset_width() as i32;
        let elem = target.clone().unchecked_into::<HtmlElement>();
        let rect = elem.get_bounding_client_rect();
        let top = rect.top() as i32;
        let left = rect.left() as i32;

        *self.target.borrow_mut() = Some(target);

        // Default, top left/bottom left
        let msg = T::Message::resize((top + height - 1) as i32, left as i32);
        self.root.borrow().as_ref().unwrap().send_message(msg);

        let window = web_sys::window().unwrap();
        window
            .document()
            .unwrap()
            .body()
            .unwrap()
            .append_child(&self.custom_element)?;

        // Check if the modal has been positioned off-screen and re-locate if necessary
        match calc_relative_position(&self.custom_element, top, left, height, width) {
            None => (),
            Some((top, left)) => {
                let msg = T::Message::resize(top as i32, left as i32);
                self.root.borrow().as_ref().unwrap().send_message(msg);
            }
        };

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
    pub fn open(&self, target: web_sys::HtmlElement) {
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
                            this.custom_element.set_attribute("data-perspective-theme", &theme)?;
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
                self.custom_element.remove_attribute("data-perspective-theme")?;
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
