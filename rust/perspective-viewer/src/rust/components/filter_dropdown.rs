////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::session::Session;

use web_sys::*;
use yew::prelude::*;

static CSS: &str = include_str!("../../../dist/css/filter-dropdown.css");

pub enum FilterDropDownMsg {
    SetPos(i32, i32),
    SetValues(Vec<String>),
    ItemDown,
    ItemUp,
    ItemSelect,
}

#[derive(Properties, Clone)]
pub struct FilterDropDownProps {
    pub session: Session,
    pub on_select: Callback<String>,
}

pub struct FilterDropDown {
    top: i32,
    left: i32,
    values: Option<Vec<String>>,
    selected: usize,
    props: FilterDropDownProps,
    // link: ComponentLink<Self>,
}

impl Component for FilterDropDown {
    type Message = FilterDropDownMsg;
    type Properties = FilterDropDownProps;

    fn create(props: Self::Properties, _link: ComponentLink<Self>) -> Self {
        FilterDropDown {
            top: 0,
            left: 0,
            values: Some(vec![]),
            selected: 0,
            props,
            // link,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            FilterDropDownMsg::SetPos(top, left) => {
                self.top = top;
                self.left = left;
                true
            }
            FilterDropDownMsg::SetValues(values) => {
                self.values = Some(values);
                self.selected = 0;
                true
            }
            FilterDropDownMsg::ItemSelect => {
                if let Some(ref values) = self.values {
                    match values.get(self.selected) {
                        None => {
                            console::error_1(&"Selected out-of-bounds".into());
                            false
                        }
                        Some(x) => {
                            self.props.on_select.emit(x.clone());
                            false
                        }
                    }
                } else {
                    console::error_1(&"No Values".into());
                    false
                }
            }
            FilterDropDownMsg::ItemDown => {
                self.selected += 1;
                if let Some(ref values) = self.values {
                    if self.selected >= values.len() {
                        self.selected = 0;
                    };
                };

                true
            }
            FilterDropDownMsg::ItemUp => {
                if let Some(ref values) = self.values {
                    if self.selected < 1 {
                        self.selected = values.len();
                    }
                }

                self.selected -= 1;
                true
            }
        }
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        false
    }

    fn view(&self) -> Html {
        let body = if let Some(ref values) = self.values {
            if !values.is_empty() {
                values
                .iter()
                .enumerate()
                .map(|(idx, value)| {
                    let click = self.props.on_select.reform({
                        let value = value.clone();
                        move |_: MouseEvent| value.clone()
                    });

                    if idx == self.selected {
                        html! {
                            <span onmousedown={ click }class="selected">{ value }</span>
                        }
                    } else {
                        html! {
                            <span onmousedown={ click }>{ value }</span>
                        }
                    }
                })
                .collect::<Html>()
            } else {
                html! {
                    <span class="no-results">{ "No Completions" }</span>
                }
            }
        } else {
            html! {}
        };

        html! {
            <>
                <style>
                    { &CSS }
                    { format!(":host{{left:{}px;top:{}px;}}", self.left, self.top) }
                </style>
                { body }
            </>
        }
    }
}
