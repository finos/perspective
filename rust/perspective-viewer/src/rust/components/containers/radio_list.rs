// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

use std::fmt::Display;
use std::str::FromStr;

use wasm_bindgen::JsCast;
use yew::prelude::*;

use super::radio_list_item::*;
use crate::components::style::LocalStyle;
#[cfg(test)]
use crate::utils::WeakScope;
use crate::*;

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

#[derive(Properties, Default)]
pub struct RadioListProps<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    /// This component's `Html` children, which will become list items.
    pub children: ChildrenWithProps<RadioListItem<T>>,

    /// Whether this control is enabled.
    pub disabled: bool,

    /// A callback which fires the selected `T` on change.
    pub on_change: Callback<T>,

    /// The initial selection.
    pub selected: Option<T>,

    #[prop_or_default]
    pub class: Option<&'static str>,

    #[prop_or_default]
    pub name: Option<String>,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakScope<RadioList<T>>,
}

impl<T> PartialEq for RadioListProps<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    fn eq(&self, other: &Self) -> bool {
        self.children == other.children
            && self.disabled == other.disabled
            && self.selected == other.selected
            && self.class == other.class
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
    selected: Option<T>,
}

impl<T> Component for RadioList<T>
where
    T: Clone + Display + FromStr + PartialEq + 'static,
{
    type Message = RadioListMsg;
    type Properties = RadioListProps<T>;

    fn create(ctx: &Context<Self>) -> Self {
        enable_weak_link_test!(ctx.props(), ctx.link());
        Self {
            selected: ctx.props().selected.clone(),
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            RadioListMsg::Change(value) => {
                if let Ok(x) = T::from_str(&value) {
                    self.selected = Some(x.clone());
                    ctx.props().on_change.emit(x);
                }
            },
        };
        false
    }

    fn changed(&mut self, ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        self.selected = ctx.props().selected.clone();
        true
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let on_change = ctx.link().callback(move |event: InputEvent| {
            RadioListMsg::Change(
                event
                    .target()
                    .unwrap()
                    .unchecked_into::<web_sys::HtmlInputElement>()
                    .value(),
            )
        });

        let class = match ctx.props().class {
            Some(x) => format!("radio-list-item {}", x),
            None => "radio-list-item".to_owned(),
        };

        html! {
            <>
                <LocalStyle href={css!("containers/radio-list")} />
                { ctx.props()
              .children
              .iter()
              .enumerate()
              .map(|(idx, child)| {
                  self.render_item(ctx, idx, child, &class, on_change.clone(), &self.selected)
              })
              .collect::<Html>() }
            </>
        }
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
        ctx: &Context<Self>,
        idx: usize,
        child: yew::virtual_dom::VChild<RadioListItem<T>>,
        class: &str,
        on_change: Callback<InputEvent>,
        selected: &Option<T>,
    ) -> Html {
        let val = child.props.value.clone();
        html! {
            <div
                class={class.to_string()}
            >
                <input
                    id={ format!("radio-list-{}", idx) }
                    name={ ctx.props().name.clone().unwrap_or("radio-list".to_string()) }
                    type="radio"
                    value={format!("{}", val)}
                    class="parameter"
                    oninput={ on_change }
                    disabled={ ctx.props().disabled }
                    checked={ selected.as_ref() == Some(&val) } />
                { child }
            </div>
        }
    }
}
