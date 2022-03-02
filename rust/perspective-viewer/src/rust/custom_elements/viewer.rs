////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::viewer::*;
use crate::config::*;
use crate::custom_elements::expression_editor::ExpressionEditorElement;
use crate::custom_events::*;
use crate::dragdrop::*;
use crate::js::perspective::*;
use crate::js::plugin::JsPerspectiveViewerPlugin;
use crate::js::resize_observer::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::Session;
use crate::utils::*;
use crate::*;

use futures::channel::oneshot::*;
use js_intern::*;
use js_sys::*;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use wasm_bindgen_futures::JsFuture;
use web_sys::*;
use yew::prelude::*;

struct ResizeObserverHandle {
    elem: HtmlElement,
    observer: ResizeObserver,
    _callback: Closure<dyn FnMut(js_sys::Array)>,
}

impl ResizeObserverHandle {
    fn new(
        elem: &HtmlElement,
        renderer: &Renderer,
        root: &AppHandle<PerspectiveViewer>,
    ) -> ResizeObserverHandle {
        let on_resize = root.callback(|()| Msg::Resize);
        let mut state = ResizeObserverState {
            elem: elem.clone(),
            renderer: renderer.clone(),
            width: elem.offset_width(),
            height: elem.offset_height(),
            on_resize,
        };

        let _callback = (move |xs| state.on_resize(&xs)).into_closure_mut();
        let func = _callback.as_ref().unchecked_ref::<js_sys::Function>();
        let observer = ResizeObserver::new(func);
        observer.observe(elem);
        ResizeObserverHandle {
            elem: elem.clone(),
            _callback,
            observer,
        }
    }
}

impl Drop for ResizeObserverHandle {
    fn drop(&mut self) {
        self.observer.unobserve(&self.elem);
    }
}

struct ResizeObserverState {
    elem: HtmlElement,
    renderer: Renderer,
    width: i32,
    height: i32,
    on_resize: Callback<()>,
}

impl ResizeObserverState {
    fn on_resize(&mut self, entries: &js_sys::Array) {
        let is_visible = self
            .elem
            .offset_parent()
            .map(|x| !x.is_null())
            .unwrap_or(false);

        for y in entries.iter() {
            let entry: ResizeObserverEntry = y.unchecked_into();
            let content = entry.content_rect();
            let content_width = content.width().floor() as i32;
            let content_height = content.height().floor() as i32;
            let resized = self.width != content_width || self.height != content_height;
            if resized && is_visible {
                let renderer = self.renderer.clone();
                let callback = self.on_resize.clone();
                let _ = promisify_ignore_view_delete(async move {
                    renderer.resize().await?;
                    callback.emit(());
                    Ok(JsValue::UNDEFINED)
                });
            }

            self.width = content_width;
            self.height = content_height;
        }
    }
}

/// A `customElements` external API.
#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveViewerElement {
    elem: HtmlElement,
    root: Rc<RefCell<Option<AppHandle<PerspectiveViewer>>>>,
    session: Session,
    renderer: Renderer,
    events: CustomEvents,
    subscriptions: Rc<[Subscription; 2]>,
    expression_editor: Rc<RefCell<Option<ExpressionEditorElement>>>,
    resize_handle: Rc<RefCell<Option<ResizeObserverHandle>>>,
}

derive_session_renderer_model!(PerspectiveViewerElement);

#[wasm_bindgen]
impl PerspectiveViewerElement {
    #[wasm_bindgen(constructor)]
    pub fn new(elem: web_sys::HtmlElement) -> PerspectiveViewerElement {
        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = elem
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        // Application State
        let session = Session::default();
        let renderer = Renderer::new(elem.clone(), session.clone());

        // Theme
        let _ = promisify_ignore_view_delete({
            let elem = elem.clone();
            let renderer = renderer.clone();
            async move {
                if let Some(theme) = renderer.get_theme_name().await {
                    elem.set_attribute("theme", &theme).unwrap();
                }

                Ok(JsValue::UNDEFINED)
            }
        });

        // Create Yew App
        let props = PerspectiveViewerProps {
            elem: elem.clone(),
            session: session.clone(),
            renderer: renderer.clone(),
            dragdrop: DragDrop::default(),
            weak_link: WeakScope::default(),
        };

        let root = yew::start_app_with_props_in_element(shadow_root, props);

        // Create callbacks
        let update_sub = session.on_update.add_listener({
            clone!(renderer, session);
            move |_| {
                clone!(renderer, session);
                drop(promisify_ignore_view_delete(async move {
                    renderer.update(&session).await
                }))
            }
        });

        let limit_sub = {
            let callback = root.callback(|x| Msg::RenderLimits(Some(x)));
            renderer.on_limits_changed.add_listener(callback)
        };

        let events = CustomEvents::new(&elem, &session, &renderer);
        let resize_handle = ResizeObserverHandle::new(&elem, &renderer, &root);
        PerspectiveViewerElement {
            elem,
            root: Rc::new(RefCell::new(Some(root))),
            session,
            renderer,
            expression_editor: Rc::new(RefCell::new(None)),
            events,
            subscriptions: Rc::new([update_sub, limit_sub]),
            resize_handle: Rc::new(RefCell::new(Some(resize_handle))),
        }
    }

