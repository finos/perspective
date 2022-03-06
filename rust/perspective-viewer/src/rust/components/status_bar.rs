////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::containers::select::*;
use crate::components::status_bar_counter::StatusBarRowsCounter;
use crate::custom_elements::export_dropdown::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;
use wasm_bindgen_futures::spawn_local;
use web_sys::*;
use yew::prelude::*;

#[cfg(test)]
use crate::utils::WeakScope;

#[derive(Properties, Clone)]
pub struct StatusBarProps {
    pub id: String,
    pub on_reset: Callback<bool>,
    pub session: Session,
    pub renderer: Renderer,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakScope<StatusBar>,
}

impl PartialEq for StatusBarProps {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

pub enum StatusBarMsg {
    Reset(bool),
    Export,
    Copy(bool),
    SetThemeConfig((Vec<String>, Option<usize>)),
    SetTheme(String),
    TableStatsChanged,
    SetIsUpdating(bool),
}

/// A toolbar with buttons, and `Table` & `View` status information.
pub struct StatusBar {
    is_updating: i32,
    theme: Option<String>,
    themes: Vec<String>,
    export_ref: NodeRef,
    export_dropdown: Option<ExportDropDownMenuElement>,
    _sub: [Subscription; 4],
}

impl Component for StatusBar {
    type Message = StatusBarMsg;
    type Properties = StatusBarProps;

    fn create(ctx: &Context<Self>) -> Self {
        enable_weak_link_test!(ctx.props(), ctx.link());
        let cb = ctx.link().callback(|_| StatusBarMsg::TableStatsChanged);
        let _sub = [
            ctx.props().session.on_stats.add_listener(cb),
            ctx.props().session.on_view_config_updated.add_listener(
                ctx.link().callback(|_| StatusBarMsg::SetIsUpdating(true)),
            ),
            ctx.props().session.on_view_created.add_listener(
                ctx.link().callback(|_| StatusBarMsg::SetIsUpdating(false)),
            ),
            ctx.props()
                .renderer
                .on_theme_config_updated
                .add_listener(ctx.link().callback(StatusBarMsg::SetThemeConfig)),
        ];

        // Fetch initial theme
        let renderer = ctx.props().renderer.clone();
        let on_theme = ctx.link().callback(StatusBarMsg::SetThemeConfig);
        let _ = promisify_ignore_view_delete(async move {
            on_theme.emit(renderer.get_theme_config().await?);
            Ok(JsValue::UNDEFINED)
        });

        Self {
            _sub,
            theme: None,
            themes: vec![],
            export_dropdown: None,
            export_ref: NodeRef::default(),
            is_updating: 0,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            StatusBarMsg::SetIsUpdating(is_updating) => {
                self.is_updating =
                    max!(0, self.is_updating + if is_updating { 1 } else { -1 });
                true
            }
            StatusBarMsg::TableStatsChanged => true,
            StatusBarMsg::Reset(all) => {
                ctx.props().on_reset.emit(all);
                false
            }
            StatusBarMsg::SetThemeConfig((themes, index)) => {
                let new_theme = index.and_then(|x| themes.get(x)).cloned();
                let should_render = new_theme != self.theme || self.themes != themes;
                self.theme = new_theme;
                self.themes = themes;
                should_render
            }
            StatusBarMsg::SetTheme(theme) => {
                let renderer = ctx.props().renderer.clone();
                let session = ctx.props().session.clone();
                let _ = promisify_ignore_view_delete(async move {
                    renderer.set_theme_name(Some(&theme)).await?;
                    let view = session.get_view().into_jserror()?;
                    renderer.restyle_all(&view).await
                });

                false
            }
            StatusBarMsg::Export => {
                let session = ctx.props().session.clone();
                let renderer = ctx.props().renderer.clone();
                let export_dropdown = ExportDropDownMenuElement::new(session, renderer);
                let target = self.export_ref.cast::<HtmlElement>().unwrap();
                export_dropdown.open(target);
                self.export_dropdown = Some(export_dropdown);
                false
            }
            StatusBarMsg::Copy(flat) => {
                let session = ctx.props().session.clone();
                spawn_local(async move {
                    session.copy_to_clipboard(flat).await.expect("Copy failed");
                });

                false
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let stats = ctx.props().session.get_table_stats();
        let class_name = self.status_class_name(&stats);
        let is_updating_class_name = if self.is_updating > 0 {
            "updating"
        } else {
            " "
        };

        let reset = ctx
            .link()
            .callback(|event: MouseEvent| StatusBarMsg::Reset(event.shift_key()));

        let export = ctx.link().callback(|_: MouseEvent| StatusBarMsg::Export);

        let copy = ctx
            .link()
            .callback(|event: MouseEvent| StatusBarMsg::Copy(event.shift_key()));

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

                if values.len() > 1 {
                    html! {
                        <span id="theme" class="button">
                            <Select<String>
                                id="theme_selector"
                                values={ values }
                                selected={ selected.to_owned() }
                                on_select={ ontheme }>
                            </Select<String>>
                        </span>
                    }
                } else {
                    html! {}
                }
            }
        };

        html! {
            <div id={ ctx.props().id.clone() } class={ is_updating_class_name }>
                <div class="section">
                    <span id="status" class={ class_name }></span>
                </div>
                <div id="menu-bar" class="section">
                    <span id="reset" class="button" onmousedown={ reset }>
                        <span>{ "Reset" }</span>
                    </span>
                    <span
                        ref={ self.export_ref.clone() }
                        id="export"
                        class="button"
                        onmousedown={ export }>

                        <span>{ "Export" }</span>
                    </span>
                    <span id="copy" class="button" onmousedown={ copy }>
                        <span>{ "Copy" }</span>
                    </span>
                    { theme_button }
                    <div id="plugin-settings">
                        <slot name="plugin-settings"></slot>
                    </div>
                </div>
                <div id="rows" class="section">
                    <StatusBarRowsCounter stats={ stats } />
                </div>
            </div>
        }
    }
}

impl StatusBar {
    fn status_class_name(&self, stats: &Option<TableStats>) -> &'static str {
        match stats {
            Some(TableStats {
                num_rows: Some(_),
                virtual_rows: Some(_),
                is_pivot: true,
            })
            | Some(TableStats {
                num_rows: Some(_), ..
            }) => "connected",
            Some(TableStats { num_rows: None, .. }) => "initializing",
            None => "uninitialized",
        }
    }
}
