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

pub mod registry;

use crate::config::*;
use crate::js::perspective::*;
use crate::js::plugin::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

use self::activate::*;
use self::limits::*;
use self::render_timer::*;

use registry::*;
use std::cell::{Ref, RefCell};
use std::future::Future;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use web_sys::*;
use yew::prelude::*;

#[derive(Clone)]
pub struct Renderer(Rc<PluginHandle>);

/// Immutable state
pub struct PluginHandle {
    plugin_data: RefCell<PluginData>,
    draw_lock: DebounceMutex,
    _session: Session,
    pub on_plugin_changed: PubSub<JsPerspectiveViewerPlugin>,
    pub on_limits_changed: PubSub<RenderLimits>,
}

type RenderLimits = (usize, usize, Option<usize>, Option<usize>);

pub struct PluginData {
    viewer_elem: HtmlElement,
    metadata: ViewConfigRequirements,
    plugins: Vec<JsPerspectiveViewerPlugin>,
    plugins_idx: Option<usize>,
    timer: MovingWindowRenderTimer,
}

impl Deref for Renderer {
    type Target = PluginHandle;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl Deref for PluginHandle {
    type Target = RefCell<PluginData>;
    fn deref(&self) -> &Self::Target {
        &self.plugin_data
    }
}

impl Renderer {
    pub fn new(viewer_elem: HtmlElement, _session: Session) -> Renderer {
        Renderer(Rc::new(PluginHandle {
            plugin_data: RefCell::new(PluginData {
                viewer_elem,
                metadata: ViewConfigRequirements::default(),
                plugins: PLUGIN_REGISTRY.create_plugins(),
                plugins_idx: None,
                timer: MovingWindowRenderTimer::default(),
            }),
            _session,
            draw_lock: Default::default(),
            on_plugin_changed: Default::default(),
            on_limits_changed: Default::default(),
        }))
    }

    pub fn reset(&self) {
        self.0.borrow_mut().plugins_idx = None;
        if let Ok(plugin) = self.get_active_plugin() {
            plugin.restore(&js_object!());
        }
    }

    pub fn delete(&self) -> Result<(), JsValue> {
        self.get_active_plugin()?.delete();
        Ok(())
    }

    pub fn metadata(&self) -> Ref<'_, ViewConfigRequirements> {
        Ref::map(self.borrow(), |x| &x.metadata)
    }

    /// Return all plugin instances, whether they are active or not.  Useful
    /// for configuring all or specific plugins at application init.
    pub fn get_all_plugins(&self) -> Vec<JsPerspectiveViewerPlugin> {
        self.0.borrow().plugins.clone()
    }

    /// Gets the currently active plugin.  Calling this method before a plugin has
    /// been selected will cause the default (first) plugin to be selected, and doing
    /// so when no plugins have been registered is an error.
    pub fn get_active_plugin(&self) -> Result<JsPerspectiveViewerPlugin, JsValue> {
        if self.0.borrow().plugins_idx.is_none() {
            self.set_plugin(Some(&PLUGIN_REGISTRY.default_plugin_name()))?;
        }

        let idx = self.0.borrow().plugins_idx.unwrap_or(0);
        let result = self.0.borrow().plugins.get(idx).cloned();
        result.ok_or_else(|| JsValue::from("No Plugin"))
    }

    /// Gets a specific `JsPerspectiveViewerPlugin` by name.
    ///
    /// # Arguments
    /// - `name` The plugin name to lookup.
    pub fn get_plugin(&self, name: &str) -> Result<JsPerspectiveViewerPlugin, JsValue> {
        let idx = self.find_plugin_idx(name);
        let idx = idx.ok_or_else(|| JsValue::from(format!("No Plugin `{}`", name)))?;
        let result = self.0.borrow().plugins.get(idx).cloned();
        Ok(result.unwrap())
    }

    pub fn set_throttle(&mut self, val: Option<f64>) {
        self.0.borrow_mut().timer.set_throttle(val);
    }

    pub fn disable_active_plugin_render_warning(&self) {
        self.borrow_mut().metadata.render_warning = false;
        self.get_active_plugin().unwrap().set_render_warning(false);
    }

    pub fn update_plugin(&self, update: PluginUpdate) -> Result<bool, JsValue> {
        match &update {
            PluginUpdate::Missing => Ok(false),
            PluginUpdate::SetDefault => self.set_plugin(None),
            PluginUpdate::Update(plugin) => self.set_plugin(Some(plugin)),
        }
    }

    /// Set the active plugin to the plugin registerd as `name`, or the default
    /// plugin if `None` is provided.
    ///
    /// # Arguments
    /// - `name` The optional plugin name to set as active.
    pub fn set_plugin(&self, name: Option<&str>) -> Result<bool, JsValue> {
        let default_plugin_name = PLUGIN_REGISTRY.default_plugin_name();
        let name = name.unwrap_or_else(|| default_plugin_name.as_str());
        let idx = self
            .find_plugin_idx(name)
            .ok_or_else(|| JsValue::from(format!("Unkown plugin '{}'", name)))?;

        let changed = !matches!(
            self.0.borrow().plugins_idx,
            Some(selected_idx) if selected_idx == idx
        );

        if changed {
            self.borrow_mut().plugins_idx = Some(idx);
            let plugin: JsPerspectiveViewerPlugin = self.get_active_plugin()?;
            self.borrow_mut().metadata = plugin.get_requirements()?;
            self.on_plugin_changed.emit_all(plugin);
        }

        Ok(changed)
    }

