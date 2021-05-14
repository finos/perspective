////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::column_style::*;
use crate::utils::WeakComponentLink;

use std::{cell::RefCell, rc::Rc};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::HtmlElement;
use yew::prelude::*;

type Handler<T> = Rc<RefCell<Option<Closure<dyn Fn(T)>>>>;

/// A `customElements` external API.
#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveColumnStyleElement {
    root: ComponentLink<ColumnStyle>,
    elem: web_sys::HtmlElement,
    blurhandler: Handler<FocusEvent>,
}

/// Calculate the absolute coordinates (top, left) relative to `<body>` of a
/// `target` element.
fn calc_page_position(target: HtmlElement) -> Result<(u32, u32), JsValue> {
    let mut top = 0;
    let mut left = 0;
    let mut elem = target.unchecked_into::<HtmlElement>();
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
            None => JsValue::UNDEFINED.unchecked_into::<HtmlElement>(),
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

fn on_change(elem: &web_sys::HtmlElement, config: &ColumnStyleConfig) {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&JsValue::from_serde(config).unwrap());
    let event = web_sys::CustomEvent::new_with_event_init_dict(
        "perspective-column-style-change",
        &event_init,
    );

    elem.dispatch_event(&event.unwrap()).unwrap();
}

#[wasm_bindgen]
impl PerspectiveColumnStyleElement {
    #[wasm_bindgen(constructor)]
    pub fn new(
        elem: web_sys::HtmlElement,
        js_config: JsValue,
        js_def_config: JsValue,
    ) -> PerspectiveColumnStyleElement {
        let config = js_config.into_serde().unwrap();
        let default_config = js_def_config.into_serde().unwrap();
        elem.set_attribute("tabindex", "0").unwrap();
        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = elem
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        let on_change = {
            let _elem = elem.clone();
            Callback::from(move |x: ColumnStyleConfig| on_change(&_elem, &x.clone()))
        };

        let props = ColumnStyleProps {
            weak_link: WeakComponentLink::default(),
            config,
            on_change,
            default_config,
        };

        let app = App::<ColumnStyle>::new();
        let root = app.mount_with_props(shadow_root, props);
        let blurhandler = Rc::new(RefCell::new(None));
        PerspectiveColumnStyleElement {
            root,
            elem,
            blurhandler,
        }
    }

    /// Open this menu by attaching directly to `document.body` with position
    /// absolutely positioned relative to an alread-connected `target`
    /// element.
    pub fn open(&mut self, target: web_sys::HtmlElement) -> Result<(), JsValue> {
        let height = target.offset_height() as u32;
        let width = target.offset_width() as u32;
        let (top, left) = calc_page_position(target)?;

        // default, top left/bottom left
        let msg = ColumnStyleMsg::SetPos((top + height) as u32, left as u32);
        self.root.send_message(msg);

        let window = web_sys::window().unwrap();
        window
            .document()
            .unwrap()
            .body()
            .unwrap()
            .append_child(&self.elem)?;

        // Check if the menu has been positioned off-screen and re-locate if necessary
        match calc_relative_position(&self.elem, top, left, height, width) {
            None => (),
            Some((top, left)) => {
                let msg = ColumnStyleMsg::SetPos(top as u32, left as u32);
                self.root.send_message(msg);
            }
        };

        let this = self.clone();
        *self.blurhandler.borrow_mut() =
            Some(Closure::wrap(Box::new(move |_event: FocusEvent| {
                this.close().unwrap();
            }) as Box<dyn Fn(FocusEvent)>));

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

    /// Remove from document and cleanup.
    pub fn close(&self) -> Result<(), JsValue> {
        self.elem.remove_event_listener_with_callback(
            "blur",
            self.blurhandler
                .borrow()
                .as_ref()
                .unwrap()
                .as_ref()
                .unchecked_ref(),
        )?;

        // TODO this would happen automatically if we drop() from JS
        *self.blurhandler.borrow_mut() = None;
        web_sys::window()
            .unwrap()
            .document()
            .unwrap()
            .body()
            .unwrap()
            .remove_child(&self.elem)?;

        Ok(())
    }

    pub fn connected_callback(&self) {}
}
