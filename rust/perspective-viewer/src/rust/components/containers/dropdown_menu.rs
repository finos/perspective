////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::select::SelectItem;
use crate::*;
use std::marker::PhantomData;
use std::rc::Rc;
use web_sys::*;
use yew::prelude::*;

pub static CSS: &str = include_str!("../../../../build/css/dropdown-menu.css");

pub type DropDownMenuItem<T> = SelectItem<T>;

pub type DropDownMenuMsg = ();

#[derive(Properties, PartialEq)]
pub struct DropDownMenuProps<T>
where
    T: Into<Html> + Clone + PartialEq + 'static,
{
    pub values: Rc<Vec<DropDownMenuItem<T>>>,
    pub callback: Callback<T>,
}

pub struct DropDownMenu<T>
where
    T: Into<Html> + Clone + PartialEq + 'static,
{
    _props: PhantomData<T>,
}

impl<T> Component for DropDownMenu<T>
where
    T: Into<Html> + Clone + PartialEq + 'static,
{
    type Message = DropDownMenuMsg;
    type Properties = DropDownMenuProps<T>;

    fn create(_ctx: &Context<Self>) -> Self {
        DropDownMenu {
            _props: Default::default(),
        }
    }

    fn update(&mut self, _ctx: &Context<Self>, _msg: Self::Message) -> bool {
        false
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let values = &ctx.props().values;
        let body = if !values.is_empty() {
            values
                .iter()
                .map(|value| match value {
                    DropDownMenuItem::Option(x) => {
                        let click = ctx.props().callback.reform({
                            let value = x.clone();
                            move |_: MouseEvent| value.clone()
                        });

                        html! {
                            <span onmousedown={ click }class="selected">
                                { x.clone().into() }
                            </span>
                        }
                    }
                    DropDownMenuItem::OptGroup(name, xs) => {
                        html_template! {
                            <span class="dropdown-group-label">{ name }</span>
                            <div class="dropdown-group-container">
                                {
                                    xs.iter().map(|x| {
                                        let click = ctx.props().callback.reform({
                                            let value = x.clone();
                                            move |_: MouseEvent| value.clone()
                                        });
                                        html! {
                                            <span onmousedown={ click }>
                                                { x.clone().into() }
                                            </span>
                                        }
                                    }).collect::<Html>()
                                }
                            </div>
                        }
                    }
                })
                .collect::<Html>()
        } else {
            html! {
                <span class="no-results">{ "No Completions" }</span>
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
