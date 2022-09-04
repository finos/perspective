////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;
use crate::*;

use std::cell::RefCell;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::html::ImplicitClone;
use yew::prelude::*;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DragTarget {
    Active,
    GroupBy,
    SplitBy,
    Sort,
    Filter,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DragEffect {
    Copy,
    Move(DragTarget),
}

#[derive(Clone)]
struct DragFrom {
    column: String,
    effect: DragEffect,
}

struct DragOver {
    target: DragTarget,
    index: usize,
}

enum DragState {
    NoDrag,
    DragInProgress(DragFrom),
    DragOverInProgress(DragFrom, DragOver),
}

impl Default for DragState {
    fn default() -> Self {
        Self::NoDrag
    }
}

impl DragState {
    fn take(&mut self) -> Self {
        let mut new = Self::NoDrag;
        std::mem::swap(self, &mut new);
        new
    }

    const fn is_drag_in_progress(&self) -> bool {
        !matches!(self, Self::NoDrag)
    }
}

#[derive(Default)]
pub struct DragDropState {
    drag_state: RefCell<DragState>,
    pub drop_received: PubSub<(String, DragTarget, DragEffect, usize)>,
    pub dragstart_received: PubSub<DragEffect>,
    pub dragend_received: PubSub<()>,
}

/// The `<perspective-viewer>` drag/drop service, which manages drag/drop user
/// interactions across components.  It is a component-level service, since only
/// one drag/drop action can be executed by the user at a time.
#[derive(Clone, Default)]
pub struct DragDrop(Rc<DragDropState>);

impl Deref for DragDrop {
    type Target = Rc<DragDropState>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl PartialEq for DragDrop {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl ImplicitClone for DragDrop {}

impl DragDrop {
    pub fn notify_drop(&self) {
        let action = match self.drag_state.borrow_mut().take() {
            DragState::DragOverInProgress(
                DragFrom { column, effect },
                DragOver { target, index },
            ) => Some((column, target, effect, index)),
            _ => None,
        };

        if let Some(action) = action {
            self.drop_received.emit_all(action);
        }
    }

    /// Get the column name currently being drag/dropped.
    pub fn get_drag_column(&self) -> Option<String> {
        match *self.drag_state.borrow() {
            DragState::DragInProgress(DragFrom { ref column, .. })
            | DragState::DragOverInProgress(DragFrom { ref column, .. }, _) => Some(column.clone()),
            _ => None,
        }
    }

    /// Start the drag/drop action with the name of the column being dragged.
    pub fn drag_start(&self, column: String, effect: DragEffect) {
        *self.drag_state.borrow_mut() = DragState::DragInProgress(DragFrom { column, effect });
        self.dragstart_received.emit_all(effect)
    }

    /// End the drag/drop action by resetting the state to default.
    pub fn drag_end(&self) {
        let should_notify = self.drag_state.borrow_mut().take().is_drag_in_progress();
        if should_notify {
            self.dragend_received.emit_all(());
        }
    }

    /// Leave the `action` zone.
    pub fn drag_leave(&self, drag_target: DragTarget) {
        let reset = match *self.drag_state.borrow() {
            DragState::DragOverInProgress(
                DragFrom { ref column, effect },
                DragOver { target, .. },
            ) if target == drag_target => Some((column.clone(), effect)),
            _ => None,
        };

        if let Some((column, effect)) = reset {
            self.drag_start(column, effect);
        }
    }

    // Enter the `action` zone at `index`, which must be <= the number of children
    // in the container.
    pub fn drag_enter(&self, target: DragTarget, index: usize) -> bool {
        let mut drag_state = self.drag_state.borrow_mut();
        let should_render = match &*drag_state {
            DragState::DragOverInProgress(_, drag_to) => {
                drag_to.target != target || drag_to.index != index
            }
            _ => true,
        };

        *drag_state = match &*drag_state {
            DragState::DragOverInProgress(drag_from, _) | DragState::DragInProgress(drag_from) => {
                DragState::DragOverInProgress(drag_from.clone(), DragOver { target, index })
            }
            _ => DragState::NoDrag,
        };

        should_render
    }

    // Is the drag/drop state currently in `action`?
    pub fn is_dragover(&self, drag_target: DragTarget) -> Option<(usize, String)> {
        match *self.drag_state.borrow() {
            DragState::DragOverInProgress(
                DragFrom { ref column, .. },
                DragOver { target, index },
            ) if target == drag_target => Some((index, column.clone())),
            _ => None,
        }
    }
}

/// Safari does not set `relatedTarget` on `"dragleave"`, which makes it
/// impossible to determine whether a logical drag leave has happened with just
/// this event, so use function on `"dragenter"` to capture the `relatedTarget`.
pub fn dragenter_helper(callback: impl Fn() + 'static, target: NodeRef) -> Callback<DragEvent> {
    Callback::from({
        move |event: DragEvent| {
            js_log_maybe!({
                event.stop_propagation();
                event.prevent_default();
                if event.related_target().is_none() {
                    target
                        .cast::<HtmlElement>()
                        .into_apierror()?
                        .dataset()
                        .set("safaridragleave", "true")?;
                }
            });

            callback();
        }
    })
}

/// HTML drag/drop will fire a bubbling `dragleave` event over all children of a
/// `dragleave`-listened-to element, so we need to filter out the events from
/// the children elements with this esoteric DOM arcana.
pub fn dragleave_helper(callback: impl Fn() + 'static, drag_ref: NodeRef) -> Callback<DragEvent> {
    Callback::from({
        clone!(drag_ref);
        move |event: DragEvent| {
            js_log_maybe!({
                event.stop_propagation();
                event.prevent_default();

                let mut related_target = event
                    .related_target()
                    .or_else(|| Some(JsValue::UNDEFINED.unchecked_into::<EventTarget>()))
                    .and_then(|x| x.dyn_into::<Element>().ok());

                // This is a wild chrome bug. `dragleave` can fire with the `relatedTarget`
                // property set to an element inside the closed `ShadowRoot` hosted by a
                // browser-native `<select>` tag, which fails the `.contains()` check
                // below.  This mystery `ShadowRoot` has a structure that looks like this
                // (tested in Chrome 92), which we try to detect as best we can below.
                //
                // ```html
                // <div aria-hidden="true">Selected Text Here</siv>
                // <slot name="user-agent-custom-assign-slot"></slot>
                // ```
                //
                // This is pretty course though, since there is no guarantee this structure
                // will be maintained in future Chrome versions; the `.expect()` in this
                // method chain should at least warn us if this regresses.
                //
                // Wait - you don't believe me?  Throw a debugger statement inside this
                // conditional and drag a column over a pivot-mode active columns list.
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
                        if !current_target.contains(Some(related)) {
                            callback();
                        }
                    }
                    None => {
                        // Safari (OSX and iOS) don't set `relatedTarget`, so we need to
                        // read a memoized value from the `"dragenter"` event.
                        let dataset = current_target.dataset();
                        if dataset.get("safaridragleave").is_some() {
                            dataset.delete("safaridragleave");
                        } else {
                            callback();
                        }
                    }
                };
            })
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
        DragDropContainer {
            dragenter: dragenter_helper(ondragenter, noderef.clone()),
            dragleave: dragleave_helper(ondragleave, noderef.clone()),
            noderef,
        }
    }
}
