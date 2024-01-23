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

use std::collections::HashMap;

use derivative::Derivative;
use indexmap::IndexMap;
use itertools::Itertools;
use web_sys::{HtmlInputElement, InputEvent};
use yew::virtual_dom::VChild;
use yew::{html, Callback, Children, ChildrenWithProps, Component, Html, Properties, TargetCast};

use crate::components::containers::radio_list::RadioList;
use crate::components::containers::radio_list_item::RadioListItemProps;
use crate::components::form::number_input::NumberInput;
use crate::config::{ColorMax, ColorMaxStringValue, ColorMode, ColumnStyleValue};
use crate::session::Session;
use crate::{clone, html_template, max};

#[derive(Properties, PartialEq, Derivative)]
#[derivative(Debug)]
pub struct ColorControlProps {
    pub label: Option<String>,
    pub modes: IndexMap<String, ColorMode>,
    pub on_update: Callback<(String, Option<ColumnStyleValue>)>,
    #[derivative(Debug = "ignore")]
    pub session: Session,
    pub column_name: String,
}
impl ColorControlProps {
    pub fn get_async_values(
        &self,
        ctx: &yew::Context<ColorControl>,
        values: HashMap<ColorMaxStringValue, Vec<String>>,
    ) {
        clone!(self.session, self.column_name);
        ctx.link().send_future_batch(async move {
            let view = session.get_view().unwrap();
            let min_max = view.get_min_max(&column_name).await.unwrap();
            let abs_max = max!(min_max.0.abs(), min_max.1.abs());
            let column_max = (abs_max * 100.).round() / 100.;
            let set_values = vec![ColorControlMsg::MaxStringValue((
                ColorMaxStringValue::Column,
                column_max,
            ))];

            let set_maxes = values
                .into_iter()
                .map(|(ty, labels)| match ty {
                    ColorMaxStringValue::Column => labels
                        .into_iter()
                        .map(|label| ColorControlMsg::MaxValue((label, Some(column_max))))
                        .collect_vec(),
                })
                .collect_vec()
                .concat();

            [set_values, set_maxes].concat()
        })
    }
}

#[derive(Debug, Clone)]
pub enum ColorControlMsg {
    Color((String, String, String)),
    MaxValue((String, Option<f64>)),
    CurrentMode(Option<String>),
    Enabled(bool),
    MaxStringValue((ColorMaxStringValue, f64)),
}

#[derive(Default, Debug, Clone)]
pub struct ModeData {
    colors: IndexMap<String, String>,
    max: Option<f64>,
}

#[derive(Default, Debug)]
pub struct ColorControl {
    mode_data: HashMap<String, ModeData>,
    enabled: bool,
    current_mode: Option<String>,
    column_max: f64,
}
impl ColorControl {
    // TODO: Add this to updates as appropriate
    pub fn send_to_plugin(ctx: &yew::prelude::Context<Self>) {
        todo!();
    }
}

impl Component for ColorControl {
    type Message = ColorControlMsg;
    type Properties = ColorControlProps;

    fn create(ctx: &yew::prelude::Context<Self>) -> Self {
        let mut values_to_update = HashMap::<_, Vec<String>>::new();
        let res = ctx
            .props()
            .modes
            .iter()
            .fold(Self::default(), |mut acc, (label, mode)| {
                let colors = mode.colors.clone();
                let max = mode.max.map(|max| match max {
                    ColorMax::String(max_type) => {
                        values_to_update
                            .entry(max_type)
                            .or_default()
                            .push(label.clone());
                        0.0
                    },
                    ColorMax::Number(n) => n,
                });
                acc.mode_data
                    .insert(label.to_string(), ModeData { colors, max });
                let enabled = acc.enabled || mode.default;
                let current_mode = if mode.default {
                    Some(label.to_owned())
                } else {
                    acc.current_mode
                };
                Self {
                    enabled,
                    current_mode,
                    ..acc
                }
            });
        tracing::info!("ColorControl::Create! {:?} => {:?}", ctx.props(), res);
        ctx.props().get_async_values(ctx, values_to_update);
        res
    }

    fn update(&mut self, _ctx: &yew::prelude::Context<Self>, msg: Self::Message) -> bool {
        tracing::info!("{msg:?}");
        match msg {
            ColorControlMsg::Color((mode, key, value)) => {
                if let Some(mode) = self.mode_data.get_mut(&mode) {
                    mode.colors.insert(key, value);
                } else {
                    tracing::error!("Invalid color change! ({:?}, {:?}, {:?})", mode, key, value);
                }

                false
            },
            ColorControlMsg::CurrentMode(mode) => {
                self.current_mode = mode;
                true
            },
            ColorControlMsg::Enabled(enabled) => {
                self.enabled = enabled;
                true
            },
            ColorControlMsg::MaxValue((mode, max)) => {
                if let Some(mode) = self.mode_data.get_mut(&mode) {
                    mode.max = max
                }
                false
            },
            ColorControlMsg::MaxStringValue((ty, val)) => {
                match ty {
                    ColorMaxStringValue::Column => {
                        self.column_max = val;
                        tracing::info!("ColorMaxStringValue::Column => {val}");
                    },
                }
                true
            },
        }
    }

