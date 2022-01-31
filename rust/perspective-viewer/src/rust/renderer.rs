////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod activate;
mod limits;
mod plugin_store;
mod render_timer;
mod theme_store;

pub mod registry;

use self::activate::*;
use self::limits::*;
use self::plugin_store::*;
use self::render_timer::*;
use self::theme_store::*;
use crate::config::*;
use crate::js::perspective::*;
use crate::js::plugin::*;
use crate::session::*;
use crate::utils::*;
use crate::*;
use futures::future::join_all;
use registry::*;
use std::cell::{Ref, RefCell};
use std::future::Future;
use std::ops::Deref;
use std::pin::Pin;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;

#[derive(Clone)]
pub struct Renderer(Rc<RendererData>);

/// Immutable state
pub struct RendererData {
    plugin_data: RefCell<RendererMutData>,
    draw_lock: DebounceMutex,
    _session: Session,
    pub on_plugin_changed: PubSub<JsPerspectiveViewerPlugin>,
    pub on_limits_changed: PubSub<RenderLimits>,
    pub on_settings_open_changed: PubSub<bool>,
    pub on_theme_config_updated: PubSub<(Vec<String>, Option<usize>)>,
}

/// Mutable state
pub struct RendererMutData {
    viewer_elem: HtmlElement,
    theme_store: ThemeStore,
    metadata: ViewConfigRequirements,
    plugin_store: PluginStore,
    plugins_idx: Option<usize>,
    timer: MovingWindowRenderTimer,
    is_settings_open: bool,
}

type RenderLimits = (usize, usize, Option<usize>, Option<usize>);

