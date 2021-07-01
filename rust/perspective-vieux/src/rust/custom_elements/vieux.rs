////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::vieux::*;
use crate::custom_elements::expression_editor::PerspectiveExpressionEditorElement;
use crate::plugin::registry::*;
use crate::plugin::*;
use crate::session::Session;
use crate::utils::perspective::*;
use crate::utils::perspective_viewer::PerspectiveViewerJsPlugin;
use crate::utils::*;
use crate::*;

use futures::channel::oneshot::*;
use js_sys::*;
use std::cell::RefCell;
use std::iter::FromIterator;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use wasm_bindgen_futures::JsFuture;
use web_sys::*;
use yew::prelude::*;

fn get_theme(elem: &HtmlElement) -> String {
    let styles = window().unwrap().get_computed_style(elem).unwrap().unwrap();
    match &styles.get_property_value("--monaco-theme") {
        Err(_) => "vs",
        Ok(ref s) if s.trim() == "" => "vs",
        Ok(x) => x.trim(),
    }
    .to_owned()
}

/// A `customElements` external API.
#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveVieuxElement {
    elem: HtmlElement,
    root: ComponentLink<PerspectiveVieux>,
    session: Session,
    plugin: Plugin,
    expression_editor: Rc<RefCell<Option<PerspectiveExpressionEditorElement>>>,
}

fn update_plugin(elem: &HtmlElement, plugin: PerspectiveViewerJsPlugin) {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&plugin);
    let event = web_sys::CustomEvent::new_with_event_init_dict(
        "-perspective-plugin-changed",
        &event_init,
    );

    elem.dispatch_event(&event.unwrap()).unwrap();
}

#[wasm_bindgen]
impl PerspectiveVieuxElement {
    #[wasm_bindgen(constructor)]
    pub fn new(elem: web_sys::HtmlElement) -> PerspectiveVieuxElement {
        let children = elem.children();
        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = elem
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        let session = Session::new();
        let plugin = Plugin::new(session.clone(), {
            clone!(elem);
            vec![Box::new(move |plugin| update_plugin(&elem, plugin))]
        });

        let props = PerspectiveVieuxProps {
            elem: elem.clone(),
            panels: (
                children.item(0).unwrap().unchecked_into(),
                children.item(1).unwrap().unchecked_into(),
            ),
            session: session.clone(),
            plugin: plugin.clone(),
            weak_link: WeakComponentLink::default(),
        };

        let app = App::<PerspectiveVieux>::new();
        let root = app.mount_with_props(shadow_root, props);
        PerspectiveVieuxElement {
            elem,
            root,
            session,
            plugin,
            expression_editor: Rc::new(RefCell::new(None)),
        }
    }

    pub fn connected_callback(&self) {}

    pub fn load(&self, table: js_sys::Promise) -> js_sys::Promise {
        assert!(!table.is_undefined());
        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        let root = self.root.clone();
        future_to_promise(async move {
            let promise = JsFuture::from(table).await?;
            let table: PerspectiveJsTable = promise.unchecked_into();
            root.send_message(Msg::LoadTable(table, sender));
            receiver.await.unwrap()
        })
    }

    pub fn set_view(&self, view: PerspectiveJsView) {
        self.root.send_message(Msg::ViewLoaded(view));
    }

    pub fn delete_view(&self) {
        self.root.send_message(Msg::ViewDeleted);
    }

    /// Toggle (or force) the config panel open/closed.
    pub fn toggle_config(&self, force: Option<bool>) -> js_sys::Promise {
        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        let msg = Msg::ToggleConfig(force, Some(sender));
        self.root.send_message(msg);
        future_to_promise(async move {
            match receiver.await {
                Ok(x) => x,
                Err(_x) => Err(JsValue::from("Cancelled")),
            }
        })
    }

    pub fn get_plugins(&self) -> Result<Array, JsValue> {
        let plugins = Array::from_iter(
            PLUGIN_REGISTRY
                .available_plugin_names()
                .iter()
                .map(|name| self.get_plugin(Some(name.to_owned())))
                .collect::<Result<Vec<PerspectiveViewerJsPlugin>, JsValue>>()?
                .iter(),
        );
        Ok(plugins)
    }

    pub fn get_plugin(
        &self,
        name: Option<String>,
    ) -> Result<PerspectiveViewerJsPlugin, JsValue> {
        self.plugin.get_plugin(name)
    }

    pub fn set_plugin(&mut self, name: &str) -> Result<bool, JsValue> {
        self.plugin.set_plugin(Some(name))
    }

    pub fn set_plugin_default(&mut self) -> Result<bool, JsValue> {
        self.plugin.set_plugin(None)
    }

    fn create_expression_editor(
        &self,
        target: HtmlElement,
        ed: &mut Option<PerspectiveExpressionEditorElement>,
    ) {
        let document = window().unwrap().document().unwrap();
        let editor = document
            .create_element("perspective-expression-editor")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        editor
            .toggle_attribute_with_force("initializing", true)
            .unwrap();

        let on_save = {
            let this = self.clone();
            Rc::new(move |val| this.clone().save_expr(val))
        };

        let on_init = {
            clone!(editor);
            Rc::new(move || {
                editor
                    .toggle_attribute_with_force("initializing", false)
                    .unwrap();
            })
        };

        let on_validate = {
            clone!(editor);
            Rc::new(move |valid| {
                editor
                    .toggle_attribute_with_force("validating", valid)
                    .unwrap();
            })
        };

        let monaco_theme = get_theme(&target);
        let mut element = PerspectiveExpressionEditorElement::new(
            editor,
            self.session.clone(),
            on_save,
            on_init,
            on_validate,
            monaco_theme,
        );

        element.open(target).unwrap();
        *ed = Some(element);
    }

    /// Opens an expression editor at the `target` position, by first creating a
    /// `perspective-expression-editor` custom element, then creating the model.
    pub fn _open_expression_editor(&mut self, target: HtmlElement) {
        let mut x = self.expression_editor.borrow_mut();
        match x.as_mut() {
            Some(x) => x.open(target).unwrap(),
            _ => self.create_expression_editor(target, &mut *x),
        };
    }

    fn save_expr(&mut self, x: JsValue) {
        let mut event_init = web_sys::CustomEventInit::new();
        event_init.detail(&x);
        let event = web_sys::CustomEvent::new_with_event_init_dict(
            "-perspective-add-expression",
            &event_init,
        );

        self.expression_editor
            .borrow_mut()
            .as_mut()
            .unwrap()
            .close()
            .unwrap();

        self.elem.dispatch_event(&event.unwrap()).unwrap();
    }
}
