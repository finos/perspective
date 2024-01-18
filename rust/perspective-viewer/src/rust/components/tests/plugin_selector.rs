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

use std::cell::RefCell;
use std::rc::Rc;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_test::*;
use web_sys::*;
use yew::prelude::*;

use crate::components::plugin_selector::*;
use crate::js::*;
use crate::presentation::Presentation;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

/// Perspective FFI
#[wasm_bindgen(inline_js = "

    function generatePlugin(name) {
        return class DebugPlugin extends HTMLElement {
            constructor() {
                super();
            }

            get name() {
                return 'Debug ' + name;
            }
    
            get select_mode() {
                return 'toggle';
            }
    
            get min_config_columns() {
                return undefined;
            }
    
            get config_column_names() {
                return undefined;
            }
    
            update(...args) {
                return this.draw(...args);
            }
    
            async draw(view) {
                this.style.backgroundColor = '#fff';
                let perspective_viewer = this.parentElement;
                const csv = await view.to_csv();
                const css = `margin:0;overflow:scroll;position:absolute;width:100%;height:100%`;
                this.innerHTML = `<pre style='${css}'>${csv}</pre>`;
            }
    
            async clear() {
                this.innerHtml = '';
            }
    
            async resize() {}
    
            save() {}
    
            restore() {}
    
            delete() {}
        };
    }

    customElements.define('perspective-viewer-plugin', generatePlugin('Default'));
    customElements.define('perspective-viewer-debug2', generatePlugin('A'));
    customElements.define('perspective-viewer-debug3', generatePlugin('B'));
    customElements.define('perspective-viewer-debug4', generatePlugin('C'));

    export function register_test_components() {}
")]
#[rustfmt::skip]
extern "C" {

    // With `cargo test`, the TypeScript container is not loaded, so the
    // `<perspective-viewer-plugin>` element does not exist.  Without a stub
    // export, the accompanying snippet will be DCE'd.
    #[wasm_bindgen(js_name = "register_test_components", catch)]
    pub fn register_test_components() -> ApiResult<()>;

}

#[wasm_bindgen_test]
pub async fn test_plugin_selected() {
    register_test_components().unwrap();
    PLUGIN_REGISTRY.register_plugin("perspective-viewer-debug2");
    PLUGIN_REGISTRY.register_plugin("perspective-viewer-debug3");
    PLUGIN_REGISTRY.register_plugin("perspective-viewer-debug4");

    let link: WeakScope<PluginSelector> = WeakScope::default();
    let result: Rc<RefCell<Option<JsPerspectiveViewerPlugin>>> = Rc::new(RefCell::new(None));
    let document = window().unwrap().document().unwrap();
    let elem: HtmlElement = document.create_element("div").unwrap().unchecked_into();
    let session = Session::default();
    session.set_table(get_mock_table().await).await.unwrap();
    let renderer = Renderer::new(&elem);
    let _sub = renderer.plugin_changed.add_listener({
        clone!(result);
        move |val| {
            *result.borrow_mut() = Some(val);
        }
    });
    let presentation = Presentation::new(&elem);

    test_html! {
        <PluginSelector
            renderer={ renderer.clone() }
            session={ session.clone() }
            presentation={presentation.clone()}
            weak_link={ link.clone() }>

        </PluginSelector>
    };

    request_animation_frame().await;
    let plugin_selector = link.borrow().clone().unwrap();
    plugin_selector.send_message(PluginSelectorMsg::ComponentSelectPlugin(
        "Debug B".to_owned(),
    ));

    request_animation_frame().await;
    assert_eq!(
        result.borrow().as_ref().map(|x| x.name()),
        Some("Debug B".to_owned())
    );

    assert_eq!(renderer.get_active_plugin().unwrap().name(), "Debug B");
}
