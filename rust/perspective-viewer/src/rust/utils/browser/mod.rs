////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod blob;
mod download;
mod focus;
mod request_animation_frame;
mod selection;

#[cfg(test)]
mod tests;

pub use blob::*;
pub use download::*;
pub use focus::*;
pub use request_animation_frame::*;
pub use selection::*;

/// Convenient short-name functions for common browser globals. These types are
/// not `send` and cannot be made static.
pub mod global {
    pub fn window() -> web_sys::Window {
        web_sys::window().unwrap()
    }

    pub fn document() -> web_sys::Document {
        window().document().unwrap()
    }

    pub fn performance() -> web_sys::Performance {
        window().performance().unwrap()
    }

    pub fn body() -> web_sys::HtmlElement {
        document().body().unwrap()
    }

    pub fn navigator() -> web_sys::Navigator {
        window().navigator()
    }

    pub fn clipboard() -> web_sys::Clipboard {
        navigator().clipboard().unwrap()
    }
}