    pub fn connected_callback(&self) {}

    /// Loads a promise to a `JsPerspectiveTable` in this viewer.
    pub fn js_load(&self, table: JsValue) -> js_sys::Promise {
        assert!(!table.is_undefined());
        let table = if let Ok(table) = table.clone().dyn_into::<js_sys::Promise>() {
            table
        } else {
            js_sys::Promise::resolve(&table)
        };

        let mut config = ViewConfigUpdate::default();
        self.session
            .set_update_column_defaults(&mut config, &self.renderer.metadata());

        self.session.update_view_config(config);

        let session = self.session.clone();
        let renderer = self.renderer.clone();
        future_to_promise(async move {
            renderer
                .draw(async {
                    let promise = JsFuture::from(table).await?;
                    let table: JsPerspectiveTable = promise.unchecked_into();
                    session.reset_stats();
                    session.set_table(table).await?;
                    session.validate().await.create_view().await
                })
                .await
        })
    }

    /// Delete the `View` and all associated state, rendering this
    /// `<perspective-viewer>` unusable and freeing all associated resources.
    /// Does not delete the supplied `Table` (as this is constructed by the
    /// callee).  Allowing a `<perspective-viewer>` to be garbage-collected
    /// without calling `delete()` will leak WASM memory.
    pub fn js_delete(&mut self) -> js_sys::Promise {
        let renderer = self.renderer.clone();
        let session = self.session.clone();
        let root = self.root.clone();
        future_to_promise(self.renderer.clone().with_lock(async move {
            renderer.delete()?;
            let result = session.delete();
            root.borrow_mut()
                .take()
                .ok_or("Already deleted!")?
                .destroy();
            Ok(JsValue::from(result))
        }))
    }

    /// Get the underlying `View` for thie viewer.
    pub fn js_get_view(&self) -> js_sys::Promise {
        let session = self.session.clone();
        future_to_promise(async move {
            session
                .js_get_view()
                .ok_or_else(|| JsValue::from("No table set"))
        })
    }

    /// Get the underlying `Table` for this viewer.
    ///
    /// # Arguments
    /// - `wait_for_table` whether to wait for `load()` to be called, or fail
    ///   immediately if `load()` has not yet been called.  
    pub fn js_get_table(&self, wait_for_table: bool) -> js_sys::Promise {
        let session = self.session.clone();
        future_to_promise(async move {
            match session.js_get_table() {
                Some(table) => Ok(table),
                None if !wait_for_table => Err(JsValue::from("No table set")),
                None => {
                    let (sender, receiver) = channel::<()>();
                    let sender = RefCell::new(Some(sender));
                    let _sub = session.on_table_loaded.add_listener(move |x| {
                        sender.borrow_mut().take().unwrap().send(x).unwrap()
                    });

                    receiver.await.into_jserror()?;
                    session.js_get_table().ok_or_else(|| "No table set".into())
                }
            }
        })
    }

    pub fn js_flush(&self) -> js_sys::Promise {
        let session = self.session.clone();
        let renderer = self.renderer.clone();
        promisify_ignore_view_delete(async move {
            if session.js_get_table().is_none() {
                let (sender, receiver) = channel::<()>();
                let sender = RefCell::new(Some(sender));
                let _sub = session.on_table_loaded.add_listener(move |x| {
                    sender.borrow_mut().take().unwrap().send(x).unwrap()
                });

                receiver.await.into_jserror()?;
                let _ = session
                    .js_get_table()
                    .ok_or_else(|| js_intern!("No table set"))?;
            };

            renderer.draw(async { Ok(&session) }).await
        })
    }

