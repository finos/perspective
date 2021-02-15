////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

#![macro_use]

pub mod perspective;

use std::future::Future;
use typed_html::dom::{DOMTree, VNode};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use web_sys::{Document, Element};

pub type JsResult<T> = Result<T, JsValue>;

/// Console FFI
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_val(s: &JsValue);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_obj(s: &js_sys::Object);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_str(s: &str);
}

/// Apply a style node to the target `elem`.
pub fn apply_style_node(elem: &Element, css: &str) -> Result<(), JsValue> {
    let document = &web_sys::window().unwrap().document().unwrap();
    let style = document.create_element("style")?;
    style.set_text_content(Some(css));
    elem.append_child(&style)?;
    Ok(())
}

pub fn apply_dom_tree(
    elem: &Element,
    tree: &mut DOMTree<String>,
) -> Result<(), JsValue> {
    let document = &web_sys::window().unwrap().document().unwrap();
    match tree.vnode() {
        VNode::Element(x) => {
            for child in x.children {
                apply_vnode(document, elem, &child)?;
            }
        }
        _ => unimplemented!(),
    }

    Ok(())
}

fn apply_vnode(
    document: &Document,
    elem: &Element,
    node: &VNode<'_, String>,
) -> Result<(), JsValue> {
    match node {
        VNode::Text(text) | VNode::UnsafeText(text) => {
            let node = document.create_text_node(&text);
            elem.append_child(&node).map(|_| ())?;
            Ok(())
        }
        VNode::Element(element) => {
            let node = document.create_element(element.name)?;
            for (key, value) in &element.attributes {
                node.set_attribute(&key, &value)?;
            }

            for child in &element.children {
                apply_vnode(document, &node, &child)?;
            }

            elem.append_child(&node)?;
            Ok(())
        }
    }
}

pub trait PerspectiveComponent: Clone {
    /// The root `HtmlElement` to which this component renders.
    fn get_root(&self) -> &web_sys::HtmlElement;

    /// Convenience function for injecting `self` into ` closure which returns a
    /// `Future`, the Rust equivalent of an `AsyncFn`.  It handles both the lifetime of
    /// `self` as well as wrapping the inner `Future` in a JavaScript `Promise` (or it
    /// would not execute).
    fn async_method_to_jsfunction<F, T>(
        &self,
        f: F,
    ) -> Closure<dyn Fn() -> js_sys::Promise>
    where
        T: Future<Output = Result<JsValue, JsValue>> + 'static,
        F: Fn(Self) -> T + 'static,
        Self: 'static,
    {
        let this = self.clone();
        let cb = move || future_to_promise(f(this.clone()));
        let box_cb: Box<dyn Fn() -> js_sys::Promise> = Box::new(cb);
        Closure::wrap(box_cb)
    }

    /// Convenience function for wrapping and injecting `self` into a `Future`.
    fn async_method_to_jspromise<F, T>(&self, f: F) -> js_sys::Promise
    where
        T: Future<Output = Result<JsValue, JsValue>> + 'static,
        F: FnOnce(Self) -> T + 'static,
        Self: 'static,
    {
        let this = self.clone();
        future_to_promise(f(this.clone()))
    }

    /// Convenience function for wrapping and injecting `self` into a closure with an
    /// argument (a common pattern for event handles in JavaScript).
    fn method_to_jsfunction_arg1<F, T>(&self, f: F) -> js_sys::Function
    where
        T: wasm_bindgen::convert::FromWasmAbi + 'static,
        F: Fn(&Self, T) -> Result<(), JsValue> + 'static,
        Self: 'static,
    {
        let this = self.clone();
        let box_cb: Box<dyn Fn(T) -> Result<(), JsValue>> =
            Box::new(move |e| f(&this, e));
        Closure::wrap(box_cb).into_js_value().unchecked_into()
    }
}

#[cfg(test)]
mod perspective_component_tests {
    use crate::utils::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

    #[derive(Clone)]
    struct Test {}

    impl PerspectiveComponent for Test {
        fn get_root(&self) -> &web_sys::HtmlElement {
            unimplemented!()
        }
    }

    #[wasm_bindgen_test]
    fn test_async_method_to_jsfunction() {
        async fn f(_: Test) -> Result<JsValue, JsValue> {
            Ok(JsValue::UNDEFINED)
        }

        let _: &js_sys::Function = (Test {})
            .async_method_to_jsfunction(f)
            .as_ref()
            .unchecked_ref();
    }

    #[wasm_bindgen_test]
    fn test_async_method_to_jspromise() {
        async fn f(_: Test) -> Result<JsValue, JsValue> {
            Ok(JsValue::UNDEFINED)
        }

        let _: js_sys::Promise = (Test {}).async_method_to_jspromise(f);
    }
}

#[macro_export]
macro_rules! js_object {
    () => { js_sys::Object::new() };

    ($($key:expr, $value:expr);+ $(;)*) => {{
        use js_intern::{js_intern};
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
            Reflect::set($o, k, &$value.into()).unwrap();
        })*
        $o
    }};
}
