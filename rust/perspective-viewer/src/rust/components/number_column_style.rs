////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::color_range_selector::*;
use super::containers::radio_list::RadioList;
use super::modal::*;
use crate::utils::WeakScope;
use crate::*;

use serde::{Deserialize, Serialize};
use std::fmt::Display;
use std::str::FromStr;
use wasm_bindgen::*;
use web_sys::*;
use yew::prelude::*;
use yew::*;

pub static CSS: &str = include_str!("../../../build/css/column-style.css");

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum NumberColorMode {
    #[serde(rename = "disabled")]
    Disabled,

    #[serde(rename = "foreground")]
    Foreground,

    #[serde(rename = "background")]
    Background,

    #[serde(rename = "gradient")]
    Gradient,

    #[serde(rename = "bar")]
    Bar,
}

impl Default for NumberColorMode {
    fn default() -> Self {
        NumberColorMode::Foreground
    }
}

impl Display for NumberColorMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Foreground => Ok("foreground"),
            Self::Background => Ok("background"),
            Self::Gradient => Ok("gradient"),
            Self::Bar => Ok("bar"),
            _ => Err(std::fmt::Error),
        }?;

        write!(f, "{}", text)
    }
}

impl FromStr for NumberColorMode {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "foreground" => Ok(Self::Foreground),
            "background" => Ok(Self::Background),
            "gradient" => Ok(Self::Gradient),
            "bar" => Ok(Self::Bar),
            x => Err(format!("Unknown NumberColorMode::{}", x)),
        }
    }
}

impl NumberColorMode {
    fn is_foreground(&self) -> bool {
        *self == Self::Foreground
    }

    fn is_enabled(&self) -> bool {
        *self != Self::Disabled
    }

    fn needs_gradient(&self) -> bool {
        *self == Self::Gradient || *self == Self::Bar
    }
}

#[cfg_attr(test, derive(Debug))]
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct NumberColumnStyleConfig {
    #[serde(default = "NumberColorMode::default")]
    #[serde(skip_serializing_if = "NumberColorMode::is_foreground")]
    pub number_color_mode: NumberColorMode,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub fixed: Option<u32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub pos_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub neg_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub gradient: Option<f64>,
}

/// Exactly like a `ColumnStyleConfig`, except without `Option<>` fields, as
/// this struct represents the default values we should use in the GUI when they
/// are `None` in the real config.  It is also used to decide when to omit a
/// field when serialized a `ColumnStyleConfig` to JSON.
#[derive(Deserialize, Clone, Default, Debug)]
pub struct NumberColumnStyleDefaultConfig {
    pub gradient: f64,
    pub fixed: u32,
    pub pos_color: String,
    pub neg_color: String,

    #[serde(default = "NumberColorMode::default")]
    pub color_mode: NumberColorMode,
}

pub enum NumberColumnStyleMsg {
    Reset(NumberColumnStyleConfig, NumberColumnStyleDefaultConfig),
    FixedChanged(String),
    ColorEnabledChanged(bool),
    PosColorChanged(String),
    NegColorChanged(String),
    NumberColorModeChanged(NumberColorMode),
    GradientChanged(String),
}

/// A `ColumnStyle` component is mounted to the window anchored at the screen
/// position of `elem`.  It needs two input configs, the current configuration
/// object and a default version without `Option<>`
#[derive(Properties)]
pub struct NumberColumnStyleProps {
    #[prop_or_default]
    pub config: NumberColumnStyleConfig,

    #[prop_or_default]
    pub default_config: NumberColumnStyleDefaultConfig,

    #[prop_or_default]
    pub on_change: Callback<NumberColumnStyleConfig>,

    #[prop_or_default]
    pub weak_link: WeakScope<NumberColumnStyle>,
}

impl ModalLink<NumberColumnStyle> for NumberColumnStyleProps {
    fn weak_link(&self) -> &'_ WeakScope<NumberColumnStyle> {
        &self.weak_link
    }
}

impl PartialEq for NumberColumnStyleProps {
    fn eq(&self, _other: &Self) -> bool {
        false
    }
}

impl NumberColumnStyleProps {}

/// The `ColumnStyle` component stores its UI state privately in its own struct,
/// rather than its props (which has two version of this data itself, the
/// JSON serializable config record and the defaults record).
pub struct NumberColumnStyle {
    config: NumberColumnStyleConfig,
    color_mode: NumberColorMode,
    pos_color: String,
    neg_color: String,
    gradient: f64,
}

