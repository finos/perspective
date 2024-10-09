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

use std::error::Error;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;

use futures::future::LocalBoxFuture;
use model::UpdateAndRender;
use perspective_client::config::ViewConfigUpdate;
use perspective_client::ReconnectCallback;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use web_sys::*;
use yew::prelude::*;

use super::style::LocalStyle;
use crate::components::containers::select::*;
use crate::components::status_bar_counter::StatusBarRowsCounter;
use crate::custom_elements::copy_dropdown::*;
use crate::custom_elements::export_dropdown::*;
use crate::presentation::Presentation;
use crate::renderer::*;
use crate::session::*;
#[cfg(test)]
use crate::utils::WeakScope;
use crate::utils::*;
use crate::*;

#[derive(Properties, Clone)]
pub struct StatusBarProps {
    pub id: String,
    pub on_reset: Callback<bool>,
    pub session: Session,
    pub renderer: Renderer,
    pub presentation: Presentation,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakScope<StatusBar>,
}

derive_model!(Renderer, Session, Presentation for StatusBarProps);

impl PartialEq for StatusBarProps {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

pub enum StatusBarMsg {
    Reset(bool),
    Export,
    Copy,
    SetThemeConfig((Vec<String>, Option<usize>)),
    SetTheme(String),
    SetError((Option<String>, Option<ReconnectCallback>)),
    TableStatsChanged,
    SetIsUpdating(bool),
    SetTitle(Option<String>),
}

/// A toolbar with buttons, and `Table` & `View` status information.
pub struct StatusBar {
    is_updating: i32,
    theme: Option<String>,
    themes: Vec<String>,
    export_ref: NodeRef,
    copy_ref: NodeRef,
    state: StatusIconState,
    _sub: [Subscription; 6],
}

impl Component for StatusBar {
    type Message = StatusBarMsg;
    type Properties = StatusBarProps;

