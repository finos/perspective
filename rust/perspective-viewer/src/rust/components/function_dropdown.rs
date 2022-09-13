////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::modal::*;
use crate::exprtk::CompletionItemSuggestion;
use crate::utils::WeakScope;
use crate::*;

use web_sys::*;
use yew::prelude::*;

static CSS: &str = include_str!("../../../build/css/function-dropdown.css");

pub enum FunctionDropDownMsg {
    SetValues(Vec<CompletionItemSuggestion>),
    SetCallback(Callback<CompletionItemSuggestion>),
    ItemDown,
    ItemUp,
    ItemSelect,
}

pub struct FunctionDropDown {
    values: Option<Vec<CompletionItemSuggestion>>,
    selected: usize,
    on_select: Option<Callback<CompletionItemSuggestion>>,
}

#[derive(Properties, PartialEq)]
pub struct FunctionDropDownProps {
    #[prop_or_default]
    pub weak_link: WeakScope<FunctionDropDown>,
}

impl ModalLink<FunctionDropDown> for FunctionDropDownProps {
    fn weak_link(&self) -> &'_ WeakScope<FunctionDropDown> {
        &self.weak_link
    }
}

impl Component for FunctionDropDown {
    type Message = FunctionDropDownMsg;
    type Properties = FunctionDropDownProps;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        FunctionDropDown {
            values: Some(vec![]),
            selected: 0,
            on_select: None,
        }
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            FunctionDropDownMsg::SetCallback(callback) => {
                self.on_select = Some(callback);
                false
            }
            FunctionDropDownMsg::SetValues(values) => {
                self.values = Some(values);
                self.selected = 0;
                true
            }
            FunctionDropDownMsg::ItemSelect => {
                if let Some(ref values) = self.values {
                    match values.get(self.selected) {
                        None => {
                            console::error_1(&"Selected out-of-bounds".into());
                            false
                        }
                        Some(x) => {
                            self.on_select.as_ref().unwrap().emit(*x);
                            false
                        }
                    }
                } else {
                    console::error_1(&"No Values".into());
                    false
                }
            }
            FunctionDropDownMsg::ItemDown => {
                self.selected += 1;
                if let Some(ref values) = self.values {
                    if self.selected >= values.len() {
                        self.selected = 0;
                    };
                };

                true
            }
            FunctionDropDownMsg::ItemUp => {
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

    fn changed(&mut self, _ctx: &Context<Self>) -> bool {
        false
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        let body = html! {
            if let Some(ref values) = self.values {
                if !values.is_empty() {
                    {
                        for values
                            .iter()
                            .enumerate()
                            .map(|(idx, value)| {
                                let click = self.on_select.as_ref().unwrap().reform({
                                    let value = *value;
                                    move |_: MouseEvent| value
                                });

                                html! {
                                    if idx == self.selected {
                                        <div onmousedown={ click } class="selected">
                                            <span style="font-weight:500">{ value.label }</span>
                                            <br/>
                                            <span style="padding-left:12px">{ value.documentation }</span>
                                        </div>
                                    } else {
                                        <div onmousedown={ click }>
                                            <span style="font-weight:500">{ value.label }</span>
                                            <br/>
                                            <span style="padding-left:12px">{ value.documentation }</span>
                                        </div>
                                    }
                                }
                            })
                    }
                }
            }
        };

        html_template! {
            <style>
                { &CSS }
            </style>
            { body }
        }
    }
}
