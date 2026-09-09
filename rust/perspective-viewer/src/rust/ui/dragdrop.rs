// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

use std::cell::Cell;
use std::rc::Rc;

use perspective_client::clone;
use perspective_js::utils::*;
use wasm_bindgen::prelude::*;
use web_sys::*;
use yew::prelude::*;

use crate::js::{IntersectionObserver, IntersectionObserverEntry};

pub type DragEndCallback = Closure<dyn FnMut(DragEvent)>;
pub type PointerDownCallback = Closure<dyn FnMut(PointerEvent)>;

pub fn closest_draggable(event: &Event) -> Option<HtmlElement> {
    event
        .composed_path()
        .get(0)
        .dyn_into::<Element>()
        .ok()?
        .closest("[draggable=\"true\"]")
        .ok()
        .flatten()?
        .dyn_into::<HtmlElement>()
        .ok()
}

pub fn clear_document_selection() -> ApiResult<()> {
    if let Some(selection) = global::window().get_selection()?
        && !selection.is_collapsed()
    {
        selection.remove_all_ranges()?;
    }

    Ok(())
}

pub fn dragenter_helper(callback: impl Fn() + 'static, target: NodeRef) -> Callback<DragEvent> {
    Callback::from({
        move |event: DragEvent| {
            let r = (|| -> ApiResult<()> {
                event.stop_propagation();
                event.prevent_default();
                if event.related_target().is_none() {
                    target
                        .cast::<HtmlElement>()
                        .into_apierror()?
                        .dataset()
                        .set("safaridragleave", "true")?;
                }
                Ok(())
            })();

            if let Err(e) = r {
                web_sys::console::warn_1(&e.into());
            }

            callback();
        }
    })
}

pub fn dragleave_helper(callback: impl Fn() + 'static, drag_ref: NodeRef) -> Callback<DragEvent> {
    Callback::from({
        clone!(drag_ref);
        move |event: DragEvent| {
            let r = (|| -> ApiResult<()> {
                event.stop_propagation();
                event.prevent_default();

                let mut related_target = event
                    .related_target()
                    .or_else(|| Some(JsValue::UNDEFINED.unchecked_into::<EventTarget>()))
                    .and_then(|x| x.dyn_into::<Element>().ok());

                if related_target
                    .as_ref()
                    .map(|x| x.has_attribute("aria-hidden"))
                    .unwrap_or_default()
                {
                    related_target = Some(
                        related_target
                            .into_apierror()?
                            .parent_node()
                            .into_apierror()?
                            .dyn_ref::<ShadowRoot>()
                            .ok_or_else(|| JsValue::from("Chrome drag/drop bug detection failed"))?
                            .host()
                            .unchecked_into::<Element>(),
                    )
                }

                let current_target = drag_ref.cast::<HtmlElement>().unwrap();
                match related_target {
                    Some(ref related) => {
                        if !current_target.contains(Some(related))
                            && related.parent_element().is_some()
                        {
                            callback();
                        }
                    },
                    None => {
                        let dataset = current_target.dataset();
                        if dataset.get("safaridragleave").is_some() {
                            dataset.delete("safaridragleave");
                        } else {
                            callback();
                        }
                    },
                };
                Ok(())
            })();

            if let Err(e) = r {
                web_sys::console::warn_1(&e.into());
            }
        }
    })
}

#[derive(Clone)]
pub struct DragDropContainer {
    pub noderef: NodeRef,
    pub dragenter: Callback<DragEvent>,
    pub dragleave: Callback<DragEvent>,
}

impl DragDropContainer {
    pub fn new<F: Fn() + 'static, G: Fn() + 'static>(ondragenter: F, ondragleave: G) -> Self {
        let noderef = NodeRef::default();
        Self {
            dragenter: dragenter_helper(ondragenter, noderef.clone()),
            dragleave: dragleave_helper(ondragleave, noderef.clone()),
            noderef,
        }
    }
}

pub struct DragTargetState {
    target: HtmlElement,
    shadow_root: ShadowRoot,
    alive: Rc<Cell<bool>>,
    observer: IntersectionObserver,
}

impl DragTargetState {
    pub fn new(host: HtmlElement, target: HtmlElement) -> Self {
        let shadow_root = host.shadow_root().unwrap();
        let alive = Rc::new(Cell::new(true));
        let observer = IntersectionObserver::new(
            &Closure::<dyn FnMut(js_sys::Array)>::new({
                clone!(target, shadow_root, alive);
                move |records: js_sys::Array| {
                    if !alive.get() {
                        return;
                    }

                    for record in records.iter() {
                        let record: IntersectionObserverEntry = record.unchecked_into();
                        if !record.is_intersecting() {
                            shadow_root.append_child(&target).unwrap();
                            return;
                        }
                    }
                }
            })
            .into_js_value()
            .unchecked_into(),
        );

        observer.observe(target.as_ref());
        Self {
            target,
            shadow_root,
            alive,
            observer,
        }
    }
}

impl Drop for DragTargetState {
    fn drop(&mut self) {
        self.alive.set(false);
        self.observer.unobserve(&self.target);
        if self.target.is_connected() {
            let _ = self.shadow_root.remove_child(&self.target);
        }
    }
}