    fn create(ctx: &Context<Self>) -> Self {
        let _sub = [
            ctx.props()
                .session
                .stats_changed
                .add_listener(ctx.link().callback(|_| StatusBarMsg::TableStatsChanged)),
            ctx.props()
                .session
                .view_config_changed
                .add_listener(ctx.link().callback(|_| StatusBarMsg::SetIsUpdating(true))),
            ctx.props()
                .session
                .view_created
                .add_listener(ctx.link().callback(|_| StatusBarMsg::SetIsUpdating(false))),
            ctx.props()
                .presentation
                .theme_config_updated
                .add_listener(ctx.link().callback(StatusBarMsg::SetThemeConfig)),
            ctx.props()
                .presentation
                .title_changed
                .add_listener(ctx.link().callback(|_| StatusBarMsg::TableStatsChanged)),
            ctx.props()
                .session
                .table_errored
                .add_listener(ctx.link().callback(StatusBarMsg::SetError)),
        ];

        // Fetch initial theme
        let presentation = ctx.props().presentation.clone();
        let on_theme = ctx.link().callback(StatusBarMsg::SetThemeConfig);
        ApiFuture::spawn(async move {
            on_theme.emit(presentation.get_selected_theme_config().await?);
            Ok(())
        });

        Self {
            _sub,
            theme: None,
            themes: vec![],
            copy_ref: NodeRef::default(),
            export_ref: NodeRef::default(),
            state: StatusIconState::Normal,
            is_updating: 0,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            StatusBarMsg::SetError(error) => {
                // std::option::Option<std::sync::Arc<dyn std::ops::Fn() ->
                // std::pin::Pin<std::boxed::Box<dyn futures::Future<Output =
                // std::result::Result<(), std::boxed::Box<dyn std::error::Error>>>>> +
                // std::marker::Send + std::marker::Sync>>
                let props = ctx.props().clone();
                // let rerender = ctx.props().update_and_render(ViewConfigUpdate::default());
                // let cb = ctx.link().callback(|()| StatusBarMsg::Copy);

                let reconnect = error.1.map(|reconnect| {
                    Rc::new(move || {
                        let reconnect = reconnect.clone();
                        let props = props.clone();
                        Box::pin(async move {
                            reconnect().await?;
                            props.session.invalidate();
                            props.update_and_render(ViewConfigUpdate::default()).await?;
                            Ok(())
                        })
                            as Pin<Box<dyn Future<Output = Result<(), Box<dyn Error>>>>>
                    })
                        as Rc<dyn Fn() -> Pin<Box<dyn Future<Output = Result<(), Box<dyn Error>>>>>>
                });

                self.state = StatusIconState::Errored(Errored(error.0, reconnect));
                true
            },
            StatusBarMsg::SetIsUpdating(is_updating) => {
                self.is_updating = max!(0, self.is_updating + if is_updating { 1 } else { -1 });
                if self.is_updating > 0 {
                    self.state = StatusIconState::Updating;
                } else {
                    self.state = StatusIconState::Normal;
                }

                true
            },
            StatusBarMsg::TableStatsChanged => true,
            StatusBarMsg::Reset(all) => {
                ctx.props().on_reset.emit(all);
                false
            },
            StatusBarMsg::SetThemeConfig((themes, index)) => {
                let new_theme = index.and_then(|x| themes.get(x)).cloned();
                let should_render = new_theme != self.theme || self.themes != themes;
                self.theme = new_theme;
                self.themes = themes;
                should_render
            },
            StatusBarMsg::SetTheme(theme_name) => {
                clone!(
                    ctx.props().renderer,
                    ctx.props().session,
                    ctx.props().presentation
                );
                ApiFuture::spawn(async move {
                    presentation.set_theme_name(Some(&theme_name)).await?;
                    let view = session.get_view().into_apierror()?;
                    renderer.restyle_all(&view).await
                });

                false
            },
            StatusBarMsg::Export => {
                let target = self.export_ref.cast::<HtmlElement>().unwrap();
                ExportDropDownMenuElement::new_from_model(ctx.props()).open(target);
                false
            },
            StatusBarMsg::Copy => {
                let target = self.copy_ref.cast::<HtmlElement>().unwrap();
                CopyDropDownMenuElement::new_from_model(ctx.props()).open(target);
                false
            },
            StatusBarMsg::SetTitle(title) => {
                ctx.props().presentation.set_title(title);
                false
            },
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let stats = ctx.props().session.get_table_stats();
        let mut is_updating_class_name = classes!();
        if self.is_updating > 0 {
            is_updating_class_name.push("updating")
        };

        if ctx.props().presentation.get_title().is_some() {
            is_updating_class_name.push("titled")
        };

        let reset = ctx
            .link()
            .callback(|event: MouseEvent| StatusBarMsg::Reset(event.shift_key()));

        let export = ctx.link().callback(|_: MouseEvent| StatusBarMsg::Export);
        let copy = ctx.link().callback(|_: MouseEvent| StatusBarMsg::Copy);

        let theme_button = match &self.theme {
            None => html! {},
            Some(selected) => {
                let ontheme = ctx.link().callback(StatusBarMsg::SetTheme);
                let values = self
                    .themes
                    .iter()
                    .cloned()
                    .map(SelectItem::Option)
                    .collect::<Vec<_>>();

                html! {
                    if values.len() > 1 {
                        <span class="hover-target">
                            <span id="theme" class="button">
                                <Select<String>
                                    id="theme_selector"
                                    {values}
                                    selected={selected.to_owned()}
                                    on_select={ontheme}
                                />
                            </span>
                        </span>
                    }
                }
            },
        };

        let oninput = ctx.link().callback({
            move |input: InputEvent| {
                let title = input
                    .target()
                    .unwrap()
                    .unchecked_into::<HtmlInputElement>()
                    .value();

                let title = if title.trim().is_empty() {
                    None
                } else {
                    Some(title)
                };

                StatusBarMsg::SetTitle(title)
            }
        });

        let is_menu = ctx.props().session.has_table()
            && (ctx.props().presentation.is_settings_open()
                || ctx.props().presentation.get_title().is_some());

        let state = self.state.clone();

        html! {
            <>
                <LocalStyle href={css!("status-bar")} />
                <div id={ctx.props().id.clone()} class={is_updating_class_name}>
                    <StatusIndicator {stats} {state}>
                        <label
                            class="input-sizer"
                            data-value={ctx.props().presentation.get_title().unwrap_or_default()}
                        >
                            <input
                                placeholder=" "
                                value={ctx.props().presentation.get_title()}
                                size="10"
                                {oninput}
                            />
                            <span id="status-bar-placeholder" />
                        </label>
                    </StatusIndicator>
                    <div id="spacer" />
                    if is_menu {
                        <div id="menu-bar" class="section">
                            { theme_button }
                            <div id="plugin-settings"><slot name="plugin-settings" /></div>
                            <span class="hover-target">
                                <span id="reset" class="button" onmousedown={reset}><span /></span>
                            </span>
                            <span class="hover-target" ref={&self.export_ref} onmousedown={export}>
                                <span id="export" class="button"><span /></span>
                            </span>
                            <span class="hover-target" ref={&self.copy_ref} onmousedown={copy}>
                                <span id="copy" class="button"><span /></span>
                            </span>
                        </div>
                    }
                </div>
            </>
        }
    }
}

type UnitResult = Result<(), Box<dyn Error>>;

#[derive(Clone, Default)]
struct Errored(
    Option<String>,
    Option<Rc<dyn Fn() -> LocalBoxFuture<'static, UnitResult>>>,
);

impl PartialEq for Errored {
    fn eq(&self, _other: &Self) -> bool {
        false
    }
}

#[derive(Clone, Default, PartialEq)]
enum StatusIconState {
    Updating,
    Errored(Errored),

