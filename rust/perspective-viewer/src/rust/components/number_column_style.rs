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
pub enum NumberForegroundMode {
    #[serde(rename = "disabled")]
    Disabled,

    #[serde(rename = "color")]
    Color,

    #[serde(rename = "bar")]
    Bar,
}

impl Default for NumberForegroundMode {
    fn default() -> Self {
        NumberForegroundMode::Color
    }
}

/// `Display` and `FromStr` are only used for rendering these types as HTML
/// attributes, where `disabled` will never be rendered as it represents the
/// options being unavailable.
impl Display for NumberForegroundMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Color => Ok("color"),
            Self::Bar => Ok("bar"),
            _ => Err(std::fmt::Error),
        }?;

        write!(f, "{}", text)
    }
}

impl FromStr for NumberForegroundMode {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "color" => Ok(Self::Color),
            "bar" => Ok(Self::Bar),
            x => Err(format!("Unknown NumberForegroundMode::{}", x)),
        }
    }
}

impl NumberForegroundMode {
    fn is_color(&self) -> bool {
        *self == Self::Color
    }

    fn is_enabled(&self) -> bool {
        *self != Self::Disabled
    }

    fn needs_gradient(&self) -> bool {
        *self == Self::Bar
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum NumberBackgroundMode {
    #[serde(rename = "disabled")]
    Disabled,

    #[serde(rename = "color")]
    Color,

    #[serde(rename = "gradient")]
    Gradient,

    #[serde(rename = "pulse")]
    Pulse,
}

impl Default for NumberBackgroundMode {
    fn default() -> Self {
        NumberBackgroundMode::Disabled
    }
}

impl Display for NumberBackgroundMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Color => Ok("color"),
            Self::Gradient => Ok("gradient"),
            Self::Pulse => Ok("pulse"),
            _ => Err(std::fmt::Error),
        }?;

        write!(f, "{}", text)
    }
}

impl FromStr for NumberBackgroundMode {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "color" => Ok(Self::Color),
            "gradient" => Ok(Self::Gradient),
            "pulse" => Ok(Self::Pulse),
            x => Err(format!("Unknown NumberBackgroundMode::{}", x)),
        }
    }
}

impl NumberBackgroundMode {
    fn is_disabled(&self) -> bool {
        *self == Self::Disabled
    }

    fn needs_gradient(&self) -> bool {
        *self == Self::Gradient
    }
}

#[cfg_attr(test, derive(Debug))]
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct NumberColumnStyleConfig {
    #[serde(default = "NumberForegroundMode::default")]
    #[serde(skip_serializing_if = "NumberForegroundMode::is_color")]
    pub number_fg_mode: NumberForegroundMode,

    #[serde(default = "NumberBackgroundMode::default")]
    #[serde(skip_serializing_if = "NumberBackgroundMode::is_disabled")]
    pub number_bg_mode: NumberBackgroundMode,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub fixed: Option<u32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub pos_fg_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub neg_fg_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub pos_bg_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub neg_bg_color: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub fg_gradient: Option<f64>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub bg_gradient: Option<f64>,
}

/// Exactly like a `ColumnStyleConfig`, except without `Option<>` fields, as
/// this struct represents the default values we should use in the GUI when they
/// are `None` in the real config.  It is also used to decide when to omit a
/// field when serialized a `ColumnStyleConfig` to JSON.
#[derive(Deserialize, Clone, Default, Debug)]
pub struct NumberColumnStyleDefaultConfig {
    pub fg_gradient: f64,
    pub bg_gradient: f64,
    pub fixed: u32,
    pub pos_fg_color: String,
    pub neg_fg_color: String,
    pub pos_bg_color: String,
    pub neg_bg_color: String,

    #[serde(default = "NumberForegroundMode::default")]
    pub number_fg_mode: NumberForegroundMode,

    #[serde(default = "NumberBackgroundMode::default")]
    pub number_bg_mode: NumberBackgroundMode,
}

type Side = bool;

