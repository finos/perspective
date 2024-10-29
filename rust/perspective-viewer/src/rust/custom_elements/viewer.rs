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

#![allow(non_snake_case)]

use std::cell::RefCell;
use std::rc::Rc;
use std::str::FromStr;

use ::perspective_js::utils::global;
use ::perspective_js::{Table, View};
use futures::future::join;
use js_sys::*;
use perspective_client::config::ViewConfigUpdate;
use perspective_js::JsViewWindow;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use web_sys::*;
use yew::prelude::*;

use crate::components::viewer::{PerspectiveViewer, PerspectiveViewerMsg, PerspectiveViewerProps};
use crate::config::*;
use crate::custom_events::*;
use crate::dragdrop::*;
use crate::js::*;
use crate::model::*;
use crate::presentation::*;
use crate::renderer::*;
use crate::session::Session;
use crate::utils::*;
use crate::*;

/// The `<perspective-viewer>` custom element.
///
/// # JavaScript Examples
///
/// Create a new `<perspective-viewer>`:
///
/// ```javascript
/// const viewer = document.createElement("perspective-viewer");
/// window.body.appendChild(viewer);
/// ```
#[derive(Clone)]
#[wasm_bindgen]
pub struct PerspectiveViewerElement {
    elem: HtmlElement,
    root: Rc<RefCell<Option<AppHandle<PerspectiveViewer>>>>,
    resize_handle: Rc<RefCell<Option<ResizeObserverHandle>>>,
    intersection_handle: Rc<RefCell<Option<IntersectionObserverHandle>>>,
    session: Session,
    renderer: Renderer,
    presentation: Presentation,
    _events: CustomEvents,
    _subscriptions: Rc<Subscription>,
}

derive_model!(Renderer, Session, Presentation for PerspectiveViewerElement);

impl CustomElementMetadata for PerspectiveViewerElement {
    const CUSTOM_ELEMENT_NAME: &'static str = "perspective-viewer";
    const STATICS: &'static [&'static str] = ["registerPlugin", "getExprTKCommands"].as_slice();
}

#[wasm_bindgen]
impl PerspectiveViewerElement {
    #[doc(hidden)]
    #[wasm_bindgen(constructor)]
    pub fn new(elem: web_sys::HtmlElement) -> Self {
        tracing::debug!("Creating <perspective-viewer>");
        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = elem
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        // Application State
        let session = Session::default();
        let renderer = Renderer::new(&elem);
        let presentation = Presentation::new(&elem);
        let events = CustomEvents::new(&elem, &session, &renderer, &presentation);

        // Create Yew App
        let props = yew::props!(PerspectiveViewerProps {
            elem: elem.clone(),
            session: session.clone(),
            renderer: renderer.clone(),
            presentation: presentation.clone(),
            dragdrop: DragDrop::default(),
            custom_events: events.clone(),
            weak_link: WeakScope::default(),
        });

        let root = yew::Renderer::with_root_and_props(shadow_root, props).render();

        // Create callbacks
        let update_sub = session.table_updated.add_listener({
            clone!(renderer, session);
            move |_| {
                clone!(renderer, session);
                ApiFuture::spawn(async move { renderer.update(&session).await })
            }
        });

        let resize_handle = ResizeObserverHandle::new(&elem, &renderer, &root);
        Self {
            elem,
            root: Rc::new(RefCell::new(Some(root))),
            session,
            renderer,
            presentation,
            resize_handle: Rc::new(RefCell::new(Some(resize_handle))),
            intersection_handle: Rc::new(RefCell::new(None)),
            _events: events,
            _subscriptions: Rc::new(update_sub),
        }
    }

    #[doc(hidden)]
    #[wasm_bindgen(js_name = "connectedCallback")]
    pub fn connected_callback(&self) {
        tracing::debug!("Connected <perspective-viewer>");
    }