    #[default]
    Normal,
}

#[derive(Clone, Properties, PartialEq)]
pub struct StatusIndicatorProps {
    stats: Option<ViewStats>,
    // is_updating: bool,
    state: StatusIconState,

    children: Children,
}

/// A pure-functional indicator component which does not hook into `model`
/// state.
#[function_component]
fn StatusIndicator(props: &StatusIndicatorProps) -> Html {
    let class_name = match (&props.state, &props.stats) {
        (StatusIconState::Errored(_), _) => "errored",
        (
            StatusIconState::Normal,
            Some(ViewStats {
                num_table_cells: Some(_),
                ..
            }),
        ) => "connected",
        (
            StatusIconState::Updating,
            Some(ViewStats {
                num_table_cells: Some(_),
                ..
            }),
        ) => "updating",
        (
            _,
            Some(ViewStats {
                num_table_cells: None,
                ..
            }),
        ) => "loading",
        (_, None) => "uninitialized",
    };

    let error_dialog = match &props.state {
        StatusIconState::Errored(Errored(Some(err), _)) => {
            html! { <span class="error-dialog">{ err }</span> }
        },
        _ => html! { <></> },
    };

    let onclick = use_callback(props.state.clone(), |_: MouseEvent, state| {
        if let StatusIconState::Errored(Errored(_, Some(reconnect))) = state.clone() {
            let _ = future_to_promise(async move {
                reconnect()
                    .await
                    .map_err(|e| JsValue::from(format!("{:?}", e)))?;

                Ok(JsValue::UNDEFINED)
            });
        }
    });

    html! {
        <>
            <div class="section">
                <div id="status_reconnect" class={class_name} {onclick}>
                    <span id="status" class={class_name} />
                    <span id="status_updating" class={class_name} />
                </div>
            </div>
            { error_dialog }
            { for props.children.iter() }
            <div id="rows" class="section"><StatusBarRowsCounter stats={props.stats.clone()} /></div>
        </>
    }
}
