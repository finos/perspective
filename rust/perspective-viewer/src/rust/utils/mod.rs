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
/// .. }` or `move async { .. }`, but for clone semantics.  `clone!()` works
/// with symbols as well as properties and methods, using the last symbol name
/// in the method chain, or an alias via `x = ...` syntax.
///
/// # Examples
///
/// ```rust
/// clone!(my_struct.option_method(), alias = my_struct.prop1.my_rc);
/// println!("These bindings exist: {:?} {:?}", option_method, alias);
/// ```
#[macro_export]
macro_rules! clone {
    (impl @bind $i:tt { $($orig:tt)* } { }) => {
        let $i = $($orig)*.clone();
    };

    (impl @bind $i:tt { $($orig:tt)* } { $binder:tt }) => {
        let $binder = $($orig)*.clone();
    };

    (impl @expand { $($orig:tt)* } { $($binder:tt)* } $i:tt) => {
        clone!(impl @bind $i { $($orig)* $i } { $($binder)* });
    };

    (impl @expand { $($orig:tt)* } { $($binder:tt)* } $i:tt ()) => {
        clone!(impl @bind $i { $($orig)* $i () } { $($binder)* });
    };

    (impl @expand { $($orig:tt)* } { $($binder:tt)* } $i:tt . 0) => {
        clone!(impl @bind $i { $($orig)* $i . 0 } { $($binder)* });
    };

    (impl @expand { $($orig:tt)* } { $($binder:tt)* } $i:tt . 1) => {
        clone!(impl @bind $i { $($orig)* $i . 1 } { $($binder)* });
    };

    (impl @expand { $($orig:tt)* } { $($binder:tt)* } $i:tt . 2) => {
        clone!(impl @bind $i { $($orig)* $i . 2 } { $($binder)* });
    };

    (impl @expand { $($orig:tt)* } { $($binder:tt)* } $i:tt . 3) => {
        clone!(impl @bind $i { $($orig)* $i . 3 } { $($binder)* });
    };

    (impl @expand { $($orig:tt)* } { $($binder:tt)* } $i:tt = $($tail:tt)+) => {
        clone!(impl @expand { $($orig)* } { $i } $($tail)+);
    };

    (impl @expand { $($orig:tt)* } { $($binder:tt)* } $i:tt $($tail:tt)+) => {
        clone!(impl @expand { $($orig)* $i } { $($binder)* } $($tail)+);
    };

    (impl @context { $($orig:tt)* } $tail:tt) => {
        clone!(impl @expand { } { } $($orig)* $tail);
    };

    (impl @context { $($orig:tt)* } , $($tail:tt)+) => {
        clone!(impl @expand { } { } $($orig)*);
        clone!(impl @context { } $($tail)+);
    };

    (impl @context { $($orig:tt)* } $i:tt $($tail:tt)+) => {
        clone!(impl @context { $($orig)* $i } $($tail)+);
    };

    ($($tail:tt)+) => {
        clone!(impl @context { } $($tail)+);
    }
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
