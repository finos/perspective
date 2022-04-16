////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::session::TableStats;
use crate::*;

#[cfg(test)]
use crate::utils::*;

use num_format::{Locale, ToFormattedString};
use yew::prelude::*;

#[derive(Properties)]
pub struct StatusBarRowsCounterProps {
    pub stats: Option<TableStats>,

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
            Some(TableStats {
                num_rows: Some(num_rows),
                virtual_rows: Some(virtual_rows),
                is_pivot: true,
            }) => {
                let vrows = virtual_rows.to_formatted_string(&Locale::en);
                let nrows = num_rows.to_formatted_string(&Locale::en);
                html_template! {
                    <span>{ format!("{} ", vrows) }</span>
                    <span id="counter-arrow" class="icon"></span>
                    <span>{ format!(" {} rows", nrows) }</span>
                }
            }

            Some(TableStats {
                num_rows: Some(num_rows),
                ..
            }) => html! {
                <span>
                    { format!("{} rows", &num_rows.to_formatted_string(&Locale::en)) }
                </span>
            },

            Some(TableStats { num_rows: None, .. }) => html! {
                <span>{ "- rows" }</span>
            },

            None => html! {
                <span>{ "- rows" }</span>
            },
        }
    }
}
