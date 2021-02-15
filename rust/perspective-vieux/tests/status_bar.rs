extern crate perspective_vieux;

use core::iter::FromIterator;
use futures::channel::oneshot::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use wasm_bindgen_test::*;

use perspective_vieux::js_object;
use perspective_vieux::status_bar::StatusBarElement;
use perspective_vieux::utils::perspective::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[cfg(test)]
fn create_element() -> (web_sys::Element, StatusBarElement) {
    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();
    let elem = document.create_element("div").unwrap();
    let status_bar = StatusBarElement::new(elem.clone().unchecked_into()).unwrap();
    (elem, status_bar)
}

#[cfg(test)]
#[wasm_bindgen(inline_js = "export async function worker() {
        await import('/pkg/perspective.inline.js'); 
        return window.perspective.worker(); 
    }")]
extern "C" {
    #[wasm_bindgen(inline_js = "window.perspective.worker()")]
    fn worker() -> js_sys::Promise;
}

/// Just assert that attaching the element renders the default HTML to the `shadowRoot`.
#[cfg(test)]
#[wasm_bindgen_test]
pub fn test_html() {
    let (elem, _) = create_element();
    let txt = elem.shadow_root().unwrap().inner_html();
    assert_eq!(
        txt,
        format!(
            "<style>{}</style><div class=\"section\"><span \
class=\"\" id=\"status\"></span></div><div class=\"section\"><span class=\"button\" \
id=\"reset\"><span>Reset</span></span><span class=\"button\" id=\"export\"><span>Export\
</span></span><span class=\"button\" id=\"copy\"><span>Copy</span></span></div><div \
class=\"section\" id=\"rows\"><span>0 rows</span></div>",
            include_str!("../dist/css/container.css")
        )
    );
}

/// Tests that the rows count is set correctly when a `table` is loaded.
#[cfg(test)]
#[wasm_bindgen_test]
pub async fn test_rows_count() {
    // Create the status bar
    let (elem, mut status_bar) = create_element();
    assert_eq!(elem.shadow_root().unwrap().children().length(), 4);

    // Create a perspective Worker, Table, View
    let worker: PerspectiveJsWorker =
        JsFuture::from(worker()).await.unwrap().unchecked_into();

    let table = worker
        .table(js_object!(
            "A",
            js_sys::Array::from_iter(
                [JsValue::from(1), JsValue::from(2), JsValue::from(3)].iter()
            )
        ))
        .await
        .unwrap()
        .unchecked_into::<PerspectiveJsTable>();

    let view = table.view(js_object!()).await.unwrap();

    // Set these perspective parts to the status bar
    let table_promise = js_sys::Promise::resolve(&table);
    JsFuture::from(status_bar.set_table(table_promise).unwrap())
        .await
        .unwrap();

    JsFuture::from(status_bar.set_view(view).unwrap())
        .await
        .unwrap();

    // Find the `rows` span.
    let span: web_sys::HtmlElement = elem
        .shadow_root()
        .unwrap()
        .query_selector("#rows span")
        .unwrap()
        .unwrap()
        .unchecked_into();

    assert_eq!(span.text_content().unwrap(), "3 rows");
}

/// Tests that the `EXPORT` button works by clicking on it and looking for the DOM side
/// effects.
#[cfg(test)]
#[wasm_bindgen_test]
pub async fn test_download() {
    // Create the status bar
    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();
    let (elem, mut status_bar) = create_element();
    assert_eq!(elem.shadow_root().unwrap().children().length(), 4);

    // Create a `MutationListener` and async channel to signal us when the download
    // button attaches the invisible button to `document.body`.
    let (sender, receiver) = channel::<String>();
    let b: Box<dyn FnOnce(js_sys::Array, web_sys::MutationObserver)> =
        Box::new(|_mut_list, _observer| {
            let elem = _mut_list
                .get(0)
                .unchecked_into::<web_sys::MutationRecord>()
                .added_nodes()
                .get(0)
                .unwrap()
                .unchecked_into::<web_sys::HtmlElement>();
            let href = elem.get_attribute("href").unwrap();
            sender.send(href).unwrap();
        });

    let mut config = web_sys::MutationObserverInit::new();
    config.child_list(true);
    web_sys::MutationObserver::new(&Closure::once(b).into_js_value().unchecked_into())
        .unwrap()
        .observe_with_options(&document.body().unwrap(), &config)
        .unwrap();

    // Create a perspective Worker, Table, View
    let worker: PerspectiveJsWorker =
        JsFuture::from(worker()).await.unwrap().unchecked_into();

    let table = worker
        .table(js_object!(
            "A",
            js_sys::Array::from_iter(
                [JsValue::from(1), JsValue::from(2), JsValue::from(3)].iter()
            )
        ))
        .await
        .unwrap()
        .unchecked_into::<PerspectiveJsTable>();
    let size = table.size().await.unwrap() as usize;
    assert_eq!(size, 3);

    let view = table.view(js_object!()).await.unwrap();

    // Set these perspective parts to the status bar
    let table_promise = js_sys::Promise::resolve(&table);
    JsFuture::from(status_bar.set_table(table_promise).unwrap())
        .await
        .unwrap();

    JsFuture::from(status_bar.set_view(view).unwrap())
        .await
        .unwrap();

    // Find and click the `EXPORT` button.
    let button: web_sys::HtmlElement = elem
        .shadow_root()
        .unwrap()
        .query_selector("span.button#export")
        .unwrap()
        .unwrap()
        .unchecked_into();

    button.click();

    // Await the `MutationObserver` we set up earlier, and validate that its `href`
    // attribute is at least a blob.
    assert_eq!(&receiver.await.unwrap()[..5], "blob:");
}
