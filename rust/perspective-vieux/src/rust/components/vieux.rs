////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::plugin_selector::PluginSelector;
use crate::components::render_warning::RenderWarning;
use crate::components::split_panel::SplitPanel;
use crate::components::status_bar::StatusBar;
use crate::js::perspective::*;
use crate::plugin::*;
use crate::session::Session;
use crate::utils::*;

use futures::channel::oneshot::*;
use wasm_bindgen::{prelude::*, JsCast};
use wasm_bindgen_futures::spawn_local;
use web_sys::*;
use yew::prelude::*;

pub static CSS: &str = include_str!("../../../dist/css/perspective-vieux.css");

#[derive(Properties, Clone)]
pub struct PerspectiveVieuxProps {
    pub elem: web_sys::HtmlElement,
    pub panels: (web_sys::HtmlElement, web_sys::HtmlElement),
    pub session: Session,
    pub plugin: Plugin,

    #[prop_or_default]
    pub weak_link: WeakComponentLink<PerspectiveVieux>,
}

pub enum Msg {
    LoadTable(JsPerspectiveTable, Sender<Result<JsValue, JsValue>>),
    Reset,
    ToggleConfig(Option<bool>, Option<Sender<Result<JsValue, JsValue>>>),
    ToggleConfigFinished(Sender<()>),
    RenderDimensions(Option<(usize, usize, Option<usize>, Option<usize>)>),
}

pub struct PerspectiveVieux {
    link: ComponentLink<Self>,
    props: PerspectiveVieuxProps,
    config_open: bool,
    dimensions: Option<(usize, usize, Option<usize>, Option<usize>)>,
    on_rendered: Option<Sender<()>>,
}

impl Component for PerspectiveVieux {
    type Message = Msg;
    type Properties = PerspectiveVieuxProps;
    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        *props.weak_link.borrow_mut() = Some(link.clone());
        Self {
            props,
            link,
            config_open: false,
            dimensions: None,
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
            Msg::ToggleConfig(force, resolve) => {
                self.toggle_config(force, resolve);
                false
            }
            Msg::ToggleConfigFinished(sender) => {
                self.on_rendered = Some(sender);
                true
            }
            Msg::RenderDimensions(dimensions) => {
                self.dimensions = dimensions;
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
        let resolve = self.on_rendered.take();
        if let Some(resolve) = resolve {
            resolve.send(()).expect("Orphan render");
        }
    }

    /// `PerspectiveVieux` has two basic UI modes - "open" and "closed".
    // TODO these may be expensive to buil dbecause they will generate recursively from
    // `JsPerspectiveConfig` - they may need caching as in the JavaScript version.
    fn view(&self) -> Html {
        let config = self.link.callback(|_| Msg::ToggleConfig(None, None));
        if self.config_open {
            html! {
                <>
                    <style>{ &CSS }</style>
                    <SplitPanel id="app_panel">
                        <div id="side_panel" class="column noselect">
                            <PluginSelector plugin=self.props.plugin.clone()>
                            </PluginSelector>
                            <slot name="side_panel"></slot>
                        </div>
                        <div id="main_column">
                            <slot name="top_panel"></slot>
                            <div id="main_panel_container">
                                <RenderWarning
                                    dimensions=self.dimensions
                                    plugin=self.props.plugin.clone()>
                                </RenderWarning>
                                <slot name="main_panel"></slot>
                            </div>
                        </div>
                    </SplitPanel>
                    <StatusBar
                        id="status_bar"
                        session=self.props.session.clone()
                        on_reset=self.link.callback(|_| Msg::Reset)>
                    </StatusBar>
                    <div id="config_button" class="noselect button" onclick=config></div>
                </>
            }
        } else {
            html! {
                <>
                    <style>{ &CSS }</style>
                    <RenderWarning
                        dimensions=self.dimensions
                        plugin=self.props.plugin.clone()>
                    </RenderWarning>
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
                let callback = self.link.callback_once(Msg::ToggleConfigFinished);
                let task = toggle_config_task(
                    force,
                    self.props.elem.clone(),
                    self.props.plugin.clone(),
                    callback,
                );

                drop(promisify_ignore_view_delete(async move {
                    let result = task.await;
                    if let Some(sender) = sender {
                        let msg = result.clone().or_else(ignore_view_delete);
                        sender.send(msg).to_jserror()?;
                    };

                    result
                }));
            }
        };
    }

    /// Helper to `await` the provided `Table` and then trigger the resulting state
    /// and UI changes.
    fn set_session_table(
        &mut self,
        sender: Sender<Result<JsValue, JsValue>>,
        table: JsPerspectiveTable,
    ) {
        let session = self.props.session.clone();
        session.reset_stats();
        spawn_local(async move {
            sender.send(session.set_table(table).await).unwrap();
        });
    }
}

/// An `async` task to pre-resize the `main_panel` to avoid screen shear.
async fn toggle_config_task(
    open: bool,
    vieux_elem: HtmlElement,
    plugin: Plugin,
    on_toggle: Callback<Sender<()>>,
) -> Result<JsValue, JsValue> {
    let task = async {
        let viewer_elem = match find_custom_element(&vieux_elem) {
            Some(element) => element,
            None => {
                on_toggle.emit_and_render().await?;
                return Ok(JsValue::UNDEFINED);
            }
        };

        let plugin = plugin.get_plugin(None)?;
        if open {
            dispatch_settings_event(viewer_elem.clone(), open)?;
            on_toggle.emit_and_render().await?;
            plugin.resize().await
        } else {
            let main_panel: web_sys::HtmlElement = vieux_elem
                .query_selector("[slot=main_panel]")
                .unwrap()
                .unwrap()
                .unchecked_into();

            let new_width = format!("{}px", viewer_elem.client_width());
            let new_height = format!("{}px", viewer_elem.client_height());
            main_panel.style().set_property("width", &new_width)?;
            main_panel.style().set_property("height", &new_height)?;
            let resize = plugin.resize().await;
            main_panel.style().set_property("width", "")?;
            main_panel.style().set_property("height", "")?;
            dispatch_settings_event(viewer_elem, open)?;
            on_toggle.emit_and_render().await?;
            resize
        }
    };

    plugin.draw_lock().lock(task).await
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
fn find_custom_element(elem: &HtmlElement) -> Option<web_sys::Element> {
    let elem = elem.parent_node();
    if elem.is_none() {
        None
    } else {
        elem.map(|elem| {
            elem.get_root_node()
                .unchecked_into::<web_sys::ShadowRoot>()
                .host()
        })
    }
}