    /// Restores this element from a full/partial `JsPerspectiveViewConfig`.
    ///
    /// # Arguments
    /// - `update` The config to restore to, as returned by `.save()` in either
    ///   "json", "string" or "arraybuffer" format.
    pub fn js_restore(&self, update: JsValue) -> js_sys::Promise {
        let session = self.session.clone();
        let renderer = self.renderer.clone();
        let root = self.root.clone();
        promisify_ignore_view_delete(async move {
            let ViewerConfigUpdate {
                plugin,
                plugin_config,
                settings,
                theme,
                mut view_config,
            } = ViewerConfigUpdate::decode(&update)?;

            let needs_restyle = match theme {
                OptionalUpdate::SetDefault => {
                    let current_name = renderer.get_theme_name().await;
                    if None != current_name {
                        renderer.set_theme_name(None).await?;
                        true
                    } else {
                        false
                    }
                }
                OptionalUpdate::Update(x) => {
                    let current_name = renderer.get_theme_name().await;
                    if current_name.is_some() && current_name.as_ref().unwrap() != &x {
                        renderer.set_theme_name(Some(&x)).await?;
                        true
                    } else {
                        false
                    }
                }
                _ => false,
            };

            let plugin_changed = renderer.update_plugin(plugin)?;
            if plugin_changed {
                session
                    .set_update_column_defaults(&mut view_config, &renderer.metadata());
            }

            session.update_view_config(view_config);
            let settings = settings.clone();
            let draw_task = renderer.draw(async {
                let (sender, receiver) = channel::<()>();
                root.borrow()
                    .as_ref()
                    .ok_or("Already deleted!")?
                    .send_message(Msg::ToggleSettingsComplete(settings, sender));

                let plugin = renderer.get_active_plugin()?;
                if let Some(plugin_config) = &plugin_config {
                    let js_config = JsValue::from_serde(plugin_config);
                    plugin.restore(&js_config.into_jserror()?);
                }

                let result = session.validate().await.create_view().await;
                receiver.await.into_jserror()?;
                result
            });

            drop(draw_task.await?);

            // TODO this should be part of the API for `draw()` above, such that
            // the plugin need not render twice when a theme is provided.
            if needs_restyle {
                let view = session.get_view().into_jserror()?;
                renderer.restyle_all(&view).await?;
            }

            Ok(JsValue::UNDEFINED)
        })
    }

    /// Save this element to serialized state object, one which can be restored via
    /// the `.restore()` method.
    ///
    /// # Arguments
    /// - `format` Supports "json" (default), "arraybuffer" or "string".
    pub fn js_save(&self, format: JsValue) -> js_sys::Promise {
        let viewer_config_task = self.get_viewer_config();
        future_to_promise(async move {
            let format = JsValue::into_serde::<Option<ViewerConfigEncoding>>(&format)
                .into_jserror()?;
            let viewer_config = viewer_config_task.await?;
            viewer_config.encode(&format)
        })
    }

    /// Download this viewer's `View` or `Table` data as a `.csv` file.
    ///
    /// # Arguments
    /// - `flat` Whether to use the current `ViewConfig` to generate this data, or use
    ///   the default.
    pub fn js_download(&self, flat: bool) -> js_sys::Promise {
        let session = self.session.clone();
        future_to_promise(async move {
            session.download_as_csv(flat).await?;
            Ok(JsValue::UNDEFINED)
        })
    }

    /// Copy this viewer's `View` or `Table` data as CSV to the system clipboard.
    ///
    /// # Arguments
    /// - `flat` Whether to use the current `ViewConfig` to generate this data, or use
    ///   the default.
    pub fn js_copy(&self, flat: bool) -> js_sys::Promise {
        let session = self.session.clone();
        future_to_promise(async move {
            session.copy_to_clipboard(flat).await?;
            Ok(JsValue::UNDEFINED)
        })
    }

    /// Reset the viewer's `ViewerConfig` to the default.
    ///
    /// # Arguments
    /// - `all` Whether to clear `expressions` also.
    pub fn js_reset(&self, reset_expressions: JsValue) -> js_sys::Promise {
        let (sender, receiver) = channel::<()>();
        let root = self.root.clone();
        let all = reset_expressions.as_bool().unwrap_or_default();
        promisify_ignore_view_delete(async move {
            root.borrow()
                .as_ref()
                .ok_or("Already deleted!")?
                .send_message(Msg::Reset(all, Some(sender)));
            receiver.await.map_err(|_| JsValue::from("Cancelled"))?;
            Ok(JsValue::UNDEFINED)
        })
    }

