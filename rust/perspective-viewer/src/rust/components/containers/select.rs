////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::borrow::{Borrow, Cow};
use std::fmt::Display;

use wasm_bindgen::JsCast;
use yew::prelude::*;

#[derive(Clone, Eq, PartialEq)]
pub enum SelectItem<T> {
    Option(T),
    OptGroup(Cow<'static, str>, Vec<T>),
}

impl<T: Display> SelectItem<T> {
    pub fn name<'a>(&self) -> Cow<'a, str> {
        match self {
            Self::Option(x) => format!("{}", x).into(),
            Self::OptGroup(x, _) => x.clone(),
        }
    }
}

pub enum SelectMsg {
    SelectedChanged(i32),
}

#[derive(Properties)]
pub struct SelectProps<T>
where
    T: Clone + Display + PartialEq + 'static,
{
    pub values: Vec<SelectItem<T>>,
    pub selected: T,
    pub on_select: Callback<T>,

    #[prop_or_default]
    pub label: Option<&'static str>,

    #[prop_or_default]
    pub id: Option<&'static str>,

    #[prop_or_default]
    pub class: Option<String>,

    #[prop_or_default]
    pub wrapper_class: Option<String>,
}

impl<T> PartialEq for SelectProps<T>
where
    T: Clone + Display + PartialEq + 'static,
{
    fn eq(&self, rhs: &Self) -> bool {
        self.selected == rhs.selected && self.values == rhs.values
    }
}

/// A `<select>` HTML elements, lifted to support parameterization over a set of
/// values of a type `T`.
pub struct Select<T>
where
    T: Clone + Display + PartialEq + 'static,
{
    select_ref: NodeRef,
    selected: T,
}

fn find_nth<T>(mut count: i32, items: &[SelectItem<T>]) -> Option<&T> {
    for ref item in items.iter() {
        match item {
            SelectItem::Option(_) if count > 0 => {
                count -= 1;
            }
            SelectItem::OptGroup(_, items) if count >= items.len() as i32 => {
                count -= items.len() as i32;
            }
            SelectItem::OptGroup(_, items) => return items.get(count as usize),
            SelectItem::Option(x) => return Some(x),
        }
    }

    None
}

impl<T> Component for Select<T>
where
    T: Clone + Display + PartialEq + 'static,
{
    type Message = SelectMsg;
    type Properties = SelectProps<T>;

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            select_ref: NodeRef::default(),
            selected: _ctx.props().selected.clone(),
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        let SelectMsg::SelectedChanged(x) = msg;
        self.selected = find_nth(x, &ctx.props().values).unwrap().clone();
        ctx.props().on_select.emit(self.selected.clone());
        true
    }

    // The `<select>` has its own state not refelcted by `SelectProps`.
    fn changed(&mut self, ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        self.selected = ctx.props().selected.clone();
        true
    }

    // Annoyingly, `<select>` cannot be updated from its HTML alone.
    fn rendered(&mut self, _ctx: &Context<Self>, _first_render: bool) {
        if let Some(elem) = self.select_ref.cast::<web_sys::HtmlSelectElement>() {
            elem.set_value(&format!("{}", self.selected))
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let callback = ctx.link().callback(|event: Event| {
            let value = event
                .target()
                .unwrap()
                .unchecked_into::<web_sys::HtmlSelectElement>()
                .selected_index();
            SelectMsg::SelectedChanged(value)
        });

        let class = if let Some(class) = &ctx.props().class {
            format!("noselect {}", class)
        } else {
            "noselect".to_owned()
        };

        let is_group_selected = !ctx
            .props()
            .values
            .iter()
            .any(|x| matches!(x, SelectItem::Option(y) if *y == ctx.props().selected));

        let select = html! {
            <select
                id={ ctx.props().id }
                class={ class }
                ref={ &self.select_ref }
                onchange={callback}>
                {
                    for ctx.props().values.iter().map(|value| match value {
                        SelectItem::Option(value) => {
                            let selected = *value == ctx.props().selected;
                            html! {
                                <option
                                    key={ format!("{}", value) }
                                    selected={ selected }
                                    value={ format!("{}", value) }>
                                    { format!("{}", value) }
                                </option>
                            }
                        },
                        SelectItem::OptGroup(name, group) => html! {
                            <optgroup
                                key={ name.to_string() }
                                label={ name.to_string() }>
                                {
                                    for group.iter().map(|value| {
                                        let selected =
                                            *value == ctx.props().selected;

                                        let label = format!("{}", value);
                                        let category: &str = name.borrow();
                                        let label = label
                                            .strip_prefix(category)
                                            .unwrap_or(&label)
                                            .trim()
                                            .to_owned();

                                        html! {
                                            <option
                                                key={ format!("{}", value) }
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

        let wrapper_class = match &ctx.props().wrapper_class {
            Some(x) => classes!("dropdown-width-container", x),
            None => classes!("dropdown-width-container"),
        };

        html! {
            if is_group_selected && ctx.props().label.is_some() {
                <label>{ ctx.props().label.unwrap() }</label>
                <div
                    class={ wrapper_class }
                    data-value={ format!("{}", self.selected) }>
                    { select }
                </div>
            } else {
                <div
                    class={ wrapper_class }
                    data-value={ format!("{}", self.selected) }>
                    { select }
                </div>
            }
        }
    }
}
