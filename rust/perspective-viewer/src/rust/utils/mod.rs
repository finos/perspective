////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

//! A catch all for project-wide macros and general-purpose functions that are
//! not directly related to Perspective.  Modules below `crate::utils` strive
//! to be single-responsibility, but some reference other `crate::utils`
//! modules when it helps reduce boiler-plate.

mod api_future;
mod async_callback;
mod blob;
mod closure;
mod custom_element;
mod datetime;
mod debounce;
mod download;
mod errors;
mod js_object;
mod pubsub;
mod request_animation_frame;
mod scope;
mod weak_scope;

#[cfg(test)]
mod tests;

pub use self::api_future::*;
pub use self::async_callback::*;
pub use self::blob::*;
pub use self::closure::*;
pub use self::custom_element::*;
pub use self::datetime::*;
pub use self::debounce::*;
pub use self::download::*;
pub use self::errors::*;
pub use self::pubsub::*;
pub use self::request_animation_frame::*;
pub use self::scope::*;
pub use self::weak_scope::*;

#[macro_export]
macro_rules! maybe {
    ($($exp:stmt);*) => {{
        let x = ({
            #[inline(always)]
            || {
                $($exp)*
            }
        })();
        x
    }};
}

#[macro_export]
macro_rules! js_log_maybe {
    ($($exp:tt)+) => {{
        let x = ({
            #[inline(always)]
            || {
                {
                    $($exp)+
                };
                Ok(())
            }
        })();
        x.unwrap_or_else(|e| web_sys::console::error_1(&e))
    }};
}

/// A helper to for the pattern `let x2 = x;` necessary to clone structs
/// destined for an `async` or `'static` closure stack.  This is like `move || {
/// .. }` or `move async { .. }`, but for clone semantics.
#[macro_export]
macro_rules! clone {
    ($i:ident) => {
        let $i = $i.clone();
    };
    ($i:ident, $($tt:tt)*) => {
        clone!($i);
        clone!($($tt)*);
    };
    ($this:ident . $i:ident) => {
        let $i = $this.$i.clone();
    };
    ($this:ident . $i:ident, $($tt:tt)*) => {
        clone!($this . $i);
        clone!($($tt)*);
    };
    ($this:ident . $borrow:ident() . $i:ident) => {
        let $i = $this.$borrow().$i.clone();
    };
    ($this:ident . $borrow:ident() . $i:ident, $($tt:tt)*) => {
        clone!($this.$borrow().$i);
        clone!($($tt)*);
    };
    ($this:ident . $borrow:ident()) => {
        let $borrow = $this.$borrow().clone();
    };
    ($this:ident . $borrow:ident(), $($tt:tt)*) => {
        clone!($this.$borrow());
        clone!($($tt)*);
    };
}

#[macro_export]
macro_rules! max {
    ($x:expr) => ($x);
    ($x:expr, $($z:expr),+ $(,)?) => {{
        let x = $x;
        let y = max!($($z),*);
        if x > y {
            x
        } else {
            y
        }
    }}
}

#[macro_export]
macro_rules! min {
    ($x:expr) => ($x);
    ($x:expr, $($z:expr),+ $(,)?) => {{
        let x = $x;
        let y = min!($($z),*);
        if x < y {
            x
        } else {
            y
        }
    }}
}
