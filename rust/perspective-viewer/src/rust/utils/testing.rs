////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

#[cfg(test)]
use {
    crate::js::perspective::*, crate::*, std::cell::RefCell, wasm_bindgen::prelude::*,
    wasm_bindgen::JsCast, wasm_bindgen_futures::JsFuture,
};

// Must use inline build because the test runner does not import itself in
// the browser with `type=module` which causes `import.meta` calls to fail,
// and `currentScript` does not resolve dynamic imports so the polyfill
// for `import.meta` does not work either.
#[cfg(test)]
#[wasm_bindgen(inline_js = "

    export async function worker() {
        await import('/dist/pkg/perspective.js');
        console.log(window.perspective);
        return window.perspective.worker();
    }

")]
extern "C" {
    fn worker() -> js_sys::Promise;
}

/// Generate a test `Table`, but only create teh webworker once or the tests
/// will figuratively literally run forever.
#[cfg(test)]
pub async fn get_mock_table() -> JsPerspectiveTable {
    thread_local! {
        static WORKER: RefCell<Option<JsPerspectiveWorker>> = RefCell::new(None);
    }

    let worker: JsPerspectiveWorker = match WORKER.with(|x| x.borrow().clone()) {
        Some(x) => x,
        None => JsFuture::from(worker()).await.unwrap().unchecked_into(),
    };

    WORKER.with(|x| {
        *x.borrow_mut() = Some(worker.clone());
    });

    worker
        .table(js_object!(
            "A",
            [JsValue::from(1), JsValue::from(2), JsValue::from(3)]
                .iter()
                .collect::<js_sys::Array>()
        ))
        .await
        .unwrap()
}

/// A macro which set a property called `weak_link` on the container
/// `Properties` when `cfg(test)`, such that unit tests may send messages to a
/// component. This macro needs to be called in `create()` on any Component
/// which needs to receive messages in a test.
#[macro_export]
macro_rules! enable_weak_link_test {
    ($props:expr, $link:expr) => {
        #[cfg(test)]
        {
            *$props.weak_link.borrow_mut() = Some($link.clone());
        }
    };
}

/// A macro which derives a `yew::Component` for an arbitrary HTML snippet and
/// mounts it, for testing.
#[macro_export]
macro_rules! test_html {
    ($($html:tt)*) => {{
        use crate::components::viewer::CSS;
        use wasm_bindgen::JsCast;
        use yew::prelude::*;

        struct TestElement {}

        #[derive(Properties, Clone, PartialEq)]
        struct TestElementProps {
            html: Html
        }

        impl Component for TestElement {
            type Message = ();
            type Properties = TestElementProps;

            fn create(_ctx: &Context<Self>) -> Self {
                TestElement {}
            }

            fn update(&mut self, _ctx: &Context<Self>, _msg: Self::Message) -> bool {
                false
            }

            fn changed(&mut self, _ctx: &Context<Self>) -> bool {
                true
            }

            fn view(&self, ctx: &Context<Self>) -> Html {
                html! {
                    <>
                        <style>
                            { "#test{position:absolute;top:0;bottom:0;left:0;right:0;}" }
                            { &CSS }
                        </style>
                        { ctx.props().html.clone() }
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

        yew::start_app_with_props_in_element::<TestElement>(shadow_root, TestElementProps { html: html!{ $($html)* } })
    }}
}