impl Deref for Renderer {
    type Target = RendererData;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl PartialEq for Renderer {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl Deref for RendererData {
    type Target = RefCell<RendererMutData>;
    fn deref(&self) -> &Self::Target {
        &self.plugin_data
    }
}

impl Renderer {
    pub fn new(viewer_elem: HtmlElement, _session: Session) -> Renderer {
        let theme_store = ThemeStore::new(&viewer_elem);
        Renderer(Rc::new(RendererData {
            plugin_data: RefCell::new(RendererMutData {
                viewer_elem,
                theme_store,
                metadata: ViewConfigRequirements::default(),
                plugin_store: PluginStore::default(),
                plugins_idx: None,
                timer: MovingWindowRenderTimer::default(),
                is_settings_open: false,
            }),
            _session,
            draw_lock: Default::default(),
            on_plugin_changed: Default::default(),
            on_settings_open_changed: Default::default(),
            on_limits_changed: Default::default(),
            on_theme_config_updated: Default::default(),
        }))
    }

    pub async fn reset(&self) {
        self.0.borrow_mut().plugins_idx = None;
        self.0.borrow().theme_store.reset(None).await;
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
        self.0.borrow_mut().plugin_store.plugins().clone()
    }

    /// Return all plugin names, whether they are active or not.
    pub fn get_all_plugin_names(&self) -> Vec<String> {
        self.0.borrow_mut().plugin_store.plugin_records().clone()
    }

    /// Gets the currently active plugin.  Calling this method before a plugin has
    /// been selected will cause the default (first) plugin to be selected, and doing
    /// so when no plugins have been registered is an error.
    pub fn get_active_plugin(&self) -> Result<JsPerspectiveViewerPlugin, JsValue> {
        if self.0.borrow().plugins_idx.is_none() {
            self.set_plugin(Some(&PLUGIN_REGISTRY.default_plugin_name()))?;
        }

        let idx = self.0.borrow().plugins_idx.unwrap_or(0);
        let result = self.0.borrow_mut().plugin_store.plugins().get(idx).cloned();
        result.ok_or_else(|| JsValue::from("No Plugin"))
    }

    /// Gets a specific `JsPerspectiveViewerPlugin` by name.
    ///
    /// # Arguments
    /// - `name` The plugin name to lookup.
    pub fn get_plugin(&self, name: &str) -> Result<JsPerspectiveViewerPlugin, JsValue> {
        let idx = self.find_plugin_idx(name);
        let idx = idx.ok_or_else(|| JsValue::from(format!("No Plugin `{}`", name)))?;
        let result = self.0.borrow_mut().plugin_store.plugins().get(idx).cloned();
        Ok(result.unwrap())
    }

    pub async fn get_theme_config(
        &self,
    ) -> Result<(Vec<String>, Option<usize>), JsValue> {
        let mut theme_store = self.0.borrow().theme_store.clone();
        let themes = theme_store.get_themes().await?;
        let index = self
            .0
            .borrow()
            .viewer_elem
            .get_attribute("data-perspective-theme")
            .and_then(|x| themes.iter().position(|y| y == &x))
            .or_else(|| if !themes.is_empty() { Some(0) } else { None });

        Ok((themes, index))
    }

    pub fn is_settings_open(&self) -> bool {
        self.0.borrow().is_settings_open
    }

    pub fn set_settings_open(&self, open: Option<bool>) -> Result<bool, JsValue> {
        let open_state = open.unwrap_or_else(|| !self.0.borrow().is_settings_open);
        if self.0.borrow().is_settings_open != open_state {
            self.0.borrow_mut().is_settings_open = open_state;
            self.0
                .borrow()
                .viewer_elem
                .toggle_attribute_with_force("settings", open_state)
                .unwrap();

            self.on_settings_open_changed.emit_all(open_state);
        }

        Ok(open_state)
    }

    /// Returns the currently applied theme, or the default theme if no theme
    /// has been set and themes are detected in the `document`, or `None` if
    /// no themes are available.
    pub async fn get_theme_name(&self) -> Option<String> {
        let (themes, index) = self.get_theme_config().await.ok()?;
        index.and_then(|x| themes.get(x).cloned())
    }

    fn set_theme_attribute(&self, theme: Option<&str>) -> Result<(), JsValue> {
        if let Some(theme) = theme {
            self.0
                .borrow()
                .viewer_elem
                .set_attribute("data-perspective-theme", theme)
        } else {
            self.0
                .borrow()
                .viewer_elem
                .remove_attribute("data-perspective-theme")
        }
    }

    /// Set the theme by name, or `None` for the default theme.
    pub async fn set_theme_name(&self, theme: Option<&str>) -> Result<(), JsValue> {
        let (themes, _) = self.get_theme_config().await?;
        let index = if let Some(theme) = theme {
            self.set_theme_attribute(Some(theme))?;
            themes.iter().position(|x| x == theme)
        } else if !themes.is_empty() {
            self.set_theme_attribute(themes.get(0).map(|x| x.as_str()))?;
            Some(0)
        } else {
            self.set_theme_attribute(None)?;
            None
        };

        self.on_theme_config_updated.emit_all((themes, index));
        Ok(())
    }

    pub async fn reset_theme_names(&self, themes: Option<Vec<String>>) {
        self.0.borrow().theme_store.reset(themes).await
    }

    pub async fn restyle_all(
        &self,
        view: &JsPerspectiveView,
    ) -> Result<JsValue, JsValue> {
        let plugins = self.get_all_plugins();
        let tasks = plugins.iter().map(|plugin| plugin.restyle(view));

        join_all(tasks)
            .await
            .into_iter()
            .collect::<Result<Vec<_>, _>>()
            .map(|_| JsValue::UNDEFINED)
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

    pub async fn with_lock(
        self,
        task: impl Future<Output = Result<JsValue, JsValue>>,
    ) -> Result<JsValue, JsValue> {
        let draw_mutex = self.draw_lock();
        draw_mutex.lock(task).await
    }

    pub async fn resize(&self) -> Result<JsValue, JsValue> {
        let draw_mutex = self.draw_lock();
        let timer = self.render_timer();
        draw_mutex
            .debounce(async {
                set_timeout(timer.get_avg()).await?;
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
        if is_update {
            draw_mutex.debounce(task).await
        } else {
            draw_mutex.lock(task).await
        }
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
        self.0
            .borrow_mut()
            .plugin_store
            .plugins()
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

/// A `RenderableProps` is any struct with `session` and `renderer` fields, as
/// this method is boilerplate but has no other trait to live on currently.  As
/// I'm too lazy to be bothered to implement a `proc-macro` crate, instead this
/// trait can be conveniently derived via the `derive_renderable_props!()` macro
/// on a suitable struct.
pub trait RenderableProps {
    fn session(&self) -> &'_ Session;
    fn renderer(&self) -> &'_ Renderer;

    fn update_and_render(&self, update: crate::config::ViewConfigUpdate) {
        self.session().update_view_config(update);
        let session = self.session().clone();
        let renderer = self.renderer().clone();
        let _ = promisify_ignore_view_delete(async move {
            drop(
                renderer
                    .draw(session.validate().await.create_view())
                    .await?,
            );
            Ok(JsValue::UNDEFINED)
        });
    }

    fn render(&self) {
        let session = self.session().clone();
        let renderer = self.renderer().clone();
        let _ = promisify_ignore_view_delete(async move {
            drop(renderer.draw(async { Ok(&session) }).await?);
            Ok(JsValue::UNDEFINED)
        });
    }

    fn get_viewer_config(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<ViewerConfig, JsValue>>>> {
        let view_config = self.session().get_view_config();
        let js_plugin = self.renderer().get_active_plugin();
        let renderer = self.renderer().clone();
        Box::pin(async move {
            let settings = renderer.is_settings_open();
            let js_plugin = js_plugin?;
            let plugin = js_plugin.name();
            let plugin_config = js_plugin
                .save()
                .into_serde::<serde_json::Value>()
                .into_jserror()?;

            let theme = renderer.get_theme_name().await;
            Ok(ViewerConfig {
                plugin,
                plugin_config,
                settings,
                view_config,
                theme,
            })
        })
    }
}

impl RenderableProps for (Session, Renderer) {
    fn session(&self) -> &'_ Session {
        &self.0
    }

    fn renderer(&self) -> &'_ Renderer {
        &self.1
    }
}

#[macro_export]
macro_rules! derive_renderable_props {
    ($key:ty) => {
        impl crate::renderer::RenderableProps for $key {
            fn session(&self) -> &'_ Session {
                &self.session
            }

            fn renderer(&self) -> &'_ Renderer {
                &self.renderer
            }
        }
    };
}
