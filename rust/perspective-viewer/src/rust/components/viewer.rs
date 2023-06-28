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

use std::rc::Rc;

use futures::channel::oneshot::*;
use wasm_bindgen::prelude::*;
use yew::prelude::*;

use super::column_selector::ColumnSelector;
use super::containers::split_panel::SplitPanel;
use super::expression_panel_sidebar::EditorState;
use super::font_loader::{FontLoader, FontLoaderProps, FontLoaderStatus};
use super::plugin_selector::PluginSelector;
use super::render_warning::RenderWarning;
use super::status_bar::StatusBar;
use super::style::{LocalStyle, StyleProvider};
use crate::components::expression_panel_sidebar::ExprEditorPanel;
use crate::config::*;
use crate::dragdrop::*;
use crate::model::*;
use crate::presentation::Presentation;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

#[derive(Properties)]
pub struct PerspectiveViewerProps {
    pub elem: web_sys::HtmlElement,
    pub session: Session,
    pub renderer: Renderer,
    pub presentation: Presentation,
    pub dragdrop: DragDrop,

    #[prop_or_default]
    pub weak_link: WeakScope<PerspectiveViewer>,
}

derive_model!(Renderer, Session for PerspectiveViewerProps);

impl PartialEq for PerspectiveViewerProps {
    fn eq(&self, _rhs: &Self) -> bool {
        false
    }
}

impl PerspectiveViewerProps {
    fn is_title(&self) -> bool {
        !self.presentation.get_is_workspace() && self.presentation.get_title().is_some()
    }
}

#[derive(Debug)]
pub enum PerspectiveViewerMsg {
    Resize,
    Reset(bool, Option<Sender<()>>),
    ToggleSettingsInit(Option<SettingsUpdate>, Option<Sender<ApiResult<JsValue>>>),
    ToggleSettingsComplete(SettingsUpdate, Sender<()>),
    PreloadFontsUpdate,
    ViewConfigChanged,
    RenderLimits(Option<(usize, usize, Option<usize>, Option<usize>)>),
    ExpressionEditor(EditorState),
}

pub struct PerspectiveViewer {
    dimensions: Option<(usize, usize, Option<usize>, Option<usize>)>,
    on_rendered: Option<Sender<()>>,
    fonts: FontLoaderProps,
    settings_open: bool,
    editor_state: EditorState,
    on_resize: Rc<PubSub<()>>,
    on_dimensions_reset: Rc<PubSub<()>>,
    _subscriptions: [Subscription; 1],
}

impl Component for PerspectiveViewer {
    type Message = PerspectiveViewerMsg;
    type Properties = PerspectiveViewerProps;

