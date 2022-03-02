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
use super::font_loader::{FontLoader, FontLoaderProps};
use super::plugin_selector::PluginSelector;
use super::render_warning::RenderWarning;
use super::status_bar::StatusBar;

use crate::config::*;
use crate::dragdrop::*;
use crate::renderer::*;
use crate::session::Session;
use crate::utils::*;

use futures::channel::oneshot::*;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use yew::prelude::*;

pub static CSS: &str = include_str!("../../../build/css/viewer.css");

#[derive(Properties, Clone)]
pub struct PerspectiveViewerProps {
    pub elem: web_sys::HtmlElement,
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,

    #[prop_or_default]
    pub weak_link: WeakScope<PerspectiveViewer>,
}

impl PartialEq for PerspectiveViewerProps {
    fn eq(&self, _rhs: &Self) -> bool {
        false
    }
}

pub enum Msg {
    Resize,
    Reset(bool, Option<Sender<()>>),
    ToggleSettingsInit(
        Option<SettingsUpdate>,
        Option<Sender<Result<JsValue, JsValue>>>,
    ),
    ToggleSettingsComplete(SettingsUpdate, Sender<()>),
    PreloadFontsUpdate,
    RenderLimits(Option<(usize, usize, Option<usize>, Option<usize>)>),
}

pub struct PerspectiveViewer {
    dimensions: Option<(usize, usize, Option<usize>, Option<usize>)>,
    on_rendered: Option<Sender<()>>,
    fonts: FontLoaderProps,
    settings_open: bool,
    on_resize: Rc<PubSub<()>>,
    on_dimensions_reset: Rc<PubSub<()>>,
}

