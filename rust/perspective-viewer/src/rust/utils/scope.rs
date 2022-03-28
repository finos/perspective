////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use futures::Future;
use yew::html::Scope;
use yew::prelude::*;

use futures::channel::oneshot::*;

pub trait PromiseMessage<T, F, U>
where
    T: Component,
    F: FnOnce(Sender<U>) -> T::Message,
{
    type Output: Future<Output = Result<U, Self::Error>>;
    type Error;
    fn promise_message(&self, f: F) -> Self::Output;
}

impl<T, F, U> PromiseMessage<T, F, U> for Scope<T>
where
    T: Component,
    F: FnOnce(Sender<U>) -> T::Message,
{
    type Output = Receiver<U>;
    type Error = Canceled;
    fn promise_message(&self, f: F) -> Receiver<U> {
        let (sender, receiver) = channel::<U>();
        self.send_message(f(sender));
        receiver
    }
}
