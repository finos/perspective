////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

#![macro_use]

pub mod perspective;

use js_intern::*;
use std::cell::RefCell;
use std::future::Future;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::{prelude::*, JsCast};
use wasm_bindgen_futures::future_to_promise;
use yew::prelude::*;

pub type JsResult<T> = Result<T, JsValue>;

/// Console FFI TODO remove
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_val(s: &JsValue);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_obj(s: &js_sys::Object);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_str(s: &str);
}

pub trait ToClosure<T: Component> {
    fn to_closure<F>(&self, f: F) -> Closure<dyn Fn(MouseEvent)>
    where
        F: Fn(MouseEvent) -> T::Message + 'static;
}

impl<T: Component> ToClosure<T> for ComponentLink<T> {
    fn to_closure<F>(&self, f: F) -> Closure<dyn Fn(MouseEvent)>
    where
        F: Fn(MouseEvent) -> T::Message + 'static,
    {
        let callback = self.callback(f);
        Closure::wrap(Box::new(move |event: MouseEvent| {
            callback.emit(event);
        }) as Box<dyn Fn(MouseEvent)>)
    }
}

fn ignore_view_delete(f: JsValue) {
    match f.clone().dyn_into::<js_sys::Error>() {
        Ok(err) => {
            if err.message() != "View is not initialized" {
                wasm_bindgen::throw_val(f)
            }
        }
        _ => {
            if !js_sys::Reflect::has(&f, js_intern!("message")).unwrap()
                || js_sys::Reflect::get(&f, js_intern!("message"))
                    .unwrap()
                    .as_string()
                    .unwrap_or("".to_owned())
                    != "View is not initialized"
            {
                wasm_bindgen::throw_val(f)
            }
        }
    }
}

thread_local! {
    static NULL_C: Closure<dyn FnMut(JsValue)> = Closure::wrap(Box::new(ignore_view_delete));
}

pub fn promisify_ignore_view_delete<F>(f: F) -> js_sys::Promise
where
    F: Future<Output = Result<JsValue, JsValue>> + 'static,
{
    NULL_C.with(|ignore| future_to_promise(f).catch(ignore))
}

pub fn async_method_to_jsfunction<F, T, U>(
    this: &U,
    f: F,
) -> Closure<dyn Fn() -> js_sys::Promise>
where
    T: Future<Output = Result<JsValue, JsValue>> + 'static,
    F: Fn(U) -> T + 'static,
    U: Clone + 'static,
{
    let this = this.clone();
    let cb = move || promisify_ignore_view_delete(f(this.clone()));
    let box_cb: Box<dyn Fn() -> js_sys::Promise> = Box::new(cb);
    Closure::wrap(box_cb)
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

pub struct WeakComponentLink<C: Component>(Rc<RefCell<Option<ComponentLink<C>>>>);

impl<C: Component> Clone for WeakComponentLink<C> {
    fn clone(&self) -> Self {
        Self(Rc::clone(&self.0))
    }
}

impl<C: Component> Default for WeakComponentLink<C> {
    fn default() -> Self {
        Self(Rc::default())
    }
}

impl<C: Component> Deref for WeakComponentLink<C> {
    type Target = Rc<RefCell<Option<ComponentLink<C>>>>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<C: Component> PartialEq for WeakComponentLink<C> {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

#[macro_export]
macro_rules! enable_weak_link_test {
    ($props:expr, $link:expr) => {
        #[cfg(test)]
        {
            *$props.weak_link.borrow_mut() = Some($link.clone());
        }
    };
}

#[macro_export]
macro_rules! test_html {
    ($($html:tt)*) => {{
        use crate::components::perspective_vieux::CSS;
        use wasm_bindgen::JsCast;
        use yew::prelude::*;

        struct TestElement {
            html: Html
        }

        #[derive(Properties, Clone)]
        struct TestElementProps {
            html: Html
        }

        impl Component for TestElement {
            type Message = ();
            type Properties = TestElementProps;

            fn create(_props: Self::Properties, _link: ComponentLink<Self>) -> Self {
                TestElement {
                    html: _props.html,
                }
            }

            fn update(&mut self, _msg: Self::Message) -> ShouldRender {
                false
            }

            fn change(&mut self, _props: Self::Properties) -> ShouldRender {
                true
            }

            fn view(&self) -> Html {
                html! {
                    <>
                        <style>
                            { "#test{position:absolute;top:0;bottom:0;left:0;right:0;}" }
                            { &CSS }
                        </style>
                        { self.html.clone() }
                    </>
                }
            }
        }

        let window = web_sys::window().unwrap();
        let document = window.document().unwrap();
        let body = document.body().unwrap();
        let div = document.create_element("div").unwrap();
        body.append_child(&div).unwrap();

        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = div
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        let app = App::<TestElement>::new();
        app.mount_with_props(shadow_root, TestElementProps { html: html!{ $($html)* } })
    }}
}