    /// Recalculate the viewer's dimensions and redraw.
    pub fn js_resize(&self, force: bool) -> js_sys::Promise {
        if !force && self.resize_handle.borrow().is_some() {
            let msg: JsValue = "`notifyResize(false)` called, disabling auto-size.  It can be re-enabled with `setAutoSize(true)`.".into();
            web_sys::console::warn_1(&msg);
            *self.resize_handle.borrow_mut() = None;
        }

        let renderer = self.renderer.clone();
        promisify_ignore_view_delete(async move { renderer.resize().await })
    }

    /// Sets the auto-size behavior of this component.  When `true`, this
    /// `<perspective-viewer>` will register a `ResizeObserver` on itself and
    /// call `resize()` whenever its own dimensions change.
    ///
    /// # Arguments
    /// - `autosize` Whether to register a `ResizeObserver` on this element or
    ///   not.
    pub fn js_set_auto_size(&mut self, autosize: bool) {
        if autosize {
            let handle = Some(ResizeObserverHandle::new(
                &self.elem,
                &self.renderer,
                self.root.borrow().as_ref().unwrap(),
            ));
            *self.resize_handle.borrow_mut() = handle;
        } else {
            *self.resize_handle.borrow_mut() = None;
        }
    }

    /// Get this viewer's edit port for the currently loaded `Table`.
    pub fn js_get_edit_port(&self) -> Result<f64, JsValue> {
        self.session
            .metadata()
            .get_edit_port()
            .ok_or_else(|| "No `Table` loaded".into())
    }

    /// Restyle all plugins from current document.
    pub fn js_restyle_element(&self) -> js_sys::Promise {
        let renderer = self.renderer.clone();
        let session = self.session.clone();
        promisify_ignore_view_delete(async move {
            let view = session.get_view().into_jserror()?;
            renderer.restyle_all(&view).await
        })
    }

    /// Set the available theme names available in the status bar UI.
    pub fn js_reset_themes(&self, themes: JsValue) -> js_sys::Promise {
        let renderer = self.renderer.clone();
        let session = self.session.clone();
        promisify_ignore_view_delete(async move {
            let themes: Option<Vec<String>> = themes.into_serde().into_jserror()?;
            let theme = renderer.get_theme_name().await;
            renderer.reset_theme_names(themes).await;
            let reset_theme = renderer
                .get_theme_config()
                .await?
                .0
                .iter()
                .find(|y| theme.as_ref() == Some(y))
                .cloned();

            renderer.set_theme_name(reset_theme.as_deref()).await?;
            let view = session.get_view().into_jserror()?;
            renderer.restyle_all(&view).await
        })
    }

    /// Determines the render throttling behavior. Can be an integer, for
    /// millisecond window to throttle render event; or, if `None`, adaptive throttling
    /// will be calculated from the measured render time of the last 5 frames.
    ///
    /// # Examples
    /// // Only draws at most 1 frame/sec.
    /// viewer.js_set_throttle(Some(1000_f64));
    ///
    /// # Arguments
    /// - `throttle` The throttle rate - milliseconds (f64), or `None` for adaptive
    ///   throttling.
    pub fn js_set_throttle(&mut self, val: Option<f64>) {
        self.renderer.set_throttle(val);
    }

    /// Toggle (or force) the config panel open/closed.
    ///
    /// # Arguments
    /// - `force` Force the state of the panel open or closed, or `None` to toggle.
    pub fn js_toggle_config(&self, force: Option<bool>) -> js_sys::Promise {
        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        let msg =
            Msg::ToggleSettingsInit(force.map(SettingsUpdate::Update), Some(sender));
        let root = self.root.clone();
        promisify_ignore_view_delete(async move {
            root.borrow()
                .as_ref()
                .expect("Already deleted!")
                .send_message(msg);
            receiver.await.map_err(|_| JsValue::from("Cancelled"))?
        })
    }

    /// Get an `Array` of all of the plugin custom elements registered for this element.
    /// This may not include plugins which called `registerPlugin()` after the host has
    /// rendered for the first time.
    pub fn js_get_all_plugins(&self) -> Array {
        self.renderer.get_all_plugins().iter().collect::<Array>()
    }

    /// Gets a plugin Custom Element with the `name` field, or get the active plugin
    /// if no `name` is provided.
    ///
    /// # Arguments
    /// - `name` The `name` property of a perspective plugin Custom Element, or `None`
    ///   for the active plugin's Custom Element.
    pub fn js_get_plugin(
        &self,
        name: Option<String>,
    ) -> Result<JsPerspectiveViewerPlugin, JsValue> {
        match name {
            None => self.renderer.get_active_plugin(),
            Some(name) => self.renderer.get_plugin(&name),
        }
    }
}
