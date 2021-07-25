////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::cell::RefCell;
use std::rc::Rc;
use yew::prelude::*;

#[derive(Clone)]
pub struct PubSub<T: Clone> {
    listeners: Rc<RefCell<Vec<Callback<T>>>>,
}

pub trait AddListener<T> {
    fn add_listener(&self, f: T) -> Subscription;
}

impl<T: Clone + 'static> Default for PubSub<T> {
    fn default() -> Self {
        PubSub {
            listeners: Rc::new(RefCell::new(vec![])),
        }
    }
}

impl<T: Clone + 'static> PubSub<T> {
    pub fn emit_all(&self, val: T) {
        let listeners = self.listeners.borrow().clone();
        for listener in listeners.iter() {
            listener.emit(val.clone());
        }
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

#[must_use]
pub struct Subscription(Box<dyn Fn()>);

impl Drop for Subscription {
    fn drop(&mut self) {
        (*self.0)();
    }
}
