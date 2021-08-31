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
use crate::utils::WeakComponentLink;

use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct StatusBarProps {
    pub id: String,
    pub on_reset: Callback<()>,
    pub session: Session,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakComponentLink<StatusBar>,
}

pub enum StatusBarMsg {
    Reset,
    Export(bool),
    Copy(bool),
    TableStatsChanged,
}

/// A toolbar with buttons, and `Table` & `View` status information.
pub struct StatusBar {
    link: ComponentLink<Self>,
    props: StatusBarProps,
    _sub: Subscription,
}

impl Component for StatusBar {
    type Message = StatusBarMsg;
    type Properties = StatusBarProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        enable_weak_link_test!(props, link);
        let cb = link.callback(|_| StatusBarMsg::TableStatsChanged);
        let _sub = props.session.on_stats.add_listener(cb);
        Self { link, props, _sub }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            StatusBarMsg::TableStatsChanged => true,
            StatusBarMsg::Reset => {
                self.props.on_reset.emit(());
                false
            }
            StatusBarMsg::Export(flat) => {
                let session = self.props.session.clone();
                spawn_local(async move {
                    session.download_as_csv(flat).await.expect("Export failed");
                });

                false
            }
            StatusBarMsg::Copy(flat) => {
                let session = self.props.session.clone();
                spawn_local(async move {
                    session.copy_to_clipboard(flat).await.expect("Copy failed");
                });

                false
            }
        }
    }

    fn change(&mut self, props: Self::Properties) -> ShouldRender {
        self.props = props;
        false
    }

    fn view(&self) -> Html {
        let stats = self.props.session.get_table_stats();
        let class_name = self.status_class_name(&stats);
        let reset = self.link.callback(|_| StatusBarMsg::Reset);
        let export = self
            .link
            .callback(|event: MouseEvent| StatusBarMsg::Export(event.shift_key()));
        let copy = self
            .link
            .callback(|event: MouseEvent| StatusBarMsg::Copy(event.shift_key()));

        html! {
            <div id={ self.props.id.clone() }>
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
