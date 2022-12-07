////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

//! A micro-framework for associating local CSS snippets with `yew::Component`s
//! in a Custom Element's `ShadowRoot`.  Embedding a `<LocalStyle>` element
//! will only create the underlying `<style>` tag once (when `Component::view()`
//! is called the first time), even if multiple copies of the `Component`
//! exist in the tree.
//!
//! # Example
//! ```
//! html! {
//!     <StyleProvider>
//!         <LocalStyle href={ css!("my-style") } />
//!         <h1>{ "I am styled!" }</h1>
//!     </StyleProvider>
//! }
//! ```

mod local_style;
mod style_cache;
mod style_provider;

pub use local_style::LocalStyle;
pub use style_provider::StyleProvider;

#[macro_export]
macro_rules! css {
    ($name:expr) => {{
        (
            $name,
            include_str!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/target/css/",
                $name,
                ".css"
            )),
        )
    }};
    ($path:expr, $name:expr) => {{
        (
            $name,
            include_str!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/",
                $path,
                "/",
                $name,
                ".css"
            )),
        )
    }};
}
