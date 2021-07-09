////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod activate;
mod limits;
mod render_timer;

use crate::components::vieux::*;
use crate::config::*;
use crate::custom_elements::expression_editor::PerspectiveExpressionEditorElement;
use crate::js::perspective::*;
use crate::js::perspective_viewer::JsPerspectiveViewerPlugin;
use crate::plugin::*;
use crate::session::Session;
use crate::utils::*;
use crate::*;

use activate::activate_plugin;
use limits::get_row_and_col_limits;
use render_timer::MovingWindowRenderTimer;

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
    timer: MovingWindowRenderTimer,
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

        let session = Session::default();
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
            session: session.clone(),
            plugin: plugin.clone(),
            expression_editor: Rc::new(RefCell::new(None)),
            config,
            timer: MovingWindowRenderTimer::default(),
        };

        plugin.add_on_plugin_changed({
            clone!(pve);
            move |plugin| pve.on_plugin_changed(plugin)
        });

        session.add_on_update_callback({
            clone!(pve);
            move || pve.on_update()
        });

        pve
    }

    pub fn connected_callback(&self) {}

    /// Loads a promise to a `JsPerspectiveTable` in this viewer.
    pub fn load(&self, table: js_sys::Promise) -> js_sys::Promise {
        assert!(!table.is_undefined());
        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        let root = self.root.clone();
        future_to_promise(async move {
            let promise = JsFuture::from(table).await?;
            let table: JsPerspectiveTable = promise.unchecked_into();
            root.send_message(Msg::LoadTable(table, sender));
            receiver.await.to_jserror()?
        })
    }

    pub fn _create_view(&self, update: &JsValue, force: bool) -> js_sys::Promise {
        future_to_promise(
            self.clone()
                .create_view(update.into_serde().unwrap(), force),
        )
    }

    async fn create_view(
        self,
        update: ViewConfigUpdate,
        force: bool,
    ) -> Result<JsValue, JsValue> {
        let _changed = self.config.borrow_mut().view_config.apply_update(update);
        let config = self.config.borrow().view_config.clone();
        self.session.clear_view();
        self.session.clone().create_view(&config).await?;
        let _ = self.clone().draw(force, false).await?;
        Ok(self.session.get_view().unwrap().unchecked_into())
    }

    pub fn resize(&self) -> js_sys::Promise {
        let plugin = self.plugin.clone();
        future_to_promise(async move {
            plugin
                .draw_lock()
                .debounce(async {
                    let jsplugin = plugin.get_plugin(None)?;
                    jsplugin.resize().await?;
                    Ok(JsValue::from(true))
                })
                .await
        })
    }

    pub fn _get_render_time(&self) -> f64 {
        self.timer.get_avg()
    }

    pub fn _set_render_time(&mut self, val: Option<f64>) {
        self.timer.set_render_time(val);
    }

    pub fn _draw(&self, force: bool, is_update: bool) -> js_sys::Promise {
        future_to_promise(self.clone().draw(force, is_update))
    }

    async fn draw(self, force: bool, is_update: bool) -> Result<JsValue, JsValue> {
        self.plugin
            .draw_lock()
            .debounce(self.timer.capture_time(async {
                if let Some(view) = self.session.get_view() {
                    let plugin = self.plugin.get_plugin(None)?;
                    let (num_cols, num_rows, max_cols, max_rows) =
                        get_row_and_col_limits(&view, &plugin).await?;

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
                } else {
                    Ok(JsValue::from(true))
                }
            }))
            .await
    }

    /// Toggle (or force) the config panel open/closed.
    ///
    /// # Arguments
    /// - `force` Force the state of the panel open or closed, or `None` to toggle.
    pub fn toggle_config(&self, force: Option<bool>) -> js_sys::Promise {
        let this = self.clone();
        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        let msg = Msg::ToggleConfig(force, Some(sender));
        this.root.send_message(msg);
        future_to_promise(async move {
            receiver.await.map_err(|_| JsValue::from("Cancelled"))?
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
    ) -> Result<JsPerspectiveViewerPlugin, JsValue> {
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

    fn on_plugin_changed(&self, plugin: JsPerspectiveViewerPlugin) {
        dispatch_plugin_changed(&self.elem, plugin);
    }

    fn on_update(&self) {
        drop(self._draw(false, true))
    }

    fn create_expression_editor(
        &self,
        target: HtmlElement,
    ) -> PerspectiveExpressionEditorElement {
        let on_save = Callback::from({
            let this = self.clone();
            move |val| this.clone().save_expr(val)
        });

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

fn dispatch_plugin_changed(elem: &HtmlElement, plugin: JsPerspectiveViewerPlugin) {
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
