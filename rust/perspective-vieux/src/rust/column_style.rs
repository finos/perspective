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
fn calc_page_position(target: HtmlElement) -> Result<(i32, i32), JsValue> {
    let mut top = target.offset_height();
    let mut left = 0;
    let mut elem = target;
    while !elem.is_undefined() {
        let is_sticky = match web_sys::window().unwrap().get_computed_style(&elem)? {
            Some(x) => x.get_property_value("position")? == "sticky",
            _ => false,
        };

        top += elem.offset_top();
        left += elem.offset_left();
        elem = match elem.offset_parent() {
            Some(elem) => {
                let elem = elem.unchecked_into::<HtmlElement>();
                if is_sticky {
                    top -= elem.scroll_top();
                    left -= elem.scroll_left();
                }
                elem
            }
            None => JsValue::UNDEFINED.unchecked_into::<HtmlElement>(),
        };
    }

    Ok((top, left))
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
        let (top, left) = calc_page_position(target)?;
        self.root
            .send_message(ColumnStyleMsg::SetPos(top as u32, left as u32));

        web_sys::window()
            .unwrap()
            .document()
            .unwrap()
            .body()
            .unwrap()
            .append_child(&self.elem)?;

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
