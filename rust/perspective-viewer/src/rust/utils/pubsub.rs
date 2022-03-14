////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use derivative::Derivative;
use std::cell::RefCell;
use std::rc::Rc;
use yew::prelude::*;

/// A simple pub/sub struct which allows many listeners to subscribe to a single
/// publisher, without leaking callbacks as listeners are dropped.
#[derive(Derivative)]
#[derivative(Default(bound = ""))]
pub struct PubSub<T: Clone> {
    listeners: Rc<RefCell<Vec<Callback<T>>>>,
}

pub trait AddListener<T> {
    /// Register a listener to this `PubSub<_>`, which will be automatically
    /// deregistered when the return `Subscription` is dropped.
    ///
    /// # Arguments
    /// - `f` The callback, presumably a function-like type.
    fn add_listener(&self, f: T) -> Subscription;
}

impl<T: Clone + 'static> PubSub<T> {
    /// Emit a value to all listeners.
    ///
    /// # Arguments
    /// - `val` The value to emit.
    pub fn emit_all(&self, val: T) {
        let listeners = self.listeners.borrow().clone();
        for listener in listeners.iter() {
            listener.emit(val.clone());
        }
    }

    /// Get this `PubSub<_>`'s `.emit_all()` method as a `Callback<T>`.
    pub fn callback(&self) -> Callback<T> {
        let listeners = self.listeners.clone();
        Callback::from(move |val: T| {
            let listeners = listeners.borrow().clone();
            for listener in listeners.iter() {
                listener.emit(val.clone());
            }
        })
    }
}

impl<T: Clone + 'static> AddListener<Callback<T>> for PubSub<T> {
    fn add_listener(&self, f: Callback<T>) -> Subscription {
        let listeners = self.listeners.clone();
        self.listeners.borrow_mut().insert(0, f.clone());
        Subscription(Box::new(move || listeners.borrow_mut().retain(|x| *x != f)))
    }
}

impl<T, U> AddListener<U> for PubSub<T>
where
    T: Clone + 'static,
    U: Fn(T) + 'static,
{
    fn add_listener(&self, f: U) -> Subscription {
        let f = Callback::from(f);
        let listeners = self.listeners.clone();
        listeners.borrow_mut().insert(0, f.clone());
        Subscription(Box::new(move || listeners.borrow_mut().retain(|x| *x != f)))
    }
}

/// Manages the lifetime of a listener registered to a `PubSub<T>` by
/// deregistering the associated listener when dropped.  The wrapped `Fn` of
/// `Subscriptions` is the deregister closure provided by the issuing
/// `PubSub<T>`.
#[must_use]
pub struct Subscription(Box<dyn Fn()>);

impl Drop for Subscription {
    fn drop(&mut self) {
        (*self.0)();
    }
}
