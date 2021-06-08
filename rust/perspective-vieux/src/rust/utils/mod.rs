////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

pub mod monaco;
pub mod perspective;

mod closure;
mod js_object;
mod request_animation_frame;
mod testing;
mod weak_component_link;
mod future_to_promise;

#[cfg(test)]
mod tests;

pub use closure::*;
pub use request_animation_frame::*;
pub use weak_component_link::*;
pub use future_to_promise::*;
pub use testing::*;

#[macro_export]
macro_rules! maybe {
    ($($exp:stmt);* $(;)*) => {{
        let x: Result<_, JsValue> = (|| {
            $(
                $exp
            )*
        })();
        x.unwrap()
    }};
}

/// A helper to for the pattern `let x2 = x;` necessary to clone structs destined
/// for an `async` or `'static` closure stack.  This is like `move || { .. }` or
/// `move async { .. }`, but for clone semantics.
#[macro_export]
macro_rules! clone {
    ($($x:ident : $y:ident),*) => {
        $(let $x = $y.clone();)*    
    };
    ($($x:ident),*) => {
        $(let $x = $x.clone();)*    
    };
}