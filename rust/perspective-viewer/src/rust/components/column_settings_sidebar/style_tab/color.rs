use itertools::Itertools;
use web_sys::{HtmlInputElement, InputEvent};
use yew::virtual_dom::VChild;
use yew::{html, Callback, Children, ChildrenWithProps, Component, Html, Properties, TargetCast};

use crate::components::containers::radio_list::RadioList;
use crate::components::containers::radio_list_item::RadioListItemProps;
use crate::components::form::number_input::NumberInput;
use crate::config::{ColorMaxStringValue, ColorMaxValue, ColorOpts, ColumnConfig};
use crate::html_template;

#[derive(Properties, PartialEq)]
pub struct ColorControlProps {
    pub label: Option<String>,
    pub opts: ColorOpts,
    pub on_update: Callback<Option<ColumnConfig>>,
}

pub enum ColorControlMsg {
    ColorChange((usize, String)),
    ModeChange(usize),
    EnabledChange(bool),
    MaxValue(usize),
}

pub struct ColorControl {
    // maps mode_idx -> color_idx -> color_value
    colors: Vec<Vec<String>>,
    // input values which determine a numerical maximum
    // maps mode_idx -> max
    max: Vec<ColorMaxValue>,
    enabled: bool,
    mode_idx: usize,
}

impl Component for ColorControl {
    type Message = ColorControlMsg;
    type Properties = ColorControlProps;

    fn create(ctx: &yew::prelude::Context<Self>) -> Self {
        Self {
            colors: vec![], // TODO extract default values
            enabled: true,  // TODO: Disable if there is no default mode specified
            mode_idx: 0,    // TODO: idx of mode containing default or 0
            max: vec![],    // TODO: vec mapping mode idx to max value
        }
    }

    fn update(&mut self, ctx: &yew::prelude::Context<Self>, msg: Self::Message) -> bool {
        match msg {
            ColorControlMsg::ColorChange((color_idx, value)) => {
                if let Some(color) = self
                    .colors
                    .get_mut(self.mode_idx)
                    .and_then(|colors| colors.get_mut(color_idx))
                {
                    *color = value;
                } else {
                    tracing::error!(
                        "Tried to set invalid color idx! ({},{})",
                        self.mode_idx,
                        color_idx
                    );
                }
                false
            },
            ColorControlMsg::ModeChange(idx) => {
                self.mode_idx = idx;
                true
            },
            ColorControlMsg::EnabledChange(enabled) => {
                if self.enabled != enabled {
                    self.enabled = enabled;
                    true
                } else {
                    false
                }
            },
            ColorControlMsg::MaxValue(idx) => {
                if let Some(max) = self.max.get_mut(idx) {
                    *max = ctx
                        .props()
                        .opts
                        .modes
                        .get(idx)
                        .and_then(|mode| mode.max)
                        .unwrap_or_default()
                }
                false
            },
        }
    }

    fn view(&self, ctx: &yew::prelude::Context<Self>) -> Html {
        let modes = ctx
            .props()
            .opts
            .modes
            .iter()
            .enumerate()
            .map(|(mode_idx, mode)| {
                let color_pickers = mode
                    .colors
                    .iter()
                    .enumerate()
                    .map(|(color_idx, color)| {
                        let on_color_change = ctx.link().callback(move |event: InputEvent| {
                            let value = event.target_unchecked_into::<HtmlInputElement>().value();
                            ColorControlMsg::ColorChange((color_idx, value))
                        });
                        let value = self.colors.get(mode_idx).and_then(|colors| {
                            colors.get(color_idx)
                        }).cloned();
                        html_template! {
                            <span>{color.label.clone()}</span>
                            <input
                                class="parameter"
                                type="color"
                                { value }
                                oninput={ on_color_change }/>
                        }
                    })
                    .collect_vec();

                let max = mode.max.map(move |_max| {
                    let max_value = self.max.get(mode_idx).map(|val| {
                        match val {
                            ColorMaxValue::Number(n) => *n,
                            ColorMaxValue::String(s) => match s {
                                ColorMaxStringValue::Column => {
                                    // TODO: Get calculated maximum column value
                                    todo!()
                                }
                            },
                        }
                    }).unwrap_or_default();

                    html! {
                        <NumberInput
                            { max_value }
                            on_max_value={ctx.link().callback(move |_| ColorControlMsg::MaxValue(mode_idx))}
                        />
                    }
                });

                let props = RadioListItemProps {
                    value: mode_idx,
                    children: Children::new(vec![
                        html!{<span class="row">{mode.label.clone()}</span>},
                        html!{{for color_pickers}},
                        max.unwrap_or_default()
                    ]),
                };

                VChild::new(props, Some(mode_idx.into()))
            }).collect_vec();
        let children = ChildrenWithProps::new(modes);

        let on_change = ctx.link().callback(ColorControlMsg::ModeChange);
        let on_checkbox = ctx.link().callback(|event: InputEvent| {
            let value = event.target_unchecked_into::<HtmlInputElement>().checked();
            ColorControlMsg::EnabledChange(value)
        });

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
                    <RadioList<usize>
                        class="indent"
                        name="foreground-list"
                        disabled={ !self.enabled }
                        selected={ self.mode_idx }
                        {on_change}
                        {children} />
                </div>
            </>
        }
    }
}