    pub async fn resize(&self) -> Result<JsValue, JsValue> {
        let draw_mutex = self.draw_lock();
        draw_mutex
            .debounce(async {
                let jsplugin = self.get_active_plugin()?;
                jsplugin.resize().await?;
                Ok(JsValue::from(true))
            })
            .await
    }

    pub async fn draw(
        &self,
        session: impl Future<Output = Result<&Session, JsValue>>,
    ) -> Result<JsValue, JsValue> {
        self.draw_plugin(session, false).await
    }

    pub async fn update(&self, session: &Session) -> Result<JsValue, JsValue> {
        self.draw_plugin(async { Ok(session) }, true).await
    }

    async fn draw_plugin(
        &self,
        session: impl Future<Output = Result<&Session, JsValue>>,
        is_update: bool,
    ) -> Result<JsValue, JsValue> {
        let timer = self.render_timer();
        let task = async move {
            if is_update {
                set_timeout(timer.get_avg()).await?;
            }

            if let Some(view) = session.await?.get_view() {
                timer.capture_time(self.draw_view(&view, is_update)).await
            } else {
                Ok(JsValue::from(true))
            }
        };

        let draw_mutex = self.draw_lock();
        draw_mutex.debounce(task).await
    }

    async fn draw_view(
        &self,
        view: &JsPerspectiveView,
        is_update: bool,
    ) -> Result<JsValue, JsValue> {
        let plugin = self.get_active_plugin()?;
        let meta = self.metadata().clone();
        let limits = get_row_and_col_limits(view, &meta).await?;
        self.on_limits_changed.emit_all(limits);
        let viewer_elem = &self.0.borrow().viewer_elem.clone();
        if is_update {
            let task = plugin.update(view, limits.2, limits.3, false);
            activate_plugin(viewer_elem, &plugin, task).await
        } else {
            let task = plugin.draw(view, limits.2, limits.3, false);
            activate_plugin(viewer_elem, &plugin, task).await
        }
    }

    pub async fn presize(
        &self,
        open: bool,
        on_toggle: impl Future<Output = Result<(), JsValue>>,
    ) -> Result<JsValue, JsValue> {
        let task = async {
            let plugin = self.get_active_plugin()?;
            if open {
                on_toggle.await?;
                plugin.resize().await
            } else {
                let main_panel: web_sys::HtmlElement = self
                    .0
                    .borrow()
                    .viewer_elem
                    .children()
                    .item(0)
                    .unwrap()
                    .unchecked_into();
                let new_width =
                    format!("{}px", &self.0.borrow().viewer_elem.client_width());
                let new_height =
                    format!("{}px", &self.0.borrow().viewer_elem.client_height());
                main_panel.style().set_property("width", &new_width)?;
                main_panel.style().set_property("height", &new_height)?;
                let resize = plugin.resize().await;
                main_panel.style().set_property("width", "")?;
                main_panel.style().set_property("height", "")?;
                on_toggle.await?;
                resize
            }
        };
        self.draw_lock().lock(task).await
    }

    fn draw_lock(&self) -> DebounceMutex {
        self.draw_lock.clone()
    }

    fn render_timer(&self) -> MovingWindowRenderTimer {
        self.0.borrow().timer.clone()
    }

    fn find_plugin_idx(&self, name: &str) -> Option<usize> {
        let short_name = make_short_name(name);
        let elements = &self.0.borrow().plugins;
        elements
            .iter()
            .position(|elem| make_short_name(&elem.name()).contains(&short_name))
    }
}

fn make_short_name(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .filter(|x| x.is_alphabetic())
        .collect()
}

/// A `RenderableProps` is a `Properties` with `session` and `renderer` fields, as
/// this method is boilerplate but has no other trait to live on currently.  As
/// I'm too lazy to be bothered to implement a `proc-macro` crate, instead this
/// trait can be conveniently derived via the `derive_renderable_props!()` macro
/// on a suitable struct.
pub trait RenderableProps: Properties {
    fn update_and_render(&self, update: ViewConfigUpdate);
    fn render(&self);
}

#[macro_export]
macro_rules! derive_renderable_props {
    ($key:ident) => {
        impl crate::renderer::RenderableProps for $key {
            fn update_and_render(&self, update: crate::config::ViewConfigUpdate) {
                crate::renderer::update_and_render(
                    &self.session,
                    &self.renderer,
                    update,
                );
            }

            fn render(&self) {
                crate::renderer::render(&self.session, &self.renderer);
            }
        }
    };
}

pub fn update_and_render(
    session: &Session,
    renderer: &Renderer,
    update: ViewConfigUpdate,
) {
    session.update_view_config(update);
    let session = session.clone();
    let renderer = renderer.clone();
    let _ = future_to_promise(async move {
        drop(
            renderer
                .draw(session.validate().await.create_view())
                .await?,
        );
        Ok(JsValue::UNDEFINED)
    });
}

pub fn render(session: &Session, renderer: &Renderer) {
    let session = session.clone();
    let renderer = renderer.clone();
    let _ = future_to_promise(async move {
        drop(renderer.draw(async { Ok(&session) }).await?);
        Ok(JsValue::UNDEFINED)
    });
}