pub enum NumberColumnStyleMsg {
    Reset(
        Box<NumberColumnStyleConfig>,
        Box<NumberColumnStyleDefaultConfig>,
    ),
    FixedChanged(String),
    ForeEnabledChanged(bool),
    BackEnabledChanged(bool),
    PosColorChanged(Side, String),
    NegColorChanged(Side, String),
    NumberForeModeChanged(NumberForegroundMode),
    NumberBackModeChanged(NumberBackgroundMode),
    GradientChanged(Side, String),
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
    fg_mode: NumberForegroundMode,
    bg_mode: NumberBackgroundMode,
    pos_fg_color: String,
    neg_fg_color: String,
    pos_bg_color: String,
    neg_bg_color: String,
    fg_gradient: f64,
    bg_gradient: f64,
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
            NumberColumnStyleMsg::ForeEnabledChanged(val) => {
                if val {
                    let color_mode = match self.fg_mode {
                        NumberForegroundMode::Disabled => NumberForegroundMode::default(),
                        x => x,
                    };

                    self.config.number_fg_mode = color_mode;
                    self.config.pos_fg_color = Some(self.pos_fg_color.to_owned());
                    self.config.neg_fg_color = Some(self.neg_fg_color.to_owned());
                    if self.fg_mode.needs_gradient() {
                        self.config.fg_gradient = Some(self.fg_gradient);
                    } else {
                        self.config.fg_gradient = None;
                    }
                } else {
                    self.config.number_fg_mode = NumberForegroundMode::Disabled;
                    self.config.pos_fg_color = None;
                    self.config.neg_fg_color = None;
                    self.config.fg_gradient = None;
                }

                self.dispatch_config(ctx);
                true
            }
            NumberColumnStyleMsg::BackEnabledChanged(val) => {
                if val {
                    let color_mode = match self.bg_mode {
                        NumberBackgroundMode::Disabled => NumberBackgroundMode::Color,
                        x => x,
                    };

                    self.config.number_bg_mode = color_mode;
                    self.config.pos_bg_color = Some(self.pos_bg_color.to_owned());
                    self.config.neg_bg_color = Some(self.neg_bg_color.to_owned());
                    if self.bg_mode.needs_gradient() {
                        self.config.bg_gradient = Some(self.bg_gradient);
                    } else {
                        self.config.bg_gradient = None;
                    }
                } else {
                    self.config.number_bg_mode = NumberBackgroundMode::Disabled;
                    self.config.pos_bg_color = None;
                    self.config.neg_bg_color = None;
                    self.config.bg_gradient = None;
                }

                self.dispatch_config(ctx);
                true
            }
            NumberColumnStyleMsg::PosColorChanged(side, val) => {
                if side {
                    self.pos_fg_color = val;
                    self.config.pos_fg_color = Some(self.pos_fg_color.to_owned());
                } else {
                    self.pos_bg_color = val;
                    self.config.pos_bg_color = Some(self.pos_bg_color.to_owned());
                }

                self.dispatch_config(ctx);
                false
            }
            NumberColumnStyleMsg::NegColorChanged(side, val) => {
                if side {
                    self.neg_fg_color = val;
                    self.config.neg_fg_color = Some(self.neg_fg_color.to_owned());
                } else {
                    self.neg_bg_color = val;
                    self.config.neg_bg_color = Some(self.neg_bg_color.to_owned());
                }

                self.dispatch_config(ctx);
                false
            }
            NumberColumnStyleMsg::NumberForeModeChanged(val) => {
                self.fg_mode = val;
                self.config.number_fg_mode = val;
                if self.fg_mode.needs_gradient() {
                    self.config.fg_gradient = Some(self.fg_gradient);
                } else {
                    self.config.fg_gradient = None;
                }

                self.dispatch_config(ctx);
                true
            }
            NumberColumnStyleMsg::NumberBackModeChanged(val) => {
                self.bg_mode = val;
                self.config.number_bg_mode = val;
                if self.bg_mode.needs_gradient() {
                    self.config.bg_gradient = Some(self.bg_gradient);
                } else {
                    self.config.bg_gradient = None;
                }

                self.dispatch_config(ctx);
                true
            }
            NumberColumnStyleMsg::GradientChanged(side, gradient) => {
                match (side, gradient.parse::<f64>()) {
                    (true, Ok(x)) => {
                        self.fg_gradient = x;
                        self.config.fg_gradient = Some(x);
                    }
                    (true, Err(_)) if gradient.is_empty() => {
                        self.fg_gradient = ctx.props().default_config.fg_gradient;
                        self.config.fg_gradient = Some(ctx.props().default_config.fg_gradient);
                    }
                    (true, Err(_)) => {
                        self.fg_gradient = ctx.props().default_config.fg_gradient;
                        self.config.fg_gradient = None;
                    }
                    (false, Ok(x)) => {
                        self.bg_gradient = x;
                        self.config.bg_gradient = Some(x);
                    }
                    (false, Err(_)) if gradient.is_empty() => {
                        self.bg_gradient = ctx.props().default_config.bg_gradient;
                        self.config.bg_gradient = Some(ctx.props().default_config.bg_gradient);
                    }
                    (false, Err(_)) => {
                        self.bg_gradient = ctx.props().default_config.bg_gradient;
                        self.config.bg_gradient = None;
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
        let fg_enabled_oninput = ctx.link().callback(move |event: InputEvent| {
            let input = event
                .target()
                .unwrap()
                .unchecked_into::<web_sys::HtmlInputElement>();
            NumberColumnStyleMsg::ForeEnabledChanged(input.checked())
        });

        let bg_enabled_oninput = ctx.link().callback(move |event: InputEvent| {
            let input = event
                .target()
                .unwrap()
                .unchecked_into::<web_sys::HtmlInputElement>();
            NumberColumnStyleMsg::BackEnabledChanged(input.checked())
        });

        let selected_fg_mode = match self.fg_mode {
            NumberForegroundMode::Disabled => NumberForegroundMode::default(),
            x => x,
        };

        let selected_bg_mode = match self.bg_mode {
            NumberBackgroundMode::Disabled => NumberBackgroundMode::Color,
            x => x,
        };

        // Color mode radio callback
        let fg_mode_changed = ctx
            .link()
            .callback(NumberColumnStyleMsg::NumberForeModeChanged);

        let bg_mode_changed = ctx
            .link()
            .callback(NumberColumnStyleMsg::NumberBackModeChanged);

        let fg_select_values = vec![NumberForegroundMode::Color, NumberForegroundMode::Bar];

        let bg_select_values = vec![
            NumberBackgroundMode::Color,
            NumberBackgroundMode::Gradient,
            NumberBackgroundMode::Pulse,
        ];

        let fg_color_controls = if self.config.number_fg_mode == NumberForegroundMode::Color {
            html_template! {
                <span class="row">{ "Color" }</span>
                <div class="row section inner_section">
                    <ColorRangeSelector ..self.color_props(true, ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Color" }</span>
            }
        };

        let fg_bar_controls = if self.config.number_fg_mode == NumberForegroundMode::Bar {
            html_template! {
                <span class="row">{ "Bar" }</span>
                <div class="row section inner_section">
                    <ColorRangeSelector ..self.color_props(true, ctx) />
                    <MaxValueChooser ..self.max_value_props(true, ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Bar" }</span>
            }
        };

        let bg_color_controls = if self.config.number_bg_mode == NumberBackgroundMode::Color {
            html_template! {
                <span class="row">{ "Color" }</span>
                <div class="row section inner_section">
                    <ColorRangeSelector ..self.color_props(false, ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Color" }</span>
            }
        };

        let bg_gradient_controls = if self.config.number_bg_mode == NumberBackgroundMode::Gradient {
            html_template! {
                <span class="row">{ "Gradient" }</span>
                <div class="row section inner_section">
                    <ColorRangeSelector ..self.color_props(false, ctx) />
                    <MaxValueChooser ..self.max_value_props(false, ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Gradient" }</span>
            }
        };

        let bg_pulse_controls = if self.config.number_bg_mode == NumberBackgroundMode::Pulse {
            html_template! {
                <span class="row">{ "Pulse (Δ)" }</span>
                <div class="row section inner_section">
                    <ColorRangeSelector ..self.color_props(false, ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Pulse (Δ)" }</span>
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
                    <label class="indent">{ "Foreground" }</label>
                </div>
                <div class="section">
                    <input
                        id="fore-selected"
                        type="checkbox"
                        oninput={ fg_enabled_oninput }
                        checked={ self.config.number_fg_mode.is_enabled() } />
                    <RadioList<NumberForegroundMode>
                        class="indent"
                        name="foreground-list"
                        disabled={ !self.config.number_fg_mode.is_enabled() }
                        values={ fg_select_values }
                        selected={ selected_fg_mode }
                        on_change={ fg_mode_changed } >

                        { fg_color_controls }
                        { fg_bar_controls }

                    </RadioList<NumberForegroundMode>>
                </div>
                <div>
                    <label class="indent">{ "Background" }</label>
                </div>
                <div class="section">
                    <input
                        id="back-selected"
                        type="checkbox"
                        oninput={ bg_enabled_oninput }
                        checked={ !self.config.number_bg_mode.is_disabled() } />
                    <RadioList<NumberBackgroundMode>
                        class="indent"
                        name="background-list"
                        disabled={ self.config.number_bg_mode.is_disabled() }
                        values={ bg_select_values }
                        selected={ selected_bg_mode }
                        on_change={ bg_mode_changed } >

                        { bg_color_controls }
                        { bg_gradient_controls }
                        { bg_pulse_controls }

                    </RadioList<NumberBackgroundMode>>
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
        let mut config = self.config.clone();
        match &self.config {
            NumberColumnStyleConfig {
                pos_fg_color: Some(pos_color),
                neg_fg_color: Some(neg_color),
                ..
            } if *pos_color == ctx.props().default_config.pos_fg_color
                && *neg_color == ctx.props().default_config.neg_fg_color =>
            {
                config.pos_fg_color = None;
                config.neg_fg_color = None;
            }
            _ => {}
        };

        match &self.config {
            NumberColumnStyleConfig {
                pos_bg_color: Some(pos_color),
                neg_bg_color: Some(neg_color),
                ..
            } if *pos_color == ctx.props().default_config.pos_bg_color
                && *neg_color == ctx.props().default_config.neg_bg_color =>
            {
                config.pos_bg_color = None;
                config.neg_bg_color = None;
            }
            _ => {}
        };

        ctx.props().on_change.emit(config);
    }

    fn color_props(&self, side: bool, ctx: &Context<Self>) -> ColorRangeProps {
        let on_pos_color = ctx
            .link()
            .callback(move |x| NumberColumnStyleMsg::PosColorChanged(side, x));
        let on_neg_color = ctx
            .link()
            .callback(move |x| NumberColumnStyleMsg::NegColorChanged(side, x));

        props!(ColorRangeProps {
            pos_color: if side {
                &self.pos_fg_color
            } else {
                &self.pos_bg_color
            }
            .to_owned(),
            neg_color: if side {
                &self.neg_fg_color
            } else {
                &self.neg_bg_color
            }
            .to_owned(),
            on_pos_color,
            on_neg_color
        })
    }

    fn max_value_props(&self, side: bool, ctx: &Context<Self>) -> MaxValueChooserProps {
        let on_max_value = ctx
            .link()
            .callback(move |x| NumberColumnStyleMsg::GradientChanged(side, x));

        props!(MaxValueChooserProps {
            max_value: if side {
                self.fg_gradient
            } else {
                self.bg_gradient
            },
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
        let fg_gradient = match config.fg_gradient {
            Some(x) => x,
            None => default_config.fg_gradient,
        };

        let bg_gradient = match config.bg_gradient {
            Some(x) => x,
            None => default_config.bg_gradient,
        };

        let pos_fg_color = config
            .pos_fg_color
            .as_ref()
            .unwrap_or(&default_config.pos_fg_color)
            .to_owned();

        let neg_fg_color = config
            .neg_fg_color
            .as_ref()
            .unwrap_or(&default_config.neg_fg_color)
            .to_owned();

        let pos_bg_color = config
            .pos_bg_color
            .as_ref()
            .unwrap_or(&default_config.pos_bg_color)
            .to_owned();

        let neg_bg_color = config
            .neg_bg_color
            .as_ref()
            .unwrap_or(&default_config.neg_bg_color)
            .to_owned();

        let fg_mode = match config.number_fg_mode {
            NumberForegroundMode::Disabled => NumberForegroundMode::default(),
            x => {
                config.pos_fg_color = Some(pos_fg_color.to_owned());
                config.neg_fg_color = Some(neg_fg_color.to_owned());
                x
            }
        };

        let bg_mode = match config.number_bg_mode {
            NumberBackgroundMode::Disabled => NumberBackgroundMode::default(),
            x => {
                config.pos_bg_color = Some(pos_bg_color.to_owned());
                config.neg_bg_color = Some(neg_bg_color.to_owned());
                x
            }
        };

        NumberColumnStyle {
            config,
            fg_mode,
            bg_mode,
            pos_fg_color,
            neg_fg_color,
            pos_bg_color,
            neg_bg_color,
            fg_gradient,
            bg_gradient,
        }
    }
}