    /// Loads a [`Table`] (or rather, a Javascript `Promise` which returns a
    /// [`Table`]) in this viewer.
    ///
    /// When [`PerspectiveViewerElement::load`] resolves, the first frame of the
    /// UI + visualization is guaranteed to have been drawn. Awaiting the result
    /// of this method in a `try`/`catch` block will capture any errors
    /// thrown during the loading process, or from the [`Table`] `Promise`
    /// itself.
    ///
    /// A [`Table`] can be created using the
    /// [`@finos/perspective`](https://www.npmjs.com/package/@finos/perspective)
    /// library from NPM (see [`perspective_js`] documentation for details).
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// import perspective from "@finos/perspective";
    ///
    /// const worker = await perspective.worker();
    /// viewer.load(worker.table("x,y\n1,2"));
    /// ```
    pub fn load(&self, table: JsValue) -> ApiFuture<()> {
        tracing::info!("Loading Table");
        let promise = table
            .clone()
            .dyn_into::<js_sys::Promise>()
            .unwrap_or_else(|_| js_sys::Promise::resolve(&table));

        self.session.reset_stats();
        let delete_task = self.session.reset(true);
        let mut config = ViewConfigUpdate {
            columns: Some(self.session.get_view_config().columns.clone()),
            ..ViewConfigUpdate::default()
        };

        self.session
            .set_update_column_defaults(&mut config, &self.renderer.metadata());

        self.session.update_view_config(config);
        clone!(self.renderer, self.session);
        ApiFuture::new(async move {
            let task = async {
                #[wasm_bindgen]
                extern "C" {
                    pub type Model;

                    #[wasm_bindgen(method)]
                    pub fn unsafe_get_model(this: &Model) -> *const Table;
                }

                let jstable = JsFuture::from(promise).await?.unchecked_into::<Model>();
                pub fn unsafe_set_model(ptr: *const Table) -> Table {
                    (unsafe { ptr.as_ref().unwrap() }).clone()
                }

                let table = unsafe_set_model(jstable.unsafe_get_model());
                tracing::debug!(
                    "Successfully loaded {:.0} rows from Table",
                    table.size().await?
                );

                session.set_table(table.get_table().clone()).await?;
                session.validate().await?.create_view().await
            };

            renderer.set_throttle(None);
            let (draw, delete) = join(renderer.draw(task), delete_task).await;
            draw.and(delete)
        })
    }

    /// Delete the internal [`View`] and all associated state, rendering this
    /// `<perspective-viewer>` unusable and freeing all associated resources.
    /// Does not delete the supplied [`Table`] (as this is constructed by the
    /// callee).
    ///
    /// <div class="warning">
    ///
    /// Allowing a `<perspective-viewer>` to be garbage-collected
    /// without calling [`PerspectiveViewerElement::delete`] will leak WASM
    /// memory!
    ///
    /// </div>
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// await viewer.delete();
    /// ```
    pub fn delete(&mut self) -> ApiFuture<()> {
        clone!(self.renderer, self.session, self.root);
        ApiFuture::new(self.renderer.clone().with_lock(async move {
            renderer.delete()?;
            session.delete().await?;
            root.borrow_mut()
                .take()
                .ok_or("Already deleted!")?
                .destroy();

            tracing::info!("Deleted <perspective-viewer>");
            Ok(())
        }))
    }

    /// Get the underlying [`View`] for this viewer.
    ///
    /// Use this method to get promgrammatic access to the [`View`] as currently
    /// configured by the user, for e.g. serializing as an
    /// [Apache Arrow](https://arrow.apache.org/) before passing to another
    /// library.
    ///
    /// The [`View`] returned by this method is owned by the
    /// [`PerspectiveViewerElement`] and may be _invalidated_ by
    /// [`View::delete`] at any time. Plugins which rely on this [`View`] for
    /// their [`HTMLPerspectiveViewerPluginElement::draw`] implementations
    /// should treat this condition as a _cancellation_ by silently aborting on
    /// "View already deleted" errors from method calls.
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// const view = await viewer.getView();
    /// ```
    #[wasm_bindgen]
    pub fn getView(&self) -> ApiFuture<View> {
        let session = self.session.clone();
        ApiFuture::new(async move { Ok(session.get_view().ok_or("No table set")?.into()) })
    }

    /// Get the underlying [`Table`] for this viewer (as passed to
    /// [`PerspectiveViewerElement::load`]).
    ///
    /// # Arguments
    ///
    /// - `wait_for_table` - whether to wait for
    ///   [`PerspectiveViewerElement::load`] to be called, or fail immediately
    ///   if [`PerspectiveViewerElement::load`] has not yet been called.
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// const table = await viewer.getTable();
    /// ```
    #[wasm_bindgen]
    pub fn getTable(&self, wait_for_table: Option<bool>) -> ApiFuture<Table> {
        let session = self.session.clone();
        ApiFuture::new(async move {
            match session.get_table() {
                Some(table) => Ok(table.into()),
                None if !wait_for_table.unwrap_or_default() => Err("No table set".into()),
                None => {
                    session.table_loaded.listen_once().await?;
                    Ok(session.get_table().ok_or("No table set")?.into())
                },
            }
        })
    }

