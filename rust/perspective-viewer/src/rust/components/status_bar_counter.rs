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

#[derive(Properties, Clone)]
pub struct StatusBarRowsCounterProps {
    pub stats: Option<TableStats>,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakComponentLink<StatusBarRowsCounter>,
}

/// A label widget which displays a row count and a "projection" count, the number of
/// rows in the `View` which includes aggregate rows.
pub struct StatusBarRowsCounter {
    stats: Option<TableStats>,
}

impl Component for StatusBarRowsCounter {
    type Message = ();
    type Properties = StatusBarRowsCounterProps;

    fn create(props: Self::Properties, _link: ComponentLink<Self>) -> Self {
        enable_weak_link_test!(props, _link);
        StatusBarRowsCounter { stats: props.stats }
    }

    fn update(&mut self, _msg: Self::Message) -> ShouldRender {
        false
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        self.stats = _props.stats;
        true
    }

    fn view(&self) -> Html {
        match &self.stats {
            Some(TableStats {
                num_rows: Some(num_rows),
                virtual_rows: Some(virtual_rows),
                is_pivot: true,
            }) => {
                let vrows = virtual_rows.to_formatted_string(&Locale::en);
                let nrows = num_rows.to_formatted_string(&Locale::en);
                html! {
                    <>
                        <span>{ format!("{} ", vrows) }</span>
                        <span class="icon">{ "arrow_back" }</span>
                        <span>{ format!(" {} rows", nrows) }</span>
                    </>
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
