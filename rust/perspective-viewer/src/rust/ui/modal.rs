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

use yew::html::ImplicitClone;
use yew::prelude::*;

use crate::utils::WeakScope;

/// Whether a modal has been flipped to open upward from its anchor, provided
/// as a Yew context by `PortalModal`.
#[derive(Clone, Default, Eq, PartialEq)]
pub struct ModalOrientation(Rc<Cell<bool>>);

impl ImplicitClone for ModalOrientation {}

impl ModalOrientation {
    pub fn set(&self, value: bool) {
        self.0.set(value);
    }
}

impl From<ModalOrientation> for bool {
    fn from(x: ModalOrientation) -> Self {
        x.0.get()
    }
}

/// Props that expose a weak link to their component, so an owner can send it
/// messages after the fact (the column-style editors hosted in a modal).
pub trait ModalLink<T>
where
    T: Component,
{
    fn weak_link(&self) -> &'_ WeakScope<T>;
}

pub trait SetModalLink {
    fn set_modal_link(&self);
}

impl<T> SetModalLink for &Context<T>
where
    T: Component,
    T::Properties: ModalLink<T>,
{
    fn set_modal_link(&self) {
        *self.props().weak_link().borrow_mut() = Some(self.link().clone());
    }
}
