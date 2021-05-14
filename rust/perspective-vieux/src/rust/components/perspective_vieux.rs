////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::split_panel::SplitPanel;
use crate::components::status_bar::StatusBar;
use crate::session::{Session, TableStats};
use crate::utils::perspective::PerspectiveJsView;
use crate::utils::WeakComponentLink;

use futures::channel::oneshot::*;
use js_sys::*;
use wasm_bindgen::{prelude::*, JsCast};
use wasm_bindgen_futures::{future_to_promise, JsFuture};
use yew::prelude::*;

pub static CSS: &str = include_str!("../../../dist/css/perspective-vieux.css");

#[derive(Properties, Clone)]
pub struct PerspectiveVieuxProps {
    pub elem: web_sys::HtmlElement,
    pub panels: (web_sys::HtmlElement, web_sys::HtmlElement),

    #[prop_or_default]
    pub weak_link: WeakComponentLink<PerspectiveVieux>,
}

pub enum Msg {
    LoadTable(Promise, Sender<Result<JsValue, JsValue>>),
    Reset,
    Export(bool),
    Copy(bool),
    ViewLoaded(PerspectiveJsView),
    ViewDeleted,
    TableStats(TableStats),
    ToggleConfig(Option<bool>, Option<Sender<Result<JsValue, JsValue>>>),
    ConfigToggled(bool, Option<Sender<Result<JsValue, JsValue>>>),
}

pub struct PerspectiveVieux {
    link: ComponentLink<Self>,
    props: PerspectiveVieuxProps,
    stats: Option<TableStats>,
    session: Session,
    config_open: bool,
    on_rendered: Option<Sender<Result<JsValue, JsValue>>>,
}

impl Component for PerspectiveVieux {
    type Message = Msg;
    type Properties = PerspectiveVieuxProps;
    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        *props.weak_link.borrow_mut() = Some(link.clone());
        Self {
            props,
            link: link.clone(),
            stats: None,
            session: Session::new(link.callback(Msg::TableStats)),
            config_open: false,
            on_rendered: None,
        }
    }

    /// TODO would like a cleaner abstraction for `Msg` which contains a Promise
    /// resolving `Sender`.  Also, likewise for on_rendered, which will silently
    /// drop any async-overlap bugs in this function.
    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::LoadTable(table, sender) => {
                self.set_session_table(sender, table);
                false
            }
            Msg::Reset => {
                let event = web_sys::CustomEvent::new("perspective-vieux-reset");
                self.props.elem.dispatch_event(&event.unwrap()).unwrap();
                false
            }
            Msg::Export(flat) => {
                self.session.download_as_csv(flat);
                false
            }
            Msg::Copy(flat) => {
                self.session.copy_to_clipboard(flat);
                false
            }
            Msg::ViewDeleted => {
                self.session.clear_view();
                false
            }
            Msg::ViewLoaded(view) => {
                self.session.set_view(view);
                false
            }
            Msg::ToggleConfig(force, resolve) => {
                self.toggle_config(force, resolve);
                force.unwrap_or(self.config_open)
            }
            Msg::ConfigToggled(is_open, resolve) => {
                if !is_open {
                    self.on_rendered = resolve;
                } else if let Some(resolve) = resolve {
                    resolve.send(Ok(JsValue::UNDEFINED)).unwrap();
                }
                !is_open
            }
            Msg::TableStats(stats) => {
                self.stats = Some(stats);
                true
            }
        }
    }

    /// This top-level component is mounted to the Custom Element, so it has no API
    /// to provide props - but for sanity if needed, just return true on change.
    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        true
    }

    /// On rendered call notify_resize().  This also triggers any registered async
    /// callbacks to the Custom Element API.
    fn rendered(&mut self, _first_render: bool) {
        let mut resolve: Option<Sender<Result<JsValue, JsValue>>> = None;
        std::mem::swap(&mut resolve, &mut self.on_rendered);
        if let Some(resolve) = resolve {
            resolve.send(Ok(JsValue::UNDEFINED)).unwrap();
        }
    }

    /// `PerspectiveVieux` has two basic UI modes - "open" and "closed".
    // TODO these may be expensive to buil dbecause they will generate recursively from
    // `PerspectiveJsConfig` - they may need caching as in the JavaScript version.
    fn view(&self) -> Html {
        let config = self.link.callback(|_| Msg::ToggleConfig(None, None));
        if self.config_open {
            html! {
                <>
                    <style>{ &CSS }</style>
                    <SplitPanel id="app_panel">
                        <slot name="side_panel"></slot>
                        <div id="main_column">
                            <slot name="top_panel"></slot>
                            <div id="main_panel_container">
                                <slot name="main_panel"></slot>
                            </div>
                        </div>
                    </SplitPanel>
                    <StatusBar
                        id="status_bar"
                        stats=&self.stats
                        on_reset=self.link.callback(|_| Msg::Reset)
                        on_download=self.link.callback(Msg::Export)
                        on_copy=self.link.callback(Msg::Copy)>
                    </StatusBar>
                    <div id="config_button" class="noselect button" onclick=config></div>
                </>
            }
        } else {
            html! {
                <>
                    <style>{ &CSS }</style>
                    <slot name="main_panel"></slot>
                    <div id="config_button" class="noselect button" onclick=config></div>
                </>
            }
        }
    }

    fn destroy(&mut self) {}
}