    fn create(ctx: &Context<Self>) -> Self {
        *ctx.props().weak_link.borrow_mut() = Some(ctx.link().clone());
        let elem = ctx.props().elem.clone();
        let callback = ctx
            .link()
            .callback(|()| PerspectiveViewerMsg::PreloadFontsUpdate);
        let session_sub = {
            let callback = ctx.link().batch_callback(|(update, x)| {
                if update {
                    vec![PerspectiveViewerMsg::RenderLimits(Some(x))]
                } else {
                    vec![
                        PerspectiveViewerMsg::RenderLimits(Some(x)),
                        PerspectiveViewerMsg::ViewConfigChanged,
                    ]
                }
            });
            ctx.props().renderer.session_changed.add_listener(callback)
        };

        Self {
            dimensions: None,
            on_rendered: None,
            fonts: FontLoaderProps::new(&elem, callback),
            settings_open: false,
            editor_state: EditorState::Closed,
            on_resize: Default::default(),
            on_dimensions_reset: Default::default(),
            _subscriptions: [session_sub],
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        let needs_update = self.editor_state != EditorState::Closed;
        match msg {
            PerspectiveViewerMsg::PreloadFontsUpdate => true,
            PerspectiveViewerMsg::Resize => {
                self.on_resize.emit_all(());
                false
            }
            PerspectiveViewerMsg::Reset(all, sender) => {
                self.editor_state = EditorState::Closed;
                clone!(
                    ctx.props().renderer,
                    ctx.props().session,
                    ctx.props().presentation
                );

                ApiFuture::spawn(async move {
                    session.reset(all);
                    renderer.reset().await;
                    presentation.reset_available_themes(None).await;
                    let result = renderer.draw(session.validate().await?.create_view()).await;
                    if let Some(sender) = sender {
                        sender.send(()).unwrap();
                    }

                    result
                });

                needs_update
            }
            PerspectiveViewerMsg::ToggleSettingsInit(Some(SettingsUpdate::Missing), None) => false,
            PerspectiveViewerMsg::ToggleSettingsInit(
                Some(SettingsUpdate::Missing),
                Some(resolve),
            ) => {
                resolve.send(Ok(JsValue::UNDEFINED)).unwrap();
                false
            }
            PerspectiveViewerMsg::ToggleSettingsInit(Some(SettingsUpdate::SetDefault), resolve) => {
                self.init_toggle_settings_task(ctx, Some(false), resolve);
                false
            }
            PerspectiveViewerMsg::ToggleSettingsInit(
                Some(SettingsUpdate::Update(force)),
                resolve,
            ) => {
                self.init_toggle_settings_task(ctx, Some(force), resolve);
                false
            }
            PerspectiveViewerMsg::ToggleSettingsInit(None, resolve) => {
                self.init_toggle_settings_task(ctx, None, resolve);
                false
            }
            PerspectiveViewerMsg::ToggleSettingsComplete(SettingsUpdate::SetDefault, resolve)
                if self.settings_open =>
            {
                self.editor_state = EditorState::Closed;
                self.settings_open = false;
                self.on_rendered = Some(resolve);
                true
            }
            PerspectiveViewerMsg::ToggleSettingsComplete(
                SettingsUpdate::Update(force),
                resolve,
            ) if force != self.settings_open => {
                self.editor_state = EditorState::Closed;
                self.settings_open = force;
                self.on_rendered = Some(resolve);
                true
            }
            PerspectiveViewerMsg::ToggleSettingsComplete(_, resolve)
                if matches!(self.fonts.get_status(), FontLoaderStatus::Finished) =>
            {
                self.editor_state = EditorState::Closed;
                resolve.send(()).expect("Orphan render");
                false
            }
            PerspectiveViewerMsg::ToggleSettingsComplete(_, resolve) => {
                self.editor_state = EditorState::Closed;
                self.on_rendered = Some(resolve);
                true
            }
            PerspectiveViewerMsg::ViewConfigChanged => {
                self.editor_state = EditorState::Closed;
                needs_update
            }
            PerspectiveViewerMsg::RenderLimits(dimensions) => {
                if self.dimensions != dimensions {
                    self.dimensions = dimensions;
                    true
                } else {
                    false
                }
            }
            PerspectiveViewerMsg::ExpressionEditor(new_state) => {
                if self.editor_state == new_state {
                    false
                } else {
                    self.editor_state = new_state;
                    true
                }
            }
        }
    }

    /// This top-level component is mounted to the Custom Element, so it has no
    /// API to provide props - but for sanity if needed, just return true on
    /// change.
    fn changed(&mut self, _ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        true
    }

    /// On rendered call notify_resize().  This also triggers any registered
    /// async callbacks to the Custom Element API.
    fn rendered(&mut self, ctx: &Context<Self>, _first_render: bool) {
        ctx.props()
            .presentation
            .set_settings_open(Some(self.settings_open))
            .unwrap();

        if self.on_rendered.is_some()
            && matches!(self.fonts.get_status(), FontLoaderStatus::Finished)
        {
            self.on_rendered
                .take()
                .unwrap()
                .send(())
                .expect("Orphan render");
        }
    }

    /// `PerspectiveViewer` has two basic UI modes - "open" and "closed".
    // TODO these may be expensive to build because they will generate recursively
    // from `JsPerspectiveConfig` - they may need caching as in the JavaScript
    // version.
    fn view(&self, ctx: &Context<Self>) -> Html {
        let settings = ctx
            .link()
            .callback(|_| PerspectiveViewerMsg::ToggleSettingsInit(None, None));
        let on_close_settings = ctx
            .link()
            .callback(|()| PerspectiveViewerMsg::ToggleSettingsInit(None, None));
        let mut class = classes!("settings-closed");
        if ctx.props().is_title() {
            class.push("titled");
        }

        let on_open_expr_panel = ctx.link().callback(|s: Option<String>| {
            PerspectiveViewerMsg::ExpressionEditor(
                s.map(EditorState::UpdateExpr)
                    .unwrap_or(EditorState::NewExpr),
            )
        });
        let on_reset = ctx
            .link()
            .callback(|all| PerspectiveViewerMsg::Reset(all, None));

        html_template! {
            <StyleProvider>
                <LocalStyle href={ css!("viewer") } />
                if self.settings_open {
                    <SplitPanel
                        id="app_panel"
                        reverse=true
                        on_reset={ self.on_dimensions_reset.callback() }
                        on_resize_finished={ ctx.props().render_callback() }>
                        <div id="settings_panel" class="sidebar_column noselect split-panel orient-vertical">
                            <SidebarCloseButton
                                id={ "settings_close_button" }
                                on_close_sidebar={ &on_close_settings }>
                            </SidebarCloseButton>
                            <PluginSelector
                                session={ &ctx.props().session }
                                renderer={ &ctx.props().renderer }>
                            </PluginSelector>
                            <ColumnSelector
                                dragdrop={ &ctx.props().dragdrop }
                                renderer={ &ctx.props().renderer }
                                session={ &ctx.props().session }
                                on_resize={ &self.on_resize }
                                on_open_expr_panel={ &on_open_expr_panel }
                                on_dimensions_reset={ &self.on_dimensions_reset }
                                editor_state={ self.editor_state.clone() }>
                            </ColumnSelector>
                        </div>
                        <div id="main_column">
                            <StatusBar
                                id="status_bar"
                                session={ &ctx.props().session }
                                renderer={ &ctx.props().renderer }
                                presentation={ &ctx.props().presentation }
                                { on_reset }>
                            </StatusBar>
                            <div id="main_panel_container">
                                <RenderWarning
                                    dimensions={ self.dimensions }
                                    session={ &ctx.props().session }
                                    renderer={ &ctx.props().renderer }>
                                </RenderWarning>
                                <slot></slot>
                            </div>
                            if !matches!(self.editor_state, EditorState::Closed) {
                                <SplitPanel id="modal_panel" reverse=true>
                                    <ExprEditorPanel
                                        session = { &ctx.props().session }
                                        renderer = { &ctx.props().renderer }
                                        editor_state = { self.editor_state.clone() }
                                        on_close = { ctx.link().callback(|_| PerspectiveViewerMsg::ExpressionEditor(EditorState::Closed)) } />
                                    <></>
                                </SplitPanel>
                            }
                    </div>
                    </SplitPanel>
                } else {
                    <RenderWarning
                        dimensions={ self.dimensions }
                        session={ &ctx.props().session }
                        renderer={ &ctx.props().renderer }>
                    </RenderWarning>
                    if ctx.props().is_title() {
                        <StatusBar
                            id="status_bar"
                            session={ &ctx.props().session }
                            renderer={ &ctx.props().renderer }
                            presentation={ &ctx.props().presentation }
                            { on_reset }>
                        </StatusBar>
                    }
                    <div id="main_panel_container" { class }>
                        <slot></slot>
                    </div>
                    if !ctx.props().presentation.get_is_workspace() {
                        <div
                            id="settings_button"
                            class={ if ctx.props().is_title() { "noselect button closed titled" } else { "noselect button closed" } }
                            onmousedown={ settings }>
                        </div>
                    }
                }
            </StyleProvider>
            <FontLoader ..self.fonts.clone()></FontLoader>
        }
    }

    fn destroy(&mut self, _ctx: &Context<Self>) {}
}

impl PerspectiveViewer {
    /// Toggle the settings, or force the settings panel either open (true) or
    /// closed (false) explicitly.  In order to reduce apparent
    /// screen-shear, `toggle_settings()` uses a somewhat complex render
    /// order:  it first resize the plugin's `<div>` without moving it,
    /// using `overflow: hidden` to hide the extra draw area;  then,
    /// after the _async_ drawing of the plugin is complete, it will send a
    /// message to complete the toggle action and re-render the element with
    /// the settings removed.
    ///
    /// # Arguments
    /// * `force` - Whether to explicitly set the settings panel state to
    ///   Open/Close (`Some(true)`/`Some(false)`), or to just toggle the current
    ///   state (`None`).
    fn init_toggle_settings_task(
        &mut self,
        ctx: &Context<Self>,
        force: Option<bool>,
        sender: Option<Sender<ApiResult<JsValue>>>,
    ) {
        let is_open = ctx.props().presentation.is_settings_open();
        match force {
            Some(force) if is_open == force => {
                if let Some(sender) = sender {
                    sender.send(Ok(JsValue::UNDEFINED)).unwrap();
                }
            }
            Some(_) | None => {
                let force = !is_open;
                let callback = ctx.link().callback(move |resolve| {
                    let update = SettingsUpdate::Update(force);
                    PerspectiveViewerMsg::ToggleSettingsComplete(update, resolve)
                });

                clone!(ctx.props().renderer, ctx.props().session);
                ApiFuture::spawn(async move {
                    let result = if session.js_get_table().is_some() {
                        renderer.presize(force, callback.emit_async_safe()).await
                    } else {
                        callback.emit_async_safe().await?;
                        Ok(JsValue::UNDEFINED)
                    };

                    if let Some(sender) = sender {
                        let msg = result.clone().ignore_view_delete();
                        sender.send(msg).into_apierror()?;
                    };

                    result
                });
            }
        };
    }
}

#[derive(PartialEq, Clone, Properties)]
pub struct SidebarCloseButtonProps {
    pub on_close_sidebar: Callback<()>,
    pub id: AttrValue,
}

#[function_component]
pub fn SidebarCloseButton(p: &SidebarCloseButtonProps) -> Html {
    let onclick = yew::use_callback(|_, cb| cb.emit(()), p.on_close_sidebar.clone());
    let id = &p.id;
    html! {
        <div { onclick } { id } class="sidebar_close_button"></div>
    }
}
