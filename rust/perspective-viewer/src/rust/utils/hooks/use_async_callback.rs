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

use wasm_bindgen::__rt::IntoJsResult;
use wasm_bindgen_futures::future_to_promise;
use yew::prelude::*;

use crate::renderer::*;
use crate::session::*;
use crate::*;

#[derive(Clone, Properties, PartialEq)]
pub struct StatusIndicatorProps {
    pub session: Session,
    pub renderer: Renderer,
    pub children: Children,
}

/// Just like `use_callback`, except convenient for an async cresult body.
#[hook]
pub fn use_async_callback<IN, OUT, F, D>(deps: D, f: F) -> Callback<IN, ()>
where
    IN: Clone + 'static,
    OUT: IntoJsResult + 'static,
    F: AsyncFn(IN, &D) -> OUT + 'static,
    D: Clone + PartialEq + 'static,
{
    let deps = std::rc::Rc::new(deps);
    let f = std::rc::Rc::new(f);
    (*use_memo(deps, move |deps| {
        let deps = deps.clone();
        let ff = move |value: IN| {
            let value = value.clone();
            let f = f.clone();
            let deps = deps.clone();
            let _ = future_to_promise(async move {
                f(value, &deps).await.into_js_result()?;
                Ok(JsValue::UNDEFINED)
            });
        };
        Callback::from(ff)
    }))
    .clone()
}