    /// Get render statistics. Some fields of the returned stats object are
    /// relative to the last time [`PerspectiveViewerElement::getRenderStats`]
    /// was called, ergo calling this method resets these fields.
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// const {virtual_fps, actual_fps} = await viewer.getRenderStats();
    /// ```
    #[wasm_bindgen]
    pub fn getRenderStats(&self) -> ApiResult<JsValue> {
        Ok(JsValue::from_serde_ext(
            &self.renderer.render_timer().get_stats(),
        )?)
    }

    /// Flush any pending modifications to this `<perspective-viewer>`.  Since
    /// `<perspective-viewer>`'s API is almost entirely `async`, it may take
    /// some milliseconds before any user-initiated changes to the [`View`]
    /// affects the rendered element.  If you want to make sure all pending
    /// actions have been rendered, call and await [`Self::flush`].
    ///
    /// [`Self::flush`] will resolve immediately if there is no [`Table`] set.
    ///
    /// # JavaScript Examples
    ///
    /// In this example, [`Self::restore`] is called without `await`, but the
    /// eventual render which results from this call can still be awaited by
    /// immediately awaiting [`Self::flush`] instead.
    ///
    /// ```javascript
    /// viewer.restore(config);
    /// await viewer.flush();
    /// ```
    pub fn flush(&self) -> ApiFuture<()> {
        clone!(self.renderer);
        ApiFuture::new(async move {
            request_animation_frame().await;
            renderer.with_lock(async { Ok(()) }).await
        })
    }

    /// Restores this element from a full/partial
    /// [`perspective_js::JsViewConfig`].
    ///
    /// One of the best ways to use [`Self::restore`] is by first configuring
    /// a `<perspective-viewer>` as you wish, then using either the `Debug`
    /// panel or "Copy" -> "config.json" from the toolbar menu to snapshot
    /// the [`Self::restore`] argument as JSON.
    ///
    /// # Arguments
    ///
    /// - `update` - The config to restore to, as returned by [`Self::save`] in
    ///   either "json", "string" or "arraybuffer" format.
    ///
    /// # JavaScript Examples
    ///
    /// Apply a `group_by` to the current [`View`], without modifying/resetting
    /// other fields:
    ///
    /// ```javascript
    /// await viewer.restore({group_by: ["State"]});
    /// ```
    pub fn restore(&self, update: JsValue) -> ApiFuture<()> {
        tracing::info!("Restoring ViewerConfig");
        global::document().blur_active_element();
        let this = self.clone();
        ApiFuture::new(async move {
            let decoded_update = ViewerConfigUpdate::decode(&update)?;
            let root = this.root.clone();
            let settings = decoded_update.settings.clone();
            let result = root
                .borrow()
                .as_ref()
                .into_apierror()?
                .send_message_async(move |x| {
                    PerspectiveViewerMsg::ToggleSettingsComplete(settings, x)
                });

            this.restore_and_render(decoded_update, async move { Ok(result.await?) })
                .await?;
            Ok(())
        })
    }

    /// Save this element to serialized state object, one which can be restored
    /// via the [`Self::restore`] method.
    ///
    /// # Arguments
    ///
    /// - `format` - Supports "json" (default), "arraybuffer" or "string".
    ///
    /// # JavaScript Examples
    ///
    /// Get the current `group_by` setting:
    ///
    /// ```javascript
    /// const {group_by} = await viewer.restore();
    /// ```
    ///
    /// Reset workflow attached to an external button `myResetButton`:
    ///
    /// ```javascript
    /// const token = await viewer.save();
    /// myResetButton.addEventListener("clien", async () => {
    ///     await viewer.restore(token);
    /// });
    /// ```
    pub fn save(&self, format: Option<String>) -> ApiFuture<JsValue> {
        let viewer_config_task = self.get_viewer_config();
        ApiFuture::new(async move {
            let format = format
                .as_ref()
                .map(|x| ViewerConfigEncoding::from_str(x))
                .transpose()?;

            let viewer_config = viewer_config_task.await?;
            viewer_config.encode(&format)
        })
    }

