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

//! A simple "structurally-typed" method extension implementation.  This
//! collection of `trait`s allows methods to be automatically defined for
//! `struct`s only if the define accessors for the necessary applications state
//! objects (which are conviently derivable with the `derive_model!` macro).

use crate::dragdrop::*;
use crate::presentation::*;
use crate::renderer::*;
use crate::session::*;

pub trait HasSession {
    fn session(&self) -> &'_ Session;
}

pub trait HasRenderer {
    fn renderer(&self) -> &'_ Renderer;
}

pub trait HasPresentation {
    fn presentation(&self) -> &'_ Presentation;
}

pub trait HasDragDrop {
    fn dragdrop(&self) -> &'_ DragDrop;
}

pub trait HasCustomEvents {
    fn _custom_events(&self) -> &'_ CustomEvents;
}

#[macro_export]
macro_rules! derive_model {
    (DragDrop for $key:ty) => {
        impl $crate::model::HasDragDrop for $key {
            fn dragdrop(&self) -> &'_ DragDrop {
                &self.dragdrop
            }
        }
    };
    (Renderer for $key:ty) => {
        impl $crate::model::HasRenderer for $key {
            fn renderer(&self) -> &'_ Renderer {
                &self.renderer
            }
        }
    };
    (Session for $key:ty) => {
        impl $crate::model::HasSession for $key {
            fn session(&self) -> &'_ Session {
                &self.session
            }
        }
    };
    (Presentation for $key:ty) => {
        impl $crate::model::HasPresentation for $key {
            fn presentation(&self) -> &'_ Presentation {
                &self.presentation
            }
        }
    };
    (CustomEvents for $key:ty) => {
        impl $crate::model::HasCustomEvents for $key {
            fn _custom_events(&self) -> &'_ CustomEvents {
                &self.custom_events
            }
        }
    };
    ($i:ident, $($is:ident),+ for $key:ty) => {
        derive_model!($i for $key);
        derive_model!($($is),+ for $key);
    };
}
