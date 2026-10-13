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

use std::cell::{Cell, Ref, RefCell};
use std::future::Future;
use std::rc::Rc;

use futures::future::{join_all, select_all};
use perspective_js::utils::{global, *};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use yew::prelude::*;

use crate::utils::*;

const FONT_TEST_SAMPLE: &str = "ABCDΔ";

const FONT_DOWNLOAD_TIMEOUT_MS: i32 = 1000;

#[derive(Clone, Properties)]
pub struct FontLoaderProps {
    state: Rc<FontLoaderState>,
}

impl PartialEq for FontLoaderProps {
    fn eq(&self, _rhs: &Self) -> bool {
        false
    }
}

#[function_component(FontLoader)]
pub fn font_loader(props: &FontLoaderProps) -> Html {
    if matches!(props.get_status(), FontLoaderStatus::Finished) {
        html! {}
    } else {
        let inner = props
            .get_fonts()
            .iter()
            .map(font_test_html)
            .collect::<Html>();

        html! { <><style>{ ":host{opacity:0!important;}" }</style>{ inner }</> }
    }
}

/// The possible font loading state, which proceeds from top to bottom once per
/// `<perspective-viewer>` element.
#[derive(Clone, Copy)]
pub enum FontLoaderStatus {
    Uninitialized,
    Loading,
    Finished,
}

struct FontLoaderState {
    status: Cell<FontLoaderStatus>,
    elem: web_sys::HtmlElement,
    on_update: Callback<()>,
    fonts: RefCell<Vec<(String, String)>>,
}

type PromiseSet = Vec<ApiFuture<JsValue>>;

impl FontLoaderProps {
    pub fn new(elem: &web_sys::HtmlElement, on_update: Callback<()>) -> Self {
        let inner = FontLoaderState {
            status: Cell::new(FontLoaderStatus::Uninitialized),
            elem: elem.clone(),
            on_update,
            fonts: RefCell::new(vec![]),
        };

        let state = yew::props!(Self {
            state: Rc::new(inner)
        });

        ApiFuture::spawn(state.clone().load_fonts_task_safe());
        state
    }

    pub fn get_status(&self) -> FontLoaderStatus {
        self.state.status.get()
    }

    fn get_fonts(&'_ self) -> Ref<'_, Vec<(String, String)>> {
        self.state.fonts.borrow()
    }

    async fn load_fonts_task_safe(self) -> ApiResult<JsValue> {
        if let Err(msg) = self.load_fonts_task().await {
            web_sys::console::warn_1(&msg.into());
        };

        Ok(JsValue::UNDEFINED)
    }

    async fn load_fonts_task(self) -> ApiResult<JsValue> {
        await_dom_loaded().await?;
        let txt = global::window()
            .get_computed_style(&self.state.elem)?
            .unwrap()
            .get_property_value("--preload-fonts")?;

        let mut block_promises: PromiseSet = vec![];
        let preload_fonts = parse_fonts(&txt);
        self.state.fonts.borrow_mut().clone_from(&preload_fonts);
        self.state.status.set(FontLoaderStatus::Loading);
        self.state.on_update.emit(());

        for (family, weight) in preload_fonts.iter() {
            let block_fonts: PromiseSet = vec![
                ApiFuture::new(timeout_font_task(family, weight)),
                ApiFuture::new(await_font(family.clone(), weight.clone())),
            ];

            let fut = async { select_all(block_fonts).await.0 };
            block_promises.push(ApiFuture::new(fut))
        }

        let res = join_all(block_promises)
            .await
            .into_iter()
            .collect::<ApiResult<Vec<JsValue>>>()
            .map(|_| JsValue::UNDEFINED);

        self.state.status.set(FontLoaderStatus::Finished);
        self.state.on_update.emit(());
        res
    }
}

/// Resolve once the `@font-face`s needed to render [`FONT_TEST_SAMPLE`] in
/// `(family, weight)` are loaded — `FontFaceSet.load(spec, text)` both
/// triggers and awaits exactly those SUBSET faces, never a sibling
/// unicode-range face the page may never use. It resolves EMPTY while the
/// family has no registration at all (its stylesheet may still be fetching,
/// and Firefox registers lazily-parsed faces later than Chrome), so poll.
async fn await_font(family: String, weight: String) -> ApiResult<JsValue> {
    let spec = format!("{weight} 12px \"{family}\"");
    loop {
        let fonts = global::document().fonts();
        let loaded = JsFuture::from(fonts.load_with_text(&spec, FONT_TEST_SAMPLE)).await?;
        if js_sys::Array::from(&loaded).length() > 0 {
            return Ok(JsValue::UNDEFINED);
        }

        set_timeout(100).await?;
    }
}

fn timeout_font_task(
    family: &str,
    weight: &str,
) -> impl Future<Output = ApiResult<JsValue>> + use<> {
    let timeout_msg = format!("Timeout awaiting font \"{family}:{weight}\"");
    async {
        set_timeout(FONT_DOWNLOAD_TIMEOUT_MS).await?;
        Err(timeout_msg.into())
    }
}

fn font_test_html((family, weight): &(String, String)) -> Html {
    let style = format!("opacity:0;font-family:\"{family}\";font-weight:{weight}");

    html! { <span {style}>{ FONT_TEST_SAMPLE }</span> }
}

fn parse_font(txt: &str) -> Option<Vec<(String, String)>> {
    match *txt.trim().split(':').collect::<Vec<_>>().as_slice() {
        [family, weights] => Some(
            weights
                .split(',')
                .map(|weight| (family.to_owned(), weight.to_owned()))
                .collect::<Vec<_>>(),
        ),
        _ => None,
    }
}

fn parse_fonts(txt: &str) -> Vec<(String, String)> {
    let trim = txt.trim();
    let trim = if trim.len() > 2 {
        &trim[1..trim.len() - 1]
    } else {
        trim
    };

    trim.split(';')
        .filter_map(parse_font)
        .flatten()
        .collect::<Vec<_>>()
}
