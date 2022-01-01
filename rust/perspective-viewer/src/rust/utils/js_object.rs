////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

/// A macro which allows quick-and-dirty creation of JavaScript Objects with
/// dynamic keys, ala JavaScript Object Literal notation.  This is not fast and
/// relies on `js_sys::Reflect`, but it quite handy when the keys are not known
/// at compile-time or are otherwise cumbersome to encode in an `extern` block.
#[macro_export]
macro_rules! js_object {
    () => { js_sys::Object::new() };

    ($($key:expr, $value:expr);+ $(;)*) => {{
        use js_intern::{js_intern};
        use js_sys;
        let o = js_sys::Object::new();
        $({
            let k = js_intern!($key);
            js_sys::Reflect::set(&o, k, &$value.into()).unwrap();
        })*
        o
    }};

    ($o:expr; with $($key:expr, $value:expr);+ $(;)*) => { {
        use js_intern::{js_intern};
        $({
            let k = js_intern!($key);
            js_sys::Reflect::set($o, k, &$value.into()).unwrap();
        })*
        $o
    }};
}

#[macro_export]
macro_rules! js_log {
    ($x:expr) => {{
        const DEBUG_ONLY_WARNING: &str = $x;
        web_sys::console::log_1(&wasm_bindgen::JsValue::from($x));
    }};
    ($x:expr $(, $y:expr)*) => {{
        const DEBUG_ONLY_WARNING: &str = $x;
        web_sys::console::log_1(&format!($x, $($y),*).into());
    }};
}

#[macro_export]
macro_rules! html_template {
    ($($x:tt)*) => {{
        html! {
            <>
                $($x)*
            </>
        }
    }};
}