    fn changed(
        &mut self,
        ctx: &yew::prelude::Context<Self>,
        _old_props: &Self::Properties,
    ) -> bool {
        ctx.props().get_async_values(ctx, todo!());
        true
    }

    fn view(&self, ctx: &yew::prelude::Context<Self>) -> Html {
        let modes = self
            .mode_data
            .clone()
            .into_iter()
            .map(|(mode_label, mode)| {
                let color_pickers = mode
                    .colors
                    .iter()
                    .map(|(color_label, color)| {
                        let mlabel = mode_label.clone();
                        let clabel = color_label.clone();
                        let oninput = ctx.link().callback(move |event: InputEvent| {
                            let value = event.target_unchecked_into::<HtmlInputElement>().value();
                            ColorControlMsg::Color((mlabel.clone(), clabel.clone(), value))
                        });
                        html_template! {
                            <span>{color_label.clone()}</span>
                            <input
                                class="parameter"
                                type="color"
                                value = { color.clone() }
                                {oninput} />
                        }
                    })
                    .collect_vec();

                let max = mode.max.map(|max_value| {
                    let mlabel = mode_label.clone();
                    let on_max_value = ctx.link().callback(move |max: String| {
                        ColorControlMsg::MaxValue((mlabel.clone(), max.parse().ok()))
                    });
                    html! {
                        <NumberInput
                            { max_value }
                            { on_max_value }
                        />
                    }
                });

                let props = RadioListItemProps {
                    value: mode_label.clone(),
                    children: Children::new(vec![html_template! {
                        <span class="row">{mode_label.clone()}</span>
                        if self.enabled && self.current_mode.as_ref() == Some(&mode_label) {
                            {for color_pickers}
                            {max.unwrap_or_default()}
                        }
                    }]),
                };

                let child = VChild::new(
                    props,
                    Some(format!("{:?}-{:?}", ctx.props().label, mode_label).into()),
                );
                tracing::info!("child = {child:?}");
                child
            })
            .collect_vec();

        // let modes = ctx
        //     .props()
        //     .modes
        //     .iter()
        //     .map(|(mode_label, mode)| {
        //         let color_pickers = mode
        //             .colors
        //             .iter()
        //             .map(|(color_label, color)| {
        //                 let on_color_change = ctx.link().callback(move |event:
        // InputEvent| {                     let value =
        // event.target_unchecked_into::<HtmlInputElement>().value();
        //                     ColorControlMsg::SetColor((mode_label, color_label,
        // value))                 });
        //                 let value = self
        //                     .colors
        //                     .get(mode_label)
        //                     .and_then(|colors| colors.get(color_label))
        //                     .cloned();
        //                 html_template! {
        //                     <span>{color_label.clone()}</span>
        //                     <input
        //                         class="parameter"
        //                         type="color"
        //                         { value }
        //                         oninput={ on_color_change }/>
        //                 }
        //             })
        //             .collect_vec();

        //         let max = mode.max.map(move |_max| {
        //             let max_value = self
        //                 .max
        //                 .get(mode_idx)
        //                 .map(|val| match val {
        //                     ColorMax::Number(n) => *n,
        //                     ColorMax::String(s) => match s {
        //                         ColorMaxStringValue::Column => self.column_max,
        //                     },
        //                 })
        //                 .unwrap_or_default();

        //             html! {
        //                 <NumberInput
        //                     { max_value }
        //
        // on_max_value={ctx.link().callback(ColorControlMsg::SetMaxValue)}
        //                 />
        //             }
        //         });

        //         let props = RadioListItemProps {
        //             value: mode_idx,
        //             children: Children::new(vec![html_template! {
        //                 <span class="row">{mode.label.clone()}</span>
        //                 if self.enabled && self.current_mode == mode_idx {
        //                     {for color_pickers}
        //                     {max.unwrap_or_default()}
        //                 }
        //             }]),
        //         };

        //         let child = VChild::new(
        //             props,
        //             Some(format!("{:?}-{:?}", ctx.props().label, mode_idx).into()),
        //         );
        //         tracing::info!("child = {child:?}");
        //         child
        //     })
        //     .collect_vec();
        let children = ChildrenWithProps::new(modes);

        let on_change = ctx
            .link()
            .callback(|str| ColorControlMsg::CurrentMode(Some(str)));
        let on_checkbox = ctx.link().callback(|event: InputEvent| {
            tracing::warn!("on_checkbox!");
            let value = event.target_unchecked_into::<HtmlInputElement>().checked();
            ColorControlMsg::Enabled(value)
        });

        let name = format!(
            "{}-list",
            ctx.props().label.clone().unwrap_or("color".into())
        );

        html! {
            <>
                <div class="column-style-label">
                    <label class="indent">{ "Foreground" }</label>
                </div>
                <div class="section">
                    <input
                        type="checkbox"
                        oninput={ on_checkbox }
                        checked={ self.enabled} />
                    <RadioList<String>
                        class="indent"
                        {name}
                        disabled={ !self.enabled }
                        selected={ self.current_mode.clone() }
                        {on_change}
                        {children} />
                </div>
            </>
        }
    }
}
