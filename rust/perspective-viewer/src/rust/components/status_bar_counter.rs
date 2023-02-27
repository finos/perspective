////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use num_format::{Locale, ToFormattedString};
use yew::prelude::*;

use crate::session::ViewStats;
#[cfg(test)]
use crate::utils::*;
use crate::*;

#[derive(Properties)]
pub struct StatusBarRowsCounterProps {
    pub stats: Option<ViewStats>,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakScope<StatusBarRowsCounter>,
}

impl PartialEq for StatusBarRowsCounterProps {
    fn eq(&self, other: &Self) -> bool {
        self.stats == other.stats
    }
}

/// A label widget which displays a row count and a "projection" count, the
/// number of rows in the `View` which includes aggregate rows.
pub struct StatusBarRowsCounter {}

impl Component for StatusBarRowsCounter {
    type Message = ();
    type Properties = StatusBarRowsCounterProps;

    fn create(_ctx: &Context<Self>) -> Self {
        enable_weak_link_test!(_ctx.props(), _ctx.link());
        StatusBarRowsCounter {}
    }

    fn update(&mut self, _ctx: &Context<Self>, _msg: Self::Message) -> bool {
        false
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        match &ctx.props().stats {
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
                let vrows = vr.to_formatted_string(&Locale::en);
                let nrows = tr.to_formatted_string(&Locale::en);
                let vcols = vc.to_formatted_string(&Locale::en);
                let ncols = tc.to_formatted_string(&Locale::en);
                html_template! {
                    <span>{ format!("{} ({}) x {} ({})", vrows, nrows, vcols, ncols) }</span>
                }
            }

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
                let vrows = vr.to_formatted_string(&Locale::en);
                let nrows = tr.to_formatted_string(&Locale::en);
                let vcols = vc.to_formatted_string(&Locale::en);
                html_template! {
                    <span>{ format!("{} ({}) x {}", vrows, nrows, vcols) }</span>
                }
            }

            Some(ViewStats {
                num_table_cells: Some((_, tc)),
                num_view_cells: Some((vr, vc)),
                ..
            }) if vc != tc => {
                let vrows = vr.to_formatted_string(&Locale::en);
                let vcols = vc.to_formatted_string(&Locale::en);
                let ncols = tc.to_formatted_string(&Locale::en);
                html_template! {
                    <span>{ format!("{} x {} ({})", vrows, vcols, ncols) }</span>
                }
            }

            Some(ViewStats {
                num_table_cells: Some((tr, tc)),
                ..
            }) => {
                let nrows = tr.to_formatted_string(&Locale::en);
                let ncols = tc.to_formatted_string(&Locale::en);
                html! {
                    <span>
                        { format!("{} x {}", nrows, ncols) }
                    </span>
                }
            }
            Some(ViewStats {
                num_table_cells: None,
                ..
            }) => html! {
                <span></span>
            },
            None => html! {
                <span></span>
            },
        }
    }
}
