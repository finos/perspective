////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod activate;
mod limits;

use crate::components::vieux::*;
use crate::config::*;
use crate::custom_elements::expression_editor::PerspectiveExpressionEditorElement;
use crate::js::perspective::*;
use crate::js::perspective_viewer::PerspectiveViewerJsPlugin;
use crate::plugin::*;
use crate::session::Session;
use crate::utils::*;
use crate::*;

use activate::activate_plugin;
use limits::get_row_and_col_limits;

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

/// A `customElements` external API.
#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveVieuxElement {
    elem: HtmlElement,
    root: ComponentLink<PerspectiveVieux>,
    session: Session,
    plugin: Plugin,
    expression_editor: Rc<RefCell<Option<PerspectiveExpressionEditorElement>>>,
    config: Rc<RefCell<ViewerConfig>>,
    draw_lock: DebounceMutex,
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
        let plugin = Plugin::new(session.clone());

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

        let config = Rc::new(RefCell::new(ViewerConfig::new(&plugin)));
        let app = App::<PerspectiveVieux>::new();
        let root = app.mount_with_props(shadow_root, props);
        let pve = PerspectiveVieuxElement {
            elem,
            root,
            session,
            plugin: plugin.clone(),
            expression_editor: Rc::new(RefCell::new(None)),
            config,
            draw_lock: DebounceMutex::default(),
        };

        plugin.add_on_plugin_changed({
            clone!(pve);
            move |plugin| pve.on_plugin_changed(plugin)
        });

        pve
    }

    pub fn connected_callback(&self) {}

    /// Loads a promise to a `PerspectiveJsTable` in this viewer.
    pub fn load(&self, table: js_sys::Promise) -> js_sys::Promise {
        assert!(!table.is_undefined());
        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        let root = self.root.clone();
        future_to_promise(async move {
            let promise = JsFuture::from(table).await?;
            let table: PerspectiveJsTable = promise.unchecked_into();
            root.send_message(Msg::LoadTable(table, sender));
            receiver.await.to_jserror()?
        })
    }

    pub fn _create_view(&self, update: &JsValue) -> js_sys::Promise {
        future_to_promise(self.clone().create_view(update.into_serde().unwrap()))
    }

    async fn create_view(self, update: ViewConfigUpdate) -> Result<JsValue, JsValue> {
        let _changed = self.config.borrow_mut().view_config.apply_update(update);
        let config = self.config.borrow().view_config.clone();
        self.session.clear_view();
        self.session.clone().create_view(&config).await?;
        Ok(self.session.get_view().unwrap().unchecked_into())
    }

    pub fn _draw(&self, limit: bool, force: bool, is_update: bool) -> js_sys::Promise {
        future_to_promise(self.clone().draw(limit, force, is_update))
    }

    async fn draw(
        self,
        limit: bool,
        force: bool,
        is_update: bool,
    ) -> Result<JsValue, JsValue> {
        match self.draw_lock.debounce().await {
            None => Ok(JsValue::from(false)),
            Some(_guard) => match self.session.get_view() {
                None => Ok(JsValue::from(false)),
                Some(view) => {
                    let plugin = self.plugin.get_plugin(None)?;
                    let (num_cols, num_rows, max_cols, max_rows) =
                        get_row_and_col_limits(&view, &plugin, limit).await?;

                    self.root.send_message(Msg::RenderDimensions(Some((
                        num_cols, num_rows, max_cols, max_rows,
                    ))));

                    activate_plugin(&self.elem, &plugin, async {
                        if is_update {
                            plugin.update(&view, max_cols, max_rows, force).await
                        } else {
                            plugin.draw(&view, max_cols, max_rows, force).await
                        }
                    })
                    .await
                }
            },
        }
    }

    /// Toggle (or force) the config panel open/closed.
    ///
    /// # Arguments
    /// - `force` Force the state of the panel open or closed, or `None` to toggle.
    pub fn toggle_config(&self, force: Option<bool>) -> js_sys::Promise {
        let this = self.clone();
        future_to_promise(async move {
            let _guard = this.draw_lock.lock().await;
            let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
            let msg = Msg::ToggleConfig(force, Some(sender));
            this.root.send_message(msg);
            match receiver.await {
                Ok(x) => x,
                Err(_x) => Err(JsValue::from("Cancelled")),
            }
        })
    }

    /// Get an `Array` of all of the plugin custom elements registered for this element.
    /// This may not include plugins which called `registerPlugin()` after the host has
    /// rendered for the first time.
    pub fn get_all_plugins(&self) -> Array {
        Array::from_iter(self.plugin.get_all_plugins().iter())
    }

    /// Gets a plugin Custom Element with the `name` field, or get the active plugin
    /// if no `name` is provided.
    ///
    /// # Arguments
    /// - `name` The `name` property of a perspective plugin Custom Element, or `None`
    ///   for the active plugin's Custom Element.
    pub fn get_plugin(
        &self,
        name: Option<String>,
    ) -> Result<PerspectiveViewerJsPlugin, JsValue> {
        self.plugin.get_plugin(name.as_deref())
    }

    /// Sets the active plugin to the plugin with the `name` field, or get the default
    /// plugin if no `name` is provided.
    ///
    /// # Arguments
    /// - `name` The `name` property of a perspective plugin Custom Element, or `None`
    ///   for the default plugin.
    pub fn set_plugin(&mut self, name: Option<String>) -> Result<bool, JsValue> {
        self.plugin.set_plugin(name.as_deref())
    }

    /// Opens an expression editor at the `target` position, by first creating a
    /// `perspective-expression-editor` custom element, then creating the model.
    ///
    /// # Arguments
    /// - `target` The `HtmlElements` in the DOM to pin the floating editor modal to.
    pub fn _open_expression_editor(&mut self, target: HtmlElement) {
        let mut x = self.expression_editor.borrow_mut();
        match x.as_mut() {
            Some(x) => x.open(target).unwrap(),
            _ => *x = Some(self.create_expression_editor(target)),
        };
    }

    fn on_plugin_changed(&self, plugin: PerspectiveViewerJsPlugin) {
        dispatch_plugin_changed(&self.elem, plugin);
    }

    fn create_expression_editor(
        &self,
        target: HtmlElement,
    ) -> PerspectiveExpressionEditorElement {
        let on_save = {
            let this = self.clone();
            Rc::new(move |val| this.clone().save_expr(val))
        };

        let monaco_theme = get_theme(&target);
        let mut element = PerspectiveExpressionEditorElement::new(
            self.session.clone(),
            on_save,
            monaco_theme,
        );

        element.open(target).unwrap();
        element
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

fn dispatch_plugin_changed(elem: &HtmlElement, plugin: PerspectiveViewerJsPlugin) {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&plugin);
    let event = web_sys::CustomEvent::new_with_event_init_dict(
        "-perspective-plugin-changed",
        &event_init,
    );

    elem.dispatch_event(&event.unwrap()).unwrap();
}

fn get_theme(elem: &HtmlElement) -> String {
    let styles = window().unwrap().get_computed_style(elem).unwrap().unwrap();
    match &styles.get_property_value("--monaco-theme") {
        Err(_) => "vs",
        Ok(ref s) if s.trim() == "" => "vs",
        Ok(x) => x.trim(),
    }
    .to_owned()
}
