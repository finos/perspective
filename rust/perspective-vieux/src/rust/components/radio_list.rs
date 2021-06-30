////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::*;

use std::fmt::Display;
use std::str::FromStr;
use yew::prelude::*;

#[cfg(test)]
use crate::utils::WeakComponentLink;

// The type constraints on this component are boilerplate and will be alias-able
// in a [future rust version](https://doc.rust-lang.org/nightly/unstable-book/language-features/trait-alias.html)
// It will look like this:
//
// ```
// #![feature(trait_alias)]
// trait Selectable = Clone + Display + FromStr + PartialEq + 'static;
// ```
//
// Currently, you can get similar behavior with a new trait, but it will require
// an empty `impl Selectable for X {}` for all implementing types.
//
// ```
// trait Selectable: Clone + Display + FromStr + PartialEq + 'static {}
// ```

#[derive(Properties, Clone, Default)]
pub struct RadioListProps<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    /// This component's `Html` children, which will become list items.
    pub children: Children,

    /// The corresponding `T` values for each child in `children` (must be the
    /// same length as `children`).
    pub values: Vec<T>,

    /// Whether this control is enabled.
    pub disabled: bool,

    /// A callback which fires the selected `T` on change.
    pub on_change: Callback<T>,

    /// The initial selection.
    /// TODO this could easily be made optional.
    pub selected: T,

    #[prop_or_default]
    pub class: Option<&'static str>,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakComponentLink<RadioList<T>>,
}

impl<T> RadioListProps<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    /// Validate a `RadioListProps`'s dimensions to make sure the no runtime errors
    /// can occur when looking up values.
    fn validate(&self) {
        assert_eq!(self.children.len(), self.values.len());
        assert!(self.values.iter().any(|x| *x == self.selected));
    }
}

pub enum RadioListMsg {
    Change(String),
}

/// A `RadioList` is a vertical collection of components with radio buttons,
/// only one of which can be selected at a time.  The generic parameter `T`
/// is the selectable type (typically an enum), which must be serializable to
/// and from `String` (via `Display` and `FromStr`, respectively) so it can be
/// incorporated into the DOM `value` attribute.
///
/// # Examples
///
/// ```
/// html! {
///     <RadioList<u32>
///         disabled=false
///         values={ vec!(1, 2, 3) }
///         selected={ 2 }
///         on_change={ callback } >
///     
///         <span>{ "One" }</span>
///         <span>{ "Two" }</span>
///         <span>{ "Three" }</span>
///     
///     </RadioList<u32>>
/// }
pub struct RadioList<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    link: ComponentLink<Self>,
    props: RadioListProps<T>,
}

impl<T> Component for RadioList<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    type Message = RadioListMsg;
    type Properties = RadioListProps<T>;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        props.validate();
        enable_weak_link_test!(props, link);
        Self { props, link }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            RadioListMsg::Change(value) => {
                if let Ok(x) = T::from_str(&value) {
                    self.props.selected = x.clone();
                    self.props.on_change.emit(x);
                }
            }
        };
        false
    }

    fn change(&mut self, props: Self::Properties) -> ShouldRender {
        props.validate();
        self.props = props;
        true
    }

    fn view(&self) -> Html {
        let on_change = self
            .link
            .callback(move |event: InputData| RadioListMsg::Change(event.value));

        let class = match self.props.class {
            Some(x) => format!("radio-list-item {}", x),
            None => "radio-list-item".to_owned(),
        };

        self.props
            .children
            .iter()
            .enumerate()
            .map(|(idx, child)| self.render_item(idx, child, &class, on_change.clone()))
            .collect::<Html>()
    }
}

impl<T> RadioList<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    /// Render a single row of the `RadioList`.
    ///
    /// # Arguments
    /// * `idx` - The index of this row.
    /// * `child` - The `Html` row content.
    /// * `class` - The `class` attribute string.
    /// * `on_change` - The callback when this `<input>` changes.
    fn render_item(
        &self,
        idx: usize,
        child: Html,
        class: &str,
        on_change: Callback<InputData>,
    ) -> Html {
        html! {
            <div class={ class.to_string() }>
                <input
                    id={ format!("radio-list-{}", idx) }
                    name="radio-list"
                    type="radio"
                    value={ self.props.values[idx].clone() }
                    class="parameter"
                    oninput={ on_change }
                    disabled=self.props.disabled
                    checked={ self.props.selected == self.props.values[idx] } />
                { child }
            </div>
        }
    }
}
