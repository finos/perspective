////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::fmt::Display;
use std::marker::PhantomData;
use std::str::FromStr;

use derivative::Derivative;
use yew::prelude::*;

#[derive(Derivative)]
#[derivative(Default(bound = ""))]
pub struct RadioListItem<T> {
    _typeref: PhantomData<T>,
}

#[derive(Properties, PartialEq)]
pub struct RadioListItemProps<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    pub children: Children,
    pub value: T,
}

impl<T> Component for RadioListItem<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    type Message = ();
    type Properties = RadioListItemProps<T>;

    fn create(_ctx: &Context<Self>) -> Self {
        Self::default()
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        ctx.props().children.iter().collect::<Html>()
    }
}