    /// Download this viewer's internal [`View`] data as a `.csv` file.
    ///
    /// # Arguments
    ///
    /// - `flat` - Whether to use the current [`perspective_js::JsViewConfig`]
    ///   to generate this data, or use the default.
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// myDownloadButton.addEventListener("click", async () => {
    ///     await viewer.download();
    /// })
    /// ```
    pub fn download(&self, flat: Option<bool>) -> ApiFuture<()> {
        let session = self.session.clone();
        ApiFuture::new(async move {
            let val = session
                .csv_as_jsvalue(flat.unwrap_or_default(), None)
                .await?
                .as_blob()?;

            // TODO name.as_deref().unwrap_or("untitled.csv")
            download("untitled.csv", &val)
        })
    }

    /// Copy this viewer's `View` or `Table` data as CSV to the system
    /// clipboard.
    ///
    /// # Arguments
    ///
    /// - `flat` - Whether to use the current [`perspective_js::JsViewConfig`]
    ///   to generate this data, or use the default.
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// myDownloadButton.addEventListener("click", async () => {
    ///     await viewer.copy();
    /// })
    /// ```
    pub fn copy(&self, flat: Option<bool>) -> ApiFuture<()> {
        let method = if flat.unwrap_or_default() {
            ExportMethod::CsvAll
        } else {
            ExportMethod::Csv
        };

        let js_task = self.export_method_to_jsvalue(method);
        let copy_task = copy_to_clipboard(js_task, MimeType::TextPlain);
        ApiFuture::new(copy_task)
    }

    /// Reset the viewer's `ViewerConfig` to the default.
    ///
    /// # Arguments
    ///
    /// - `reset_all` - If set, will clear expressions and column settings as
    ///   well.
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// await viewer.reset();
    /// ```
    pub fn reset(&self, reset_all: Option<bool>) -> ApiFuture<()> {
        tracing::info!("Resetting config");
        let root = self.root.clone();
        let all = reset_all.unwrap_or_default();
        ApiFuture::new(async move {
            let task = root
                .borrow()
                .as_ref()
                .ok_or("Already deleted")?
                .send_message_async(move |x| PerspectiveViewerMsg::Reset(all, Some(x)));

            Ok(task.await?)
        })
    }

    /// Recalculate the viewer's dimensions and redraw.
    ///
    /// Use this method to tell `<perspective-viewer>` its dimensions have
    /// changed when auto-size mode has been disabled via [`Self::setAutoSize`].
    /// [`Self::resize`] resolves when the resize-initiated redraw of this
    /// element has completed.
    ///
    /// # Arguments
    ///
    /// - `force` - If [`Self::resize`] is called with `false` or without an
    ///   argument, and _auto-size_ mode is enabled via [`Self::setAutoSize`],
    ///   [`Self::resize`] will log a warning and auto-disable auto-size mode.
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// await viewer.resize(true)
    /// ```
    #[wasm_bindgen]
    pub fn resize(&self, force: Option<bool>) -> ApiFuture<()> {
        if !force.unwrap_or_default() && self.resize_handle.borrow().is_some() {
            let msg: JsValue = "`resize(false)` called, disabling auto-size.  It can be \
                                re-enabled with `setAutoSize(true)`."
                .into();
            web_sys::console::warn_1(&msg);
            *self.resize_handle.borrow_mut() = None;
        }

        let renderer = self.renderer.clone();
        ApiFuture::new(async move { renderer.resize().await })
    }