impl PerspectiveVieux {
    /// Toggle the config, or force the config panel either open (true) or closed
    /// (false) explicitly.  In order to reduce apparent screen-shear, `toggle_config()`
    /// uses a somewhat complex render order:  it first resize the plugin's `<div>`
    /// without moving it, using `overflow: hidden` to hide the extra draw area;  then,
    /// after the _async_ drawing of the plugin is complete, it will send a message to
    /// complete the toggle action and re-render the element with the config removed.
    ///
    /// # Arguments
    /// * `force` - Whether to explicitly set the config panel state to Open/Close
    ///   (`Some(true)`/`Some(false)`), or to just toggle the current state (`None`).
    fn toggle_config(
        &mut self,
        force: Option<bool>,
        sender: Option<Sender<Result<JsValue, JsValue>>>,
    ) {
        match force {
            Some(force) if self.config_open == force => {
                if let Some(sender) = sender {
                    sender.send(Ok(JsValue::UNDEFINED)).unwrap();
                }
            }
            Some(_) | None => {
                let force = !self.config_open;
                self.config_open = force;
                let callback = self
                    .link
                    .callback_once(move |_| Msg::ConfigToggled(force, sender));

                let task = toggle_config_task(force, self.props.clone(), callback);
                let _ = future_to_promise(task);
            }
        };
    }

    /// Helper to `await` the propvided `Table` and then trigger the resulting state
    /// and UI changes.
    fn set_session_table(
        &mut self,
        sender: Sender<Result<JsValue, JsValue>>,
        table: Promise,
    ) {
        let msg = Msg::TableStats(TableStats::default());
        self.link.send_message(msg);
        let session = self.session.clone();
        let _ = future_to_promise(async move {
            sender.send(session.set_table(table).await).unwrap();
            Ok(JsValue::UNDEFINED)
        });
    }
}

/// An `async` task to pre-resize the `main_panel` to avoid screen shear.
async fn toggle_config_task(
    open: bool,
    props: PerspectiveVieuxProps,
    callback: Callback<()>,
) -> Result<JsValue, JsValue> {
    let element = find_custom_element(&props, &callback).ok_or(JsValue::UNDEFINED)?;
    if open {
        dispatch_settings_event(element.clone(), open)?;
        callback.emit(());
        plugin_resize(element).await;
    } else {
        let main_panel: web_sys::HtmlElement = props
            .elem
            .query_selector("[slot=main_panel]")
            .unwrap()
            .unwrap()
            .unchecked_into();

        let new_width = format!("{}px", element.client_width());
        let new_height = format!("{}px", element.client_height());
        main_panel.style().set_property("width", &new_width)?;
        main_panel.style().set_property("height", &new_height)?;
        plugin_resize(element.clone()).await;
        main_panel.style().set_property("width", "")?;
        main_panel.style().set_property("height", "")?;
        dispatch_settings_event(element, open)?;
        callback.emit(());
    }

    Ok(JsValue::UNDEFINED)
}

/// Dispatch the "perspective-toggle-settings" event to notify external
/// listeners.
fn dispatch_settings_event(
    element: web_sys::Element,
    open: bool,
) -> Result<(), JsValue> {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&JsValue::from(open));
    let event = web_sys::CustomEvent::new_with_event_init_dict(
        "perspective-toggle-settings",
        &event_init,
    );

    element.toggle_attribute_with_force("settings", open)?;
    element.dispatch_event(&event.unwrap()).unwrap();
    Ok(())
}

/// Find the root `<perspective-viewer>` Custom Element from the embedded
/// `<perspective-vieux>` element reference by piercing the parent Shadow Dom.
fn find_custom_element(
    props: &PerspectiveVieuxProps,
    callback: &Callback<()>,
) -> Option<web_sys::Element> {
    let elem = props.elem.parent_node();
    if elem.is_none() {
        callback.emit(());
        None
    } else {
        Some(
            elem.unwrap()
                .get_root_node()
                .unchecked_into::<web_sys::ShadowRoot>()
                .host(),
        )
    }
}

/// FFI to the wrapper Custom Element, find the `_plugin` and call `resize()`.
///
/// # TODO
/// * Not all `resize` are `async`?
/// * Not all `_plugin` have `resize`?
async fn plugin_resize(custom_element: web_sys::Element) {
    let plugin = Reflect::get(&custom_element, &JsValue::from("_plugin")).unwrap();
    let resize: Function = Reflect::get(&plugin, &JsValue::from("resize"))
        .unwrap()
        .unchecked_into();

    if !resize.is_undefined() {
        let fut = resize.call0(&custom_element).unwrap();
        if !fut.is_undefined() {
            let _ = JsFuture::from(fut.unchecked_into::<Promise>()).await;
        }
    }
}
