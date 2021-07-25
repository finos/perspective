////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::column_selector::ColumnSelector;
use super::config_selector::ConfigSelector;
use super::containers::split_panel::SplitPanel;
use super::plugin_selector::PluginSelector;
use super::render_warning::RenderWarning;
use super::status_bar::StatusBar;

use crate::config::*;
use crate::dragdrop::*;
use crate::renderer::*;
use crate::session::Session;
use crate::utils::*;

use futures::channel::oneshot::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use yew::prelude::*;

pub static CSS: &str = include_str!("../../../dist/css/viewer.css");

#[derive(Properties, Clone)]
pub struct PerspectiveViewerProps {
    pub elem: web_sys::HtmlElement,
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,

    #[prop_or_default]
    pub weak_link: WeakComponentLink<PerspectiveViewer>,
}

pub enum Msg {
    Reset,
    ToggleSettings(
        Option<SettingsUpdate>,
        Option<Sender<Result<JsValue, JsValue>>>,
    ),
    QuerySettings(Sender<bool>),
    ToggleSettingsFinished(Sender<()>),
    RenderLimits(Option<(usize, usize, Option<usize>, Option<usize>)>),
}

pub struct PerspectiveViewer {
    link: ComponentLink<Self>,
    props: PerspectiveViewerProps,
    settings_open: bool,
    dimensions: Option<(usize, usize, Option<usize>, Option<usize>)>,
    on_rendered: Option<Sender<()>>,
}

impl Component for PerspectiveViewer {
    type Message = Msg;
    type Properties = PerspectiveViewerProps;
    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        *props.weak_link.borrow_mut() = Some(link.clone());
        Self {
            props,
            link,
            settings_open: false,
            dimensions: None,
            on_rendered: None,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::Reset => {
                let renderer = self.props.renderer.clone();
                let session = self.props.session.clone();
                let _ = future_to_promise(async move {
                    session.reset();
                    renderer.reset();
                    renderer.draw(session.validate().await.create_view()).await
                });

                false
            }
            Msg::QuerySettings(sender) => {
                sender.send(self.settings_open).unwrap();
                false
            }
            Msg::ToggleSettings(force, resolve) => {
                match force {
                    Some(SettingsUpdate::Missing) => (),
                    Some(SettingsUpdate::SetDefault) => {
                        self.toggle_settings(Some(false), resolve)
                    }
                    Some(SettingsUpdate::Update(force)) => {
                        self.toggle_settings(Some(force), resolve)
                    }
                    None => self.toggle_settings(None, resolve),
                }

                false
            }
            Msg::ToggleSettingsFinished(sender) => {
                dispatch_settings_event(&self.props.elem, self.settings_open).unwrap();
                self.on_rendered = Some(sender);
                true
            }
            Msg::RenderLimits(dimensions) => {
                if self.dimensions != dimensions {
                    self.dimensions = dimensions;
                    true
                } else {
                    false
                }
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

    /// `PerspectiveViewer` has two basic UI modes - "open" and "closed".
    // TODO these may be expensive to buil dbecause they will generate recursively from
    // `JsPerspectiveConfig` - they may need caching as in the JavaScript version.
    fn view(&self) -> Html {
        let settings = self.link.callback(|_| Msg::ToggleSettings(None, None));
        if self.settings_open {
            html! {
                <>
                    <style>{ &CSS }</style>
                    <SplitPanel id="app_panel">
                        <div id="side_panel" class="column noselect">
                            <PluginSelector
                                session={ self.props.session.clone() }
                                renderer={ self.props.renderer.clone() }>
                            </PluginSelector>
                            <ColumnSelector
                                dragdrop={ self.props.dragdrop.clone() }
                                renderer={ self.props.renderer.clone() }
                                session={ self.props.session.clone() }>
                            </ColumnSelector>
                        </div>
                        <div id="main_column">
                            <ConfigSelector
                                dragdrop={ self.props.dragdrop.clone() }
                                session={ self.props.session.clone() }
                                renderer={ self.props.renderer.clone() }>
                            </ConfigSelector>
                            <div id="main_panel_container">
                                <RenderWarning
                                    dimensions={ self.dimensions }
                                    session={ self.props.session.clone() }
                                    renderer={ self.props.renderer.clone() }>
                                </RenderWarning>
                                <slot></slot>
                            </div>
                        </div>
                    </SplitPanel>
                    <StatusBar
                        id="status_bar"
                        session={ self.props.session.clone() }
                        on_reset={ self.link.callback(|_| Msg::Reset) }>
                    </StatusBar>
                    <div
                        id="settings_button"
                        class="noselect button"
                        onmousedown={ settings }>
                    </div>
                </>
            }
        } else {
            html! {
                <>
                    <style>{ &CSS }</style>
                    <RenderWarning
                        dimensions={ self.dimensions }
                        session={ self.props.session.clone() }
                        renderer={ self.props.renderer.clone() }>
                    </RenderWarning>
                    <div id="main_panel_container" class="settings-closed">
                        <slot></slot>
                    </div>
                    <div id="settings_button" class="noselect button" onmousedown={ settings }></div>
                </>
            }
        }
    }

    fn destroy(&mut self) {}
}

impl PerspectiveViewer {
    /// Toggle the settings, or force the settings panel either open (true) or closed
    /// (false) explicitly.  In order to reduce apparent screen-shear, `toggle_settings()`
    /// uses a somewhat complex render order:  it first resize the plugin's `<div>`
    /// without moving it, using `overflow: hidden` to hide the extra draw area;  then,
    /// after the _async_ drawing of the plugin is complete, it will send a message to
    /// complete the toggle action and re-render the element with the settings removed.
    ///
    /// # Arguments
    /// * `force` - Whether to explicitly set the settings panel state to Open/Close
    ///   (`Some(true)`/`Some(false)`), or to just toggle the current state (`None`).
    fn toggle_settings(
        &mut self,
        force: Option<bool>,
        sender: Option<Sender<Result<JsValue, JsValue>>>,
    ) {
        match force {
            Some(force) if self.settings_open == force => {
                if let Some(sender) = sender {
                    sender.send(Ok(JsValue::UNDEFINED)).unwrap();
                }
            }
            Some(_) | None => {
                let force = !self.settings_open;
                self.settings_open = force;
                let callback = self.link.callback_once(Msg::ToggleSettingsFinished);
                let renderer = self.props.renderer.clone();
                drop(promisify_ignore_view_delete(async move {
                    let result =
                        renderer.presize(force, callback.emit_and_render()).await;

                    if let Some(sender) = sender {
                        let msg = result.clone().or_else(ignore_view_delete);
                        sender.send(msg).into_jserror()?;
                    };

                    result
                }));
            }
        };
    }
}

/// Dispatch the "perspective-toggle-settings" event to notify external
/// listeners.
fn dispatch_settings_event(
    viewer_elem: &web_sys::HtmlElement,
    open: bool,
) -> Result<(), JsValue> {
    let mut event_init = web_sys::CustomEventInit::new();
    event_init.detail(&JsValue::from(open));
    let event = web_sys::CustomEvent::new_with_event_init_dict(
        "perspective-toggle-settings",
        &event_init,
    );

    viewer_elem.toggle_attribute_with_force("settings", open)?;
    viewer_elem.dispatch_event(&event.unwrap()).unwrap();

    Ok(())
}
