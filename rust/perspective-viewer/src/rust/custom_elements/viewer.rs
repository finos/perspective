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
use crate::dragdrop::*;
use crate::js::perspective::*;
use crate::js::plugin::JsPerspectiveViewerPlugin;
use crate::renderer::*;
use crate::session::Session;
use crate::utils::*;
use crate::*;

use flate2::read::ZlibDecoder;
use flate2::write::ZlibEncoder;
use flate2::Compression;
use futures::channel::oneshot::*;
use futures::future::join_all;
use js_intern::*;
use js_sys::*;
use std::cell::RefCell;
use std::io::Read;
use std::io::Write;
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
pub struct PerspectiveViewerElement {
    elem: HtmlElement,
    root: Rc<AppHandle<PerspectiveViewer>>,
    session: Session,
    renderer: Renderer,
    subscriptions: Rc<[Subscription; 3]>,
    expression_editor: Rc<RefCell<Option<ExpressionEditorElement>>>,
    config: Rc<RefCell<ViewerConfig>>,
}

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
        let config = Rc::new(RefCell::new(ViewerConfig::new(&renderer)));

        // Create Yew App
        let props = PerspectiveViewerProps {
            elem: elem.clone(),
            session: session.clone(),
            renderer: renderer.clone(),
            dragdrop: DragDrop::default(),
            weak_link: WeakComponentLink::default(),
        };

        let root = Rc::new(yew::start_app_with_props_in_element(shadow_root, props));

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

        let plugin_sub = renderer.on_plugin_changed.add_listener({
            clone!(elem);
            move |plugin| dispatch_plugin_changed(&elem, &plugin)
        });

        let limit_sub = {
            let callback = root.callback(|x| Msg::RenderLimits(Some(x)));
            renderer.on_limits_changed.add_listener(callback)
        };

        PerspectiveViewerElement {
            elem,
            root,
            session,
            renderer,
            expression_editor: Rc::new(RefCell::new(None)),
            subscriptions: Rc::new([plugin_sub, update_sub, limit_sub]),
            config,
        }
    }

    pub fn connected_callback(&self) {}

    /// Loads a promise to a `JsPerspectiveTable` in this viewer.
    pub fn js_load(&self, table: js_sys::Promise) -> js_sys::Promise {
        assert!(!table.is_undefined());
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

    /// Delete the `View` and all associated state, returning this viewer to its
    /// initialization state.  Does not delete the supplied `Table` (as this is
    /// constructed by the callee).
    pub fn js_delete(&self) -> Result<bool, JsValue> {
        self.renderer.delete()?;
        Ok(self.session.delete())
    }

    /// Get the underlying `Table` for this viewer.
    pub fn js_get_table(&self) -> js_sys::Promise {
        let session = self.session.clone();
        future_to_promise(async move {
            match session.js_get_table() {
                Some(table) => Ok(table),
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
                mut view_config,
            } = if update.is_string() {
                let js_str = update.as_string().into_jserror()?;
                let bytes = base64::decode(js_str).into_jserror()?;
                let mut decoder = ZlibDecoder::new(&*bytes);
                let mut decoded = vec![];
                decoder.read_to_end(&mut decoded).into_jserror()?;
                rmp_serde::from_slice(&decoded).into_jserror()?
            } else if update.is_instance_of::<js_sys::ArrayBuffer>() {
                let uint8array = js_sys::Uint8Array::new(&update);
                let mut slice = vec![0; uint8array.length() as usize];
                uint8array.copy_to(&mut slice[..]);
                rmp_serde::from_slice(&slice).into_jserror()?
            } else {
                update.into_serde().into_jserror()?
            };

            renderer.update_plugin(plugin)?;
            session.set_update_column_defaults(&mut view_config, &renderer.metadata());
            session.update_view_config(view_config);
            let settings = Some(settings.clone());
            let draw_task = renderer.draw(async {
                let plugin = renderer.get_active_plugin()?;
                if let Some(plugin_config) = &plugin_config {
                    let js_config = JsValue::from_serde(plugin_config);
                    plugin.restore(&js_config.into_jserror()?);
                }

                root.send_message(Msg::ApplySettings(settings));
                session.validate().await.create_view().await
            });

            drop(draw_task.await?);
            Ok(session.get_view().as_ref().unwrap().as_jsvalue())
        })
    }

    /// Save this element to serialized state object, one which can be restored via
    /// the `.restore()` method.
    ///
    /// # Arguments
    /// - `format` Supports "json" (default), "arraybuffer" or "string".
    pub fn js_save(&self, format: Option<String>) -> js_sys::Promise {
        let (sender, receiver) = channel::<bool>();
        let msg = Msg::QuerySettings(sender);
        self.root.send_message(msg);
        let view_config = self.session.get_view_config();
        let js_plugin = self.renderer.get_active_plugin();
        future_to_promise(async move {
            let settings = receiver.await.into_jserror()?;
            let js_plugin = js_plugin?;
            let plugin = js_plugin.name();
            let plugin_config = js_plugin
                .save()
                .into_serde::<serde_json::Value>()
                .into_jserror()?;

            let viewer_config = ViewerConfig {
                plugin,
                plugin_config,
                settings,
                view_config,
            };

            match format.as_deref() {
                Some("string") => {
                    let mut encoder =
                        ZlibEncoder::new(Vec::new(), Compression::default());
                    let bytes = rmp_serde::to_vec(&viewer_config).into_jserror()?;
                    encoder.write_all(&bytes).into_jserror()?;
                    let encoded = encoder.finish().into_jserror()?;
                    Ok(JsValue::from(base64::encode(encoded)))
                }
                Some("arraybuffer") => {
                    let array = js_sys::Uint8Array::from(
                        &rmp_serde::to_vec(&viewer_config).unwrap()[..],
                    );
                    let start = array.byte_offset();
                    let len = array.byte_length();
                    Ok(array
                        .buffer()
                        .slice_with_end(start, start + len)
                        .unchecked_into())
                }
                None | Some("json") => Ok(JsValue::from_serde(&viewer_config).unwrap()),
                Some(x) => Err(format!("Unknown serialization format `{}`", x).into()),
            }
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
    pub fn js_reset(&self) -> js_sys::Promise {
        let (sender, receiver) = channel::<()>();
        self.root.send_message(Msg::Reset(Some(sender)));
        promisify_ignore_view_delete(async move {
            receiver.await.map_err(|_| JsValue::from("Cancelled"))?;
            Ok(JsValue::UNDEFINED)
        })
    }

    /// Recalculate the viewer's dimensions and redraw.
    pub fn js_resize(&self) -> js_sys::Promise {
        let renderer = self.renderer.clone();
        promisify_ignore_view_delete(async move { renderer.resize().await })
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
            let plugins = renderer.get_all_plugins();
            let tasks = plugins.iter().map(|plugin| {
                let view = &view;
                async move { plugin.restyle(view).await }
            });

            join_all(tasks)
                .await
                .into_iter()
                .collect::<Result<Vec<_>, _>>()
                .map(|_| JsValue::UNDEFINED)
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
        let msg = Msg::ToggleSettings(force.map(SettingsUpdate::Update), Some(sender));
        self.root.send_message(msg);
        promisify_ignore_view_delete(async move {
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

fn dispatch_plugin_changed(elem: &HtmlElement, plugin: &JsPerspectiveViewerPlugin) {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(plugin);
    let event = web_sys::CustomEvent::new_with_event_init_dict(
        "-perspective-plugin-changed",
        &event_init,
    );

    elem.dispatch_event(&event.unwrap()).unwrap();
}