impl Component for NumberColumnStyle {
    type Message = NumberColumnStyleMsg;
    type Properties = NumberColumnStyleProps;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        NumberColumnStyle::reset(&ctx.props().config, &ctx.props().default_config)
    }

    fn changed(&mut self, ctx: &Context<Self>) -> bool {
        let mut new = NumberColumnStyle::reset(&ctx.props().config, &ctx.props().default_config);
        std::mem::swap(self, &mut new);
        true
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            NumberColumnStyleMsg::Reset(config, default_config) => {
                let mut new = NumberColumnStyle::reset(&config, &default_config);
                std::mem::swap(self, &mut new);
                true
            }
            NumberColumnStyleMsg::FixedChanged(fixed) => {
                let fixed = match fixed.parse::<u32>() {
                    Ok(x) if x != ctx.props().default_config.fixed => Some(x),
                    Ok(_) => None,
                    Err(_) if fixed.is_empty() => Some(0),
                    Err(_) => None,
                };

                self.config.fixed = fixed.map(|x| std::cmp::min(15, x));
                self.dispatch_config(ctx);
                true
            }
            NumberColumnStyleMsg::ColorEnabledChanged(val) => {
                if val {
                    let color_mode = match self.color_mode {
                        NumberColorMode::Disabled => NumberColorMode::default(),
                        x => x,
                    };

                    self.config.number_color_mode = color_mode;
                    self.config.pos_color = Some(self.pos_color.to_owned());
                    self.config.neg_color = Some(self.neg_color.to_owned());
                    if self.color_mode.needs_gradient() {
                        self.config.gradient = Some(self.gradient);
                    } else {
                        self.config.gradient = None;
                    }
                } else {
                    self.config.number_color_mode = NumberColorMode::Disabled;
                    self.config.pos_color = None;
                    self.config.neg_color = None;
                    self.config.gradient = None;
                }

                self.dispatch_config(ctx);
                true
            }
            NumberColumnStyleMsg::PosColorChanged(val) => {
                self.pos_color = val;
                self.config.pos_color = Some(self.pos_color.to_owned());
                self.dispatch_config(ctx);
                false
            }
            NumberColumnStyleMsg::NegColorChanged(val) => {
                self.neg_color = val;
                self.config.neg_color = Some(self.neg_color.to_owned());
                self.dispatch_config(ctx);
                false
            }
            NumberColumnStyleMsg::NumberColorModeChanged(val) => {
                self.color_mode = val;
                self.config.number_color_mode = val;
                if self.color_mode.needs_gradient() {
                    self.config.gradient = Some(self.gradient);
                } else {
                    self.config.gradient = None;
                }

                self.dispatch_config(ctx);
                true
            }
            NumberColumnStyleMsg::GradientChanged(gradient) => {
                self.config.gradient = match gradient.parse::<f64>() {
                    Ok(x) => {
                        self.gradient = x;
                        Some(x)
                    }
                    Err(_) if gradient.is_empty() => {
                        self.gradient = ctx.props().default_config.gradient;
                        Some(ctx.props().default_config.gradient)
                    }
                    Err(_) => {
                        self.gradient = ctx.props().default_config.gradient;
                        None
                    }
                };
                self.dispatch_config(ctx);
                false
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        // Fixed precision control oninput callback
        let fixed_oninput = ctx.link().callback(|event: InputEvent| {
            NumberColumnStyleMsg::FixedChanged(
                event
                    .target()
                    .unwrap()
                    .unchecked_into::<web_sys::HtmlInputElement>()
                    .value(),
            )
        });

        let fixed_value = self
            .config
            .fixed
            .unwrap_or(ctx.props().default_config.fixed)
            .to_string();

        // Color enabled/disabled oninput callback
        let color_enabled_oninput = ctx.link().callback(move |event: InputEvent| {
            let input = event
                .target()
                .unwrap()
                .unchecked_into::<web_sys::HtmlInputElement>();
            NumberColumnStyleMsg::ColorEnabledChanged(input.checked())
        });

        let selected_color_mode = match self.color_mode {
            NumberColorMode::Disabled => NumberColorMode::default(),
            x => x,
        };

        // Color mode radio callback
        let color_mode_changed = ctx
            .link()
            .callback(NumberColumnStyleMsg::NumberColorModeChanged);

        let select_values = vec![
            NumberColorMode::Foreground,
            NumberColorMode::Background,
            NumberColorMode::Gradient,
            NumberColorMode::Bar,
        ];

        let foreground_controls = if self.config.number_color_mode == NumberColorMode::Foreground {
            html_template! {
                <span class="row">{ "Foreground" }</span>
                <div class="row section inner_section">
                    <ColorRangeSelector ..self.color_props(ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Foreground" }</span>
            }
        };

        let background_controls = if self.config.number_color_mode == NumberColorMode::Background {
            html_template! {
                <span class="row">{ "Background" }</span>
                <div class="row section inner_section">
                    <ColorRangeSelector ..self.color_props(ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Background" }</span>
            }
        };

        let gradient_controls = if self.config.number_color_mode == NumberColorMode::Gradient {
            html_template! {
                <span class="row">{ "Gradient" }</span>
                <div class="row section inner_section">
                    <ColorRangeSelector ..self.color_props(ctx) />
                    <MaxValueChooser ..self.max_value_props(ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Gradient" }</span>
            }
        };

        let bar_controls = if self.config.number_color_mode == NumberColorMode::Bar {
            html_template! {
                <span class="row">{ "Bar" }</span>
                <div class="row section inner_section">
                    <ColorRangeSelector ..self.color_props(ctx) />
                    <MaxValueChooser ..self.max_value_props(ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Bar" }</span>
            }
        };

        html_template! {
            <style>
                { &CSS }
            </style>
            <div id="column-style-container">
                <div>
                    <label id="fixed-examples" class="indent">{
                        self.make_fixed_text(ctx)
                    }</label>
                </div>
                <div class="row section">
                    <input type="checkbox" checked=true disabled=true/>
                    <input
                        id="fixed-param"
                        class="parameter"
                        type="number"
                        min="0"
                        step="1"
                        value={ fixed_value }
                        oninput={ fixed_oninput }/>
                </div>
                <div>
                    <label class="indent">{ "Color" }</label>
                </div>
                <div>
                    <input
                        id="color-selected"
                        type="checkbox"
                        oninput={ color_enabled_oninput }
                        checked={ self.config.number_color_mode.is_enabled() } />
                    <RadioList<NumberColorMode>
                        class="indent"
                        disabled={ !self.config.number_color_mode.is_enabled() }
                        values={ select_values }
                        selected={ selected_color_mode }
                        on_change={ color_mode_changed } >

                        { foreground_controls }
                        { background_controls }
                        { gradient_controls }
                        { bar_controls }

                    </RadioList<NumberColorMode>>
                </div>

            </div>
        }
    }
}

#[derive(Properties, PartialEq)]
pub struct MaxValueChooserProps {
    max_value: f64,
    on_max_value: Callback<String>,
}

#[function_component(MaxValueChooser)]
fn max_value_chooser(props: &MaxValueChooserProps) -> Html {
    let oninput = props.on_max_value.reform(|event: InputEvent| {
        event
            .target()
            .unwrap()
            .unchecked_into::<HtmlInputElement>()
            .value()
    });

    html_template! {
        <label>{ "Max" }</label>
        <input
            id="gradient-param"
            value={ format!("{}", props.max_value) }
            class="parameter"
            oninput={ oninput }
            type="number"
            min="0" />
    }
}

impl NumberColumnStyle {
    /// When this config has changed, we must signal the wrapper element.
    fn dispatch_config(&self, ctx: &Context<Self>) {
        let config = match &self.config {
            NumberColumnStyleConfig {
                pos_color: Some(pos_color),
                neg_color: Some(neg_color),
                ..
            } if *pos_color == ctx.props().default_config.pos_color
                && *neg_color == ctx.props().default_config.neg_color =>
            {
                NumberColumnStyleConfig {
                    pos_color: None,
                    neg_color: None,
                    ..self.config
                }
            }
            x => x.clone(),
        };

        ctx.props().on_change.emit(config);
    }

    fn color_props(&self, ctx: &Context<Self>) -> ColorRangeProps {
        let on_pos_color = ctx.link().callback(NumberColumnStyleMsg::PosColorChanged);
        let on_neg_color = ctx.link().callback(NumberColumnStyleMsg::NegColorChanged);
        props!(ColorRangeProps {
            pos_color: self.pos_color.to_owned(),
            neg_color: self.neg_color.to_owned(),
            on_pos_color,
            on_neg_color
        })
    }

    fn max_value_props(&self, ctx: &Context<Self>) -> MaxValueChooserProps {
        let on_max_value = ctx.link().callback(NumberColumnStyleMsg::GradientChanged);
        props!(MaxValueChooserProps {
            max_value: self.gradient,
            on_max_value
        })
    }

    /// Human readable precision hint, e.g. "Prec 0.001" for `{fixed: 3}`.
    fn make_fixed_text(&self, ctx: &Context<Self>) -> String {
        let fixed = match self.config.fixed {
            Some(x) if x > 0 => format!("0.{}1", "0".repeat(x as usize - 1)),
            None if ctx.props().default_config.fixed > 0 => {
                let n = ctx.props().default_config.fixed as usize - 1;
                format!("0.{}1", "0".repeat(n))
            }
            Some(_) | None => "1".to_owned(),
        };

        format!("Prec {}", fixed)
    }

    fn reset(
        config: &NumberColumnStyleConfig,
        default_config: &NumberColumnStyleDefaultConfig,
    ) -> NumberColumnStyle {
        let mut config = config.clone();
        let gradient = match config.gradient {
            Some(x) => x,
            None => default_config.gradient,
        };

        let pos_color = config
            .pos_color
            .as_ref()
            .unwrap_or(&default_config.pos_color)
            .to_owned();

        let neg_color = config
            .neg_color
            .as_ref()
            .unwrap_or(&default_config.neg_color)
            .to_owned();

        let color_mode = match config.number_color_mode {
            NumberColorMode::Disabled => NumberColorMode::default(),
            x => {
                config.pos_color = Some(pos_color.to_owned());
                config.neg_color = Some(neg_color.to_owned());
                x
            }
        };

        NumberColumnStyle {
            config,
            color_mode,
            pos_color,
            neg_color,
            gradient,
        }
    }
}
