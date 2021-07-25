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

#[derive(Properties, Clone)]
pub struct DropDownProps<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
    T::Err: Clone + Debug + 'static,
{
    pub values: Vec<T>,
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
}

impl<T> Component for DropDown<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
    T::Err: Clone + Debug + 'static,
{
    type Message = ();
    type Properties = DropDownProps<T>;

    fn create(props: Self::Properties, _link: ComponentLink<Self>) -> Self {
        DropDown {
            props,
            select_ref: NodeRef::default(),
        }
    }

    fn update(&mut self, _msg: Self::Message) -> ShouldRender {
        false
    }

    fn change(&mut self, props: Self::Properties) -> ShouldRender {
        let should_render = self.props != props;
        self.props = props;
        should_render
    }

    // Annoyingly, `<select>` cannot be updated from its HTML alone.
    fn rendered(&mut self, _first_render: bool) {
        self.select_ref
            .cast::<web_sys::HtmlSelectElement>()
            .unwrap()
            .set_value(&format!("{}", self.props.selected));
    }

    fn view(&self) -> Html {
        let callback = self.props.on_select.reform(|data: ChangeData| match data {
            ChangeData::Select(e) => T::from_str(e.value().as_str()).unwrap(),
            ChangeData::Value(x) => T::from_str(x.as_str()).unwrap(),
            ChangeData::Files(_) => panic!("No idea ..."),
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

        html! {
            <select
                id={ self.props.id }
                class={ class }
                style = { style }
                ref={ self.select_ref.clone() }
                onchange={callback}>
                {
                    for self.props.values.iter().map(|value| {
                        let selected = *value == self.props.selected;
                        html! {
                            <option
                                selected={ selected }
                                value={ format!("{}", value) }>

                                { format!("{}", value) }
                            </option>
                        }
                    })
                }
            </select>
        }
    }
}