    /// Sets the auto-size behavior of this component.
    ///
    /// When `true`, this `<perspective-viewer>` will register a
    /// `ResizeObserver` on itself and call [`Self::resize`] whenever its own
    /// dimensions change. However, when embedded in a larger application
    /// context, you may want to call [`Self::resize`] manually to avoid
    /// over-rendering; in this case auto-sizing can be disabled via this
    /// method. Auto-size behavior is enabled by default.
    ///
    /// # Arguments
    ///
    /// - `autosize` - Whether to enable `auto-size` behavior or not.
    ///
    /// # JavaScript Examples
    ///
    /// Disable auto-size behavior:
    ///
    /// ```javascript
    /// viewer.setAutoSize(false);
    /// ```
    #[wasm_bindgen]
    pub fn setAutoSize(&self, autosize: bool) {
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

    /// Sets the auto-pause behavior of this component.
    ///
    /// When `true`, this `<perspective-viewer>` will register an
    /// `IntersectionObserver` on itself and subsequently skip rendering
    /// whenever its viewport visibility changes. Auto-pause is enabled by
    /// default.
    ///
    /// # Arguments
    ///
    /// - `autopause` Whether to enable `auto-pause` behavior or not.
    ///
    /// # JavaScript Examples
    ///
    /// Disable auto-size behavior:
    ///
    /// ```javascript
    /// viewer.setAutoPause(false);
    /// ```
    #[wasm_bindgen]
    pub fn setAutoPause(&self, autopause: bool) {
        if autopause {
            let handle = Some(IntersectionObserverHandle::new(
                &self.elem,
                &self.session,
                &self.renderer,
            ));
            *self.intersection_handle.borrow_mut() = handle;
        } else {
            *self.intersection_handle.borrow_mut() = None;
        }
    }

    /// Return a [`perspective_js::JsViewWindow`] for the currently selected
    /// region.
    #[wasm_bindgen]
    pub fn getSelection(&self) -> Option<JsViewWindow> {
        self.renderer.get_selection().map(|x| x.into())
    }

    /// Set the selection [`perspective_js::JsViewWindow`] for this element.
    #[wasm_bindgen]
    pub fn setSelection(&self, window: Option<JsViewWindow>) -> ApiResult<()> {
        let window = window.map(|x| x.into_serde_ext()).transpose()?;
        self.renderer.set_selection(window);
        Ok(())
    }

    /// Get this viewer's edit port for the currently loaded [`Table`] (see
    /// [`Table::update`] for details on ports).
    #[wasm_bindgen]
    pub fn getEditPort(&self) -> Result<f64, JsValue> {
        self.session
            .metadata()
            .get_edit_port()
            .ok_or_else(|| "No `Table` loaded".into())
    }

    /// Restyle all plugins from current document.
    ///
    /// <div class="warning">
    ///
    /// [`Self::restyleElement`] _must_ be called for many runtime changes to
    /// CSS properties to be reflected in an already-rendered
    /// `<perspective-viewer>`.
    ///
    /// </div>
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// viewer.style = "--icon--color: red";
    /// await viewer.restyleElement();
    /// ```
    #[wasm_bindgen]
    pub fn restyleElement(&self) -> ApiFuture<JsValue> {
        clone!(self.renderer, self.session);
        ApiFuture::new(async move {
            let view = session.get_view().into_apierror()?;
            renderer.restyle_all(&view).await
        })
    }

    /// Set the available theme names available in the status bar UI.
    ///
    /// Calling [`Self::resetThemes`] may cause the current theme to switch,
    /// if e.g. the new theme set does not contain the current theme.
    ///
    /// # JavaScript Examples
    ///
    /// Restrict `<perspective-viewer>` theme options to _only_ default light
    /// and dark themes, regardless of what is auto-detected from the page's
    /// CSS:
    ///
    /// ```javascript
    /// viewer.resetThemes(["Pro Light", "Pro Dark"])
    /// ```
    #[wasm_bindgen]
    pub fn resetThemes(&self, themes: Option<Box<[JsValue]>>) -> ApiFuture<JsValue> {
        clone!(self.renderer, self.session, self.presentation);
        ApiFuture::new(async move {
            let themes: Option<Vec<String>> = themes
                .unwrap_or_default()
                .iter()
                .map(|x| x.as_string())
                .collect();

            let theme_name = presentation.get_selected_theme_name().await;
            presentation.reset_available_themes(themes).await;
            let reset_theme = presentation
                .get_available_themes()
                .await?
                .iter()
                .find(|y| theme_name.as_ref() == Some(y))
                .cloned();

            presentation.set_theme_name(reset_theme.as_deref()).await?;
            if let Some(view) = session.get_view() {
                renderer.restyle_all(&view).await
            } else {
                Ok(JsValue::UNDEFINED)
            }
        })
    }

    /// Determines the render throttling behavior. Can be an integer, for
    /// millisecond window to throttle render event; or, if `None`, adaptive
    /// throttling will be calculated from the measured render time of the
    /// last 5 frames.
    ///
    /// # Arguments
    ///
    /// - `throttle` - The throttle rate in milliseconds (f64), or `None` for
    ///   adaptive throttling.
    ///
    /// # JavaScript Examples
    ///
    /// Only draws at most 1 frame/sec:
    ///
    /// ```rust
    /// viewer.setThrottle(1000);
    /// ```
    #[wasm_bindgen]
    pub fn setThrottle(&self, val: Option<f64>) {
        self.renderer.set_throttle(val);
    }

    /// Toggle (or force) the config panel open/closed.
    ///
    /// # Arguments
    ///
    /// - `force` - Force the state of the panel open or closed, or `None` to
    ///   toggle.
    ///
    /// # JavaScript Examples
    ///
    /// ```javascript
    /// await viewer.toggleConfig();
    /// ```
    #[wasm_bindgen]
    pub fn toggleConfig(&self, force: Option<bool>) -> ApiFuture<JsValue> {
        global::document().blur_active_element();
        let root = self.root.clone();
        ApiFuture::new(async move {
            let force = force.map(SettingsUpdate::Update);
            let task = root
                .borrow()
                .as_ref()
                .into_apierror()?
                .send_message_async(|x| PerspectiveViewerMsg::ToggleSettingsInit(force, Some(x)));

            task.await.map_err(|_| JsValue::from("Cancelled"))?
        })
    }

    /// Get an `Array` of all of the plugin custom elements registered for this
    /// element. This may not include plugins which called
    /// [`registerPlugin`] after the host has rendered for the first time.
    #[wasm_bindgen]
    pub fn getAllPlugins(&self) -> Array {
        self.renderer.get_all_plugins().iter().collect::<Array>()
    }

    /// Gets a plugin Custom Element with the `name` field, or get the active
    /// plugin if no `name` is provided.
    ///
    /// # Arguments
    ///
    /// - `name` - The `name` property of a perspective plugin Custom Element,
    ///   or `None` for the active plugin's Custom Element.
    #[wasm_bindgen]
    pub fn getPlugin(&self, name: Option<String>) -> ApiResult<JsPerspectiveViewerPlugin> {
        match name {
            None => self.renderer.get_active_plugin(),
            Some(name) => self.renderer.get_plugin(&name),
        }
    }

    #[doc(hidden)]
    #[allow(clippy::use_self)]
    #[wasm_bindgen]
    pub fn unsafe_get_model(&self) -> *const PerspectiveViewerElement {
        std::ptr::addr_of!(*self)
    }

    /// Asynchronously opens the column settings for a specific column.
    /// When finished, the `<perspective-viewer>` element will emit a
    /// "perspective-toggle-column-settings" CustomEvent.
    /// The event's details property has two fields: `{open: bool, column_name?:
    /// string}`. The CustomEvent is also fired whenever the user toggles the
    /// sidebar manually.
    #[wasm_bindgen]
    pub fn toggleColumnSettings(&self, column_name: String) -> ApiFuture<()> {
        clone!(self.session, self.root);
        ApiFuture::new(async move {
            let locator = session.metadata().get_column_locator(Some(column_name));
            let task = root
                .borrow()
                .as_ref()
                .into_apierror()?
                .send_message_async(|sender| PerspectiveViewerMsg::OpenColumnSettings {
                    locator,
                    sender: Some(sender),
                    toggle: true,
                });
            task.await.map_err(|_| ApiError::from("Cancelled"))
        })
    }

    /// Force open the settings for a particular column. Pass `null` to close
    /// the column settings panel. See [`Self::toggleColumnSettings`] for more.
    #[wasm_bindgen]
    pub fn openColumnSettings(
        &self,
        column_name: Option<String>,
        toggle: Option<bool>,
    ) -> ApiFuture<()> {
        clone!(self.session, self.root);
        ApiFuture::new(async move {
            let locator = session.metadata().get_column_locator(column_name);
            let task = root
                .borrow()
                .as_ref()
                .into_apierror()?
                .send_message_async(|sender| PerspectiveViewerMsg::OpenColumnSettings {
                    locator,
                    sender: Some(sender),
                    toggle: toggle.unwrap_or_default(),
                });
            task.await.map_err(|_| ApiError::from("Cancelled"))
        })
    }
}