impl Component for PerspectiveViewer {
    type Message = Msg;
    type Properties = PerspectiveViewerProps;
    fn create(ctx: &Context<Self>) -> Self {
        *ctx.props().weak_link.borrow_mut() = Some(ctx.link().clone());
        let elem = ctx.props().elem.clone();
        let callback = ctx.link().callback(|()| Msg::PreloadFontsUpdate);

        Self {
            dimensions: None,
            on_rendered: None,
            fonts: FontLoaderProps::new(&elem, callback),
            settings_open: false,
            on_resize: Default::default(),
            on_dimensions_reset: Default::default(),
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Msg::PreloadFontsUpdate => true,
            Msg::Resize => {
                self.on_resize.emit_all(());
                false
            }
            Msg::Reset(all, sender) => {
                let renderer = ctx.props().renderer.clone();
                let session = ctx.props().session.clone();
                let _ = promisify_ignore_view_delete(async move {
                    session.reset(all);
                    renderer.reset().await;
                    let result =
                        renderer.draw(session.validate().await.create_view()).await;

                    if let Some(sender) = sender {
                        sender.send(()).unwrap();
                    }

                    result
                });

                false
            }
            Msg::ToggleSettingsInit(Some(SettingsUpdate::Missing), None) => false,
            Msg::ToggleSettingsInit(Some(SettingsUpdate::Missing), Some(resolve)) => {
                resolve.send(Ok(JsValue::UNDEFINED)).unwrap();
                false
            }
            Msg::ToggleSettingsInit(Some(SettingsUpdate::SetDefault), resolve) => {
                self.init_toggle_settings_task(ctx, Some(false), resolve);
                false
            }
            Msg::ToggleSettingsInit(Some(SettingsUpdate::Update(force)), resolve) => {
                self.init_toggle_settings_task(ctx, Some(force), resolve);
                false
            }
            Msg::ToggleSettingsInit(None, resolve) => {
                self.init_toggle_settings_task(ctx, None, resolve);
                false
            }
            Msg::ToggleSettingsComplete(SettingsUpdate::SetDefault, resolve)
                if self.settings_open =>
            {
                self.settings_open = false;
                self.on_rendered = Some(resolve);
                true
            }
            Msg::ToggleSettingsComplete(SettingsUpdate::Update(force), resolve)
                if force != self.settings_open =>
            {
                self.settings_open = force;
                self.on_rendered = Some(resolve);
                true
            }
            Msg::ToggleSettingsComplete(_, resolve) => {
                resolve.send(()).expect("Orphan render");
                false
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
    fn changed(&mut self, _ctx: &Context<Self>) -> bool {
        true
    }

    /// On rendered call notify_resize().  This also triggers any registered async
    /// callbacks to the Custom Element API.
    fn rendered(&mut self, ctx: &Context<Self>, _first_render: bool) {
        ctx.props()
            .renderer
            .set_settings_open(Some(self.settings_open))
            .unwrap();

        let resolve = self.on_rendered.take();
        if let Some(resolve) = resolve {
            resolve.send(()).expect("Orphan render");
        }
    }

    /// `PerspectiveViewer` has two basic UI modes - "open" and "closed".
    // TODO these may be expensive to buil dbecause they will generate recursively from
    // `JsPerspectiveConfig` - they may need caching as in the JavaScript version.
    fn view(&self, ctx: &Context<Self>) -> Html {
        let settings = ctx.link().callback(|_| Msg::ToggleSettingsInit(None, None));
        let callback = self.on_dimensions_reset.callback();
        if self.settings_open {
            html! {
                <>
                    <style>{ &CSS }</style>
                    <SplitPanel
                        id="app_panel"
                        on_reset={ callback }>
                        <div id="side_panel" class="column noselect">
                            <PluginSelector
                                session={ ctx.props().session.clone() }
                                renderer={ ctx.props().renderer.clone() }>
                            </PluginSelector>
                            <ColumnSelector
                                dragdrop={ ctx.props().dragdrop.clone() }
                                renderer={ ctx.props().renderer.clone() }
                                session={ ctx.props().session.clone() }
                                on_resize={ self.on_resize.clone() }
                                on_dimensions_reset={ self.on_dimensions_reset.clone() }>
                            </ColumnSelector>
                        </div>
                        <div id="main_column">
                            <ConfigSelector
                                dragdrop={ ctx.props().dragdrop.clone() }
                                session={ ctx.props().session.clone() }
                                renderer={ ctx.props().renderer.clone() }>
                            </ConfigSelector>
                            <div id="main_panel_container">
                                <RenderWarning
                                    dimensions={ self.dimensions }
                                    session={ ctx.props().session.clone() }
                                    renderer={ ctx.props().renderer.clone() }>
                                </RenderWarning>
                                <slot></slot>
                            </div>
                        </div>
                    </SplitPanel>
                    <StatusBar
                        id="status_bar"
                        session={ ctx.props().session.clone() }
                        renderer={ ctx.props().renderer.clone() }
                        on_reset={ ctx.link().callback(|all| Msg::Reset(all, None)) }>
                    </StatusBar>
                    <div
                        id="settings_button"
                        class="noselect button"
                        onmousedown={ settings }>
                    </div>
                    <FontLoader with self.fonts.clone()></FontLoader>
                </>
            }
        } else {
            html! {
                <>
                    <style>{ &CSS }</style>
                    <RenderWarning
                        dimensions={ self.dimensions }
                        session={ ctx.props().session.clone() }
                        renderer={ ctx.props().renderer.clone() }>
                    </RenderWarning>
                    <div id="main_panel_container" class="settings-closed">
                        <slot></slot>
                    </div>
                    <div id="settings_button" class="noselect button" onmousedown={ settings }></div>
                    <FontLoader with self.fonts.clone()></FontLoader>
                </>
            }
        }
    }

    fn destroy(&mut self, _ctx: &Context<Self>) {}
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
    fn init_toggle_settings_task(
        &mut self,
        ctx: &Context<Self>,
        force: Option<bool>,
        sender: Option<Sender<Result<JsValue, JsValue>>>,
    ) {
        let is_open = ctx.props().renderer.is_settings_open();
        match force {
            Some(force) if is_open == force => {
                if let Some(sender) = sender {
                    sender.send(Ok(JsValue::UNDEFINED)).unwrap();
                }
            }
            Some(_) | None => {
                let force = !is_open;
                let callback = ctx.link().callback_once(move |resolve| {
                    let update = SettingsUpdate::Update(force);
                    Msg::ToggleSettingsComplete(update, resolve)
                });

                let renderer = ctx.props().renderer.clone();
                let session = ctx.props().session.clone();
                drop(promisify_ignore_view_delete(async move {
                    let result = if session.js_get_table().is_some() {
                        renderer.presize(force, callback.emit_and_render()).await
                    } else {
                        callback.emit_and_render().await?;
                        Ok(JsValue::UNDEFINED)
                    };

                    if let Some(sender) = sender {
                        // TODO shouldn't ignore, this should retry (?)
                        let msg = result.clone().or_else(ignore_view_delete);
                        sender.send(msg).into_jserror()?;
                    };

                    result
                }));
            }
        };
    }
}
