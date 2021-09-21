////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::fmt::Debug;
use std::fmt::Display;
use std::str::FromStr;
use yew::prelude::*;

#[derive(Clone, PartialEq)]
pub enum DropDownItem<T> {
    Option(T),
    OptGroup(&'static str, Vec<T>),
}

pub enum DropDownMsg<T> {
    SelectedChanged(T),
}

#[derive(Properties, Clone)]
pub struct DropDownProps<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
    T::Err: Clone + Debug + 'static,
{
    pub values: Vec<DropDownItem<T>>,
    pub selected: T,
    pub on_select: Callback<T>,

    #[prop_or_default]
    pub id: Option<&'static str>,

    #[prop_or_default]
    pub auto_resize: bool,

    #[prop_or_default]
    pub class: Option<String>,
}

impl<T> PartialEq for DropDownProps<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
    T::Err: Clone + Debug + 'static,
{
    fn eq(&self, rhs: &Self) -> bool {
        self.selected == rhs.selected && self.values == rhs.values
    }
}

/// A `<select>` HTML elements, lifted to support parameterization over a set of
/// values of a type `T`.
pub struct DropDown<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
    T::Err: Clone + Debug + 'static,
{
    props: DropDownProps<T>,
    select_ref: NodeRef,
    link: ComponentLink<Self>,
}

impl<T> Component for DropDown<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
    T::Err: Clone + Debug + 'static,
{
    type Message = DropDownMsg<T>;
    type Properties = DropDownProps<T>;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        DropDown {
            props,
            link,
            select_ref: NodeRef::default(),
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        let DropDownMsg::SelectedChanged(x) = msg;
        self.props.selected = x;
        self.props.on_select.emit(self.props.selected.clone());
        true
    }

    fn change(&mut self, props: Self::Properties) -> ShouldRender {
        let should_render = self.props != props;
        self.props = props;
        should_render
    }

    // Annoyingly, `<select>` cannot be updated from its HTML alone.
    fn rendered(&mut self, _first_render: bool) {
        if let Some(elem) = self.select_ref.cast::<web_sys::HtmlSelectElement>() {
            elem.set_value(&format!("{}", self.props.selected))
        }
    }

    fn view(&self) -> Html {
        let callback = self.link.callback(|data: ChangeData| {
            DropDownMsg::SelectedChanged(match data {
                ChangeData::Select(e) => T::from_str(e.value().as_str()).unwrap(),
                ChangeData::Value(x) => T::from_str(x.as_str()).unwrap(),
                ChangeData::Files(_) => panic!("No idea ..."),
            })
        });

        let style = if self.props.auto_resize {
            let estimate = format!("{}", self.props.selected).len() * 8 + 18;
            Some(format!("width:{}px", estimate))
        } else {
            None
        };

        let class = if let Some(class) = &self.props.class {
            format!("noselect {}", class)
        } else {
            "noselect".to_owned()
        };

        let is_group_selected =
            !self.props.values.iter().any(
                |x| matches!(x, DropDownItem::Option(y) if *y == self.props.selected),
            );

        let select = html! {
            <select
                id={ self.props.id }
                class={ class }
                style = { style }
                ref={ self.select_ref.clone() }
                onchange={callback}>
                {
                    for self.props.values.iter().map(|value| match value {
                        DropDownItem::Option(value) => {
                            let selected = *value == self.props.selected;
                            html! {
                                <option
                                    selected={ selected }
                                    value={ format!("{}", value) }>
                                    { format!("{}", value) }
                                </option>
                            }
                        },
                        DropDownItem::OptGroup(name, group) => html! {
                            <optgroup label={ name.to_owned() }>
                            {
                                for group.iter().map(|value| {
                                    let selected =
                                        *value == self.props.selected;

                                    let label = format!("{}", value)
                                        .strip_prefix(name)
                                        .unwrap()
                                        .trim()
                                        .to_owned();

                                    html! {
                                        <option
                                            selected={ selected }
                                            value={ format!("{}", value) }>
                                            { label }
                                        </option>
                                    }
                                })
                            }
                            </optgroup>
                        }
                    })
                }
            </select>
        };

        if is_group_selected {
            html! {
                <>
                    <label>{ "weighted mean" }</label>
                    <div class="dropdown-width-container">
                        { select }
                    </div>
                </>
            }
        } else {
            html! {
                <div class="dropdown-width-container">
                    { select }
                </div>
            }
        }
    }
}
