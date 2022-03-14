////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::convert::*;
use wasm_bindgen::prelude::*;
use yew::prelude::*;

pub trait ToClosure<T> {
    type Output;

    /// Convert `self` to a `Closure`.  This is mostly just for code
    /// cleanliness, as stable Rust does not yet supports specialization
    /// (which would support more types) nor `Unsize<_>` (which would elide
    /// more explicit type annotations).
    fn into_closure(self) -> Self::Output;
}

impl<T, U, V> ToClosure<(U, V)> for T
where
    T: Fn(U) -> V + 'static,
    U: FromWasmAbi + 'static,
    V: IntoWasmAbi + 'static,
{
    type Output = Closure<dyn Fn(U) -> V>;
    fn into_closure(self) -> Closure<dyn Fn(U) -> V + 'static> {
        Closure::wrap(Box::new(self) as Box<dyn Fn(U) -> V>)
    }
}

impl<T, U, V, W> ToClosure<(U, V, W)> for T
where
    T: Fn(U, V) -> W + 'static,
    U: FromWasmAbi + 'static,
    V: FromWasmAbi + 'static,
    W: IntoWasmAbi + 'static,
{
    type Output = Closure<dyn Fn(U, V) -> W>;
    fn into_closure(self) -> Closure<dyn Fn(U, V) -> W + 'static> {
        Closure::wrap(Box::new(self) as Box<dyn Fn(U, V) -> W>)
    }
}

impl<T, U, V, W, X> ToClosure<(U, V, W, X)> for T
where
    T: Fn(U, V, W) -> X + 'static,
    U: FromWasmAbi + 'static,
    V: FromWasmAbi + 'static,
    W: FromWasmAbi + 'static,
    X: IntoWasmAbi + 'static,
{
    type Output = Closure<dyn Fn(U, V, W) -> X>;
    fn into_closure(self) -> Closure<dyn Fn(U, V, W) -> X + 'static> {
        Closure::wrap(Box::new(self) as Box<dyn Fn(U, V, W) -> X>)
    }
}

impl<U> ToClosure<Self> for Callback<U>
where
    U: FromWasmAbi + 'static,
{
    type Output = Closure<dyn Fn(U)>;
    fn into_closure(self) -> Closure<dyn Fn(U)> {
        Closure::wrap(Box::new(move |x: U| {
            self.emit(x);
        }) as Box<dyn Fn(U)>)
    }
}

pub trait ToClosureMut<U, V> {
    fn into_closure_mut(self) -> Closure<dyn FnMut(U) -> V>;
}

impl<T, U, V> ToClosureMut<T, V> for U
where
    U: FnMut(T) -> V + 'static,
    T: FromWasmAbi + 'static,
    V: IntoWasmAbi + 'static,
{
    fn into_closure_mut(self) -> Closure<dyn FnMut(T) -> V + 'static> {
        Closure::wrap(Box::new(self) as Box<dyn FnMut(T) -> V>)
    }
}
