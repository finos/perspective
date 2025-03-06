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

use perspective_client::*;
use yew::prelude::*;

use crate::session::{Session, ViewStats};
use crate::utils::{AddListener, ToFormattedString};

#[derive(Properties, PartialEq)]
pub struct StatusBarRowsCounterProps {
    pub session: Session,
}

#[function_component]
pub fn StatusBarRowsCounter(props: &StatusBarRowsCounterProps) -> Html {
    let stats = use_state_eq(|| props.session.get_table_stats());
    use_effect_with(
        (props.session.clone(), stats.setter()),
        |(session, set_stats)| {
            let sub = session.stats_changed.add_listener({
                clone!(session, set_stats);
                move |_| set_stats.set(session.get_table_stats())
            });

            || drop(sub)
        },
    );

    match props.session.get_table_stats() {
        Some(
            ViewStats {
                num_table_cells: Some((tr, tc)),
                num_view_cells: Some((vr, vc)),
                is_group_by: true,
                ..
            }
            | ViewStats {
                num_table_cells: Some((tr, tc)),
                num_view_cells: Some((vr, vc)),
                is_filtered: true,
                ..
            },
        ) if vc != tc => {
            let vrows = vr.to_formatted_string();
            let nrows = tr.to_formatted_string();
            let vcols = vc.to_formatted_string();
            let ncols = tc.to_formatted_string();
            html! {
                <span id="rows">
                    { vrows }
                    <span>{ format!(" ({}) x ", nrows) }</span>
                    { vcols }
                    <span>{ format!(" ({})", ncols) }</span>
                </span>
            }
        },

        Some(
            ViewStats {
                num_table_cells: Some((tr, _)),
                num_view_cells: Some((vr, vc)),
                is_group_by: true,
                ..
            }
            | ViewStats {
                num_table_cells: Some((tr, _)),
                num_view_cells: Some((vr, vc)),
                is_filtered: true,
                ..
            },
        ) => {
            let vrows = vr.to_formatted_string();
            let nrows = tr.to_formatted_string();
            let vcols = vc.to_formatted_string();
            html! {
                <span id="rows">{ vrows }<span>{ format!(" ({}) x ", nrows) }</span>{ vcols }</span>
            }
        },

        Some(ViewStats {
            num_table_cells: Some((_, tc)),
            num_view_cells: Some((vr, vc)),
            ..
        }) if vc != tc => {
            let vrows = vr.to_formatted_string();
            let vcols = vc.to_formatted_string();
            let ncols = tc.to_formatted_string();
            html! {
                <span id="rows">
                    { vrows }
                    <span>{ " x " }</span>
                    { vcols }
                    <span>{ format!(" ({})", ncols) }</span>
                </span>
            }
        },

        Some(ViewStats {
            num_table_cells: Some((tr, tc)),
            ..
        }) => {
            let nrows = tr.to_formatted_string();
            let ncols = tc.to_formatted_string();
            html! { <span id="rows">{ nrows }<span>{ " x " }</span>{ ncols }</span> }
        },
        Some(ViewStats {
            num_table_cells: None,
            ..
        }) => html! { <span /> },
        None => html! { <span /> },
    }
}

// /// A label widget which displays a row count and a "projection" count, the
// /// number of rows in the `View` which includes aggregate rows.
// pub struct StatusBarRowsCounter {}

// impl Component for StatusBarRowsCounter {
//     type Message = ();
//     type Properties = ();

//     fn create(_ctx: &Context<Self>) -> Self {
//         Self {}
//     }

//     fn update(&mut self, _ctx: &Context<Self>, _msg: Self::Message) -> bool {
//         false
//     }

//     fn view(&self, ctx: &Context<Self>) -> Html {
//         match &ctx.props().stats {
//             Some(
//                 ViewStats {
//                     num_table_cells: Some((tr, tc)),
//                     num_view_cells: Some((vr, vc)),
//                     is_group_by: true,
//                     ..
//                 }
//                 | ViewStats {
//                     num_table_cells: Some((tr, tc)),
//                     num_view_cells: Some((vr, vc)),
//                     is_filtered: true,
//                     ..
//                 },
//             ) if vc != tc => {
//                 let vrows = vr.to_formatted_string();
//                 let nrows = tr.to_formatted_string();
//                 let vcols = vc.to_formatted_string();
//                 let ncols = tc.to_formatted_string();
//                 html! {
//                     <span id="rows">
//                         { vrows }
//                         <span>{ format!(" ({}) x ", nrows) }</span>
//                         { vcols }
//                         <span>{ format!(" ({})", ncols) }</span>
//                     </span>
//                 }
//             },

//             Some(
//                 ViewStats {
//                     num_table_cells: Some((tr, _)),
//                     num_view_cells: Some((vr, vc)),
//                     is_group_by: true,
//                     ..
//                 }
//                 | ViewStats {
//                     num_table_cells: Some((tr, _)),
//                     num_view_cells: Some((vr, vc)),
//                     is_filtered: true,
//                     ..
//                 },
//             ) => {
//                 let vrows = vr.to_formatted_string();
//                 let nrows = tr.to_formatted_string();
//                 let vcols = vc.to_formatted_string();
//                 html! {
//                     <span id="rows">
//                         { vrows }
//                         <span>{ format!(" ({}) x ", nrows) }</span>
//                         { vcols }
//                     </span>
//                 }
//             },

//             Some(ViewStats {
//                 num_table_cells: Some((_, tc)),
//                 num_view_cells: Some((vr, vc)),
//                 ..
//             }) if vc != tc => {
//                 let vrows = vr.to_formatted_string();
//                 let vcols = vc.to_formatted_string();
//                 let ncols = tc.to_formatted_string();
//                 html! {
//                     <span id="rows">
//                         { vrows }
//                         <span>{ " x " }</span>
//                         { vcols }
//                         <span>{ format!(" ({})", ncols) }</span>
//                     </span>
//                 }
//             },

//             Some(ViewStats {
//                 num_table_cells: Some((tr, tc)),
//                 ..
//             }) => {
//                 let nrows = tr.to_formatted_string();
//                 let ncols = tc.to_formatted_string();
//                 html! { <span id="rows">{ nrows }<span>{ " x " }</span>{
// ncols }</span> }             },
//             Some(ViewStats {
//                 num_table_cells: None,
//                 ..
//             }) => html! { <span /> },
//             None => html! { <span /> },
//         }
//     }
// }
