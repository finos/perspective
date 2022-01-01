////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::status_bar_counter::StatusBarRowsCounter;
use crate::session::*;
use crate::utils::*;
use crate::*;

#[cfg(test)]
use crate::utils::WeakScope;

use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct StatusBarProps {
    pub id: String,
    pub on_reset: Callback<bool>,
    pub session: Session,

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
    Export(bool),
    Copy(bool),
    TableStatsChanged,
    SetIsUpdating(bool),
}

/// A toolbar with buttons, and `Table` & `View` status information.
pub struct StatusBar {
    is_updating: bool,
    _sub: [Subscription; 3],
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
        ];
        Self {
            _sub,
            is_updating: false,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            StatusBarMsg::SetIsUpdating(is_updating) => {
                self.is_updating = is_updating;
                true
            }
            StatusBarMsg::TableStatsChanged => true,
            StatusBarMsg::Reset(all) => {
                ctx.props().on_reset.emit(all);
                false
            }
            StatusBarMsg::Export(flat) => {
                let session = ctx.props().session.clone();
                spawn_local(async move {
                    session.download_as_csv(flat).await.expect("Export failed");
                });

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
        let is_updating_class_name = if self.is_updating { "updating" } else { " " };
        let reset = ctx
            .link()
            .callback(|event: MouseEvent| StatusBarMsg::Reset(event.shift_key()));
        let export = ctx
            .link()
            .callback(|event: MouseEvent| StatusBarMsg::Export(event.shift_key()));
        let copy = ctx
            .link()
            .callback(|event: MouseEvent| StatusBarMsg::Copy(event.shift_key()));

        html! {
            <div id={ ctx.props().id.clone() } class={ is_updating_class_name }>
                <div class="section">
                    <span id="status" class={ class_name }></span>
                </div>
                <div class="section">
                    <span id="reset" class="button" onmousedown={ reset }>
                        <span>{ "Reset" }</span>
                    </span>
                    <span id="export" class="button" onmousedown={ export }>
                        <span>{ "Export" }</span>
                    </span>
                    <span id="copy" class="button" onmousedown={ copy }>
                        <span>{ "Copy" }</span>
                    </span>
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
