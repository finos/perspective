////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;

use std::cell::RefCell;
use std::ops::Deref;
use std::rc::Rc;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::prelude::*;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum DropAction {
    Active,
    RowPivots,
    ColumnPivots,
    Sort,
    Filter,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum DragEffect {
    Copy,
    Move(DropAction),
}

#[derive(Debug)]
pub struct DragState {
    column: String,
    effect: DragEffect,
    state: Option<(DropAction, usize)>,
}

#[derive(Default)]
pub struct DragDropState {
    drag_state: Option<DragState>,
    on_drop_action: PubSub<(String, DropAction, DragEffect, usize)>,
    on_drag_action: PubSub<DragEffect>,
    on_dragend_action: PubSub<()>,
}

/// The `<perspective-viewer>` drag-drop service, which manages drag/drop user
/// interactions across components.  It is a component-level service, since only one
/// drag/drop action can be executed by the user at a time, and has a 3 states:
/// - `None` No drag/drop action is in effect.
/// - `Some(DragDropState { state: None }` Drag is in effect.
/// - `Some(DragDropState { state: Some(_) }` Drag and Hover are in effect.
#[derive(Clone, Default)]
pub struct DragDrop(Rc<RefCell<DragDropState>>);

impl Deref for DragDrop {
    type Target = Rc<RefCell<DragDropState>>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl PartialEq for DragDrop {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl DragDrop {
    pub fn add_on_drop_action(
        &self,
        callback: Callback<(String, DropAction, DragEffect, usize)>,
    ) -> Subscription {
        self.borrow().on_drop_action.add_listener(callback)
    }

    pub fn add_on_drag_action(&self, callback: Callback<DragEffect>) -> Subscription {
        self.borrow().on_drag_action.add_listener(callback)
    }

    pub fn add_on_dragend_action(&self, callback: Callback<()>) -> Subscription {
        self.borrow().on_dragend_action.add_listener(callback)
    }

    pub fn notify_drop(&self) {
        let action = match self.borrow_mut().drag_state.take() {
            Some(DragState {
                column,
                state: Some((action, index)),
                effect,
            }) => Some((column, action, effect, index)),
            _ => None,
        };

        if let Some(action) = action {
            self.borrow().on_drop_action.emit_all(action);
        }
    }

    /// Get the column name currently being drag/dropped.
    pub fn get_drag_column(&self) -> Option<String> {
        match self.borrow().drag_state {
            Some(DragState { ref column, .. }) => Some(column.clone()),
            _ => None,
        }
    }

    /// Start the drag/drop action with the name of the column being dragged.
    pub fn drag_start(&self, column: String, effect: DragEffect) {
        self.borrow_mut().drag_state = Some(DragState {
            column,
            effect,
            state: None,
        });

        self.borrow().on_drag_action.emit_all(effect)
    }

    /// End the drag/drop action by resetting the state to default.
    pub fn drag_end(&self) {
        let should_notify = self.borrow_mut().drag_state.take().is_some();
        if should_notify {
            self.borrow().on_dragend_action.emit_all(());
        }
    }

    /// Leave the `action` zone.
    pub fn drag_leave(&self, action: DropAction) {
        let reset = match self.borrow().drag_state {
            Some(DragState {
                ref column,
                state: Some((a, _)),
                effect,
            }) if a == action => Some((column.clone(), effect)),
            _ => None,
        };

        if let Some((column, effect)) = reset {
            self.drag_start(column, effect);
        }
    }

    // Enter the `action` zone at `index`, which must be <= the number of children
    // in the container.
    pub fn drag_enter(&self, action: DropAction, index: usize) -> bool {
        let mut r = self.borrow_mut();
        let should_render = match r.drag_state {
            Some(DragState {
                state: Some((a, x)),
                ..
            }) if a == action => x != index,
            _ => true,
        };

        r.drag_state
            .as_mut()
            .expect("Hover index without hover")
            .state = Some((action, index));

        should_render
    }

    // Is the drag/drop state currently in `action`?
    pub fn is_dragover(&self, action: DropAction) -> Option<(usize, String)> {
        match self.borrow().drag_state {
            Some(DragState {
                ref column,
                state: Some((a, index)),
                ..
            }) if a == action => Some((index, column.clone())),
            _ => None,
        }
    }
}

/// Safari does not set `relatedTarget` on `"dragleave"`, which makes it impossible to
/// determine whether a logical drag leave has happened with just this event, so use
/// function on `"dragenter"` to capture the `relatedTarget`.
pub fn dragenter_helper(event: DragEvent) {
    event.stop_propagation();
    event.prevent_default();
    if event.related_target().is_none() {
        event
            .current_target()
            .unwrap()
            .unchecked_ref::<HtmlElement>()
            .dataset()
            .set("safaridragleave", "true")
            .unwrap();
    }
}

/// HTML drag/drop will fire a bubbling `dragleave` event over all children of a
/// `dragleave`-listened-to element, so we need to filter out the events from the
/// children elements with this esoteric DOM arcana.
pub fn dragleave_helper(callback: impl Fn() + 'static) -> Callback<DragEvent> {
    Callback::from({
        move |event: DragEvent| {
            event.stop_propagation();
            event.prevent_default();

            let mut related_target = event
                .related_target()
                .or_else(|| Some(JsValue::UNDEFINED.unchecked_into::<EventTarget>()))
                .and_then(|x| x.dyn_into::<Element>().ok());

            let current_target = event
                .current_target()
                .unwrap()
                .unchecked_into::<HtmlElement>();

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
                        .unwrap()
                        .parent_node()
                        .unwrap()
                        .dyn_ref::<ShadowRoot>()
                        .expect("Chrome drag/drop bug detection failed")
                        .host()
                        .unchecked_into::<Element>(),
                )
            }

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
        }
    })
}
