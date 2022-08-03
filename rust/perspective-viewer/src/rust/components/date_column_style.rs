////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::color_selector::*;
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

// #[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
// pub enum DateForegroundMode {
//     #[serde(rename = "disabled")]
//     Disabled,

//     #[serde(rename = "color")]
//     Color,

//     #[serde(rename = "bar")]
//     Bar,
// }

// impl Default for DateForegroundMode {
//     fn default() -> Self {
//         DateForegroundMode::Color
//     }
// }

// /// `Display` and `FromStr` are only used for rendering these types as HTML
// /// attributes, where `disabled` will never be rendered as it represents the
// /// options being unavailable.
// impl Display for DateForegroundMode {
//     fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
//         let text = match self {
//             Self::Color => Ok("color"),
//             Self::Bar => Ok("bar"),
//             _ => Err(std::fmt::Error),
//         }?;

//         write!(f, "{}", text)
//     }
// }

// impl FromStr for DateForegroundMode {
//     type Err = String;
//     fn from_str(s: &str) -> Result<Self, Self::Err> {
//         match s {
//             "color" => Ok(Self::Color),
//             "bar" => Ok(Self::Bar),
//             x => Err(format!("Unknown DateForegroundMode::{}", x)),
//         }
//     }
// }

// impl DateForegroundMode {
//     fn is_color(&self) -> bool {
//         *self == Self::Color
//     }

//     fn is_enabled(&self) -> bool {
//         *self != Self::Disabled
//     }

//     fn needs_gradient(&self) -> bool {
//         *self == Self::Bar
//     }
// }

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum DateBackgroundMode {
    #[serde(rename = "disabled")]
    Disabled,

    #[serde(rename = "color")]
    Color,

    #[serde(rename = "gradient")]
    Gradient,
}

impl Default for DateBackgroundMode {
    fn default() -> Self {
        DateBackgroundMode::Disabled
    }
}

impl Display for DateBackgroundMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            Self::Color => Ok("color"),
            Self::Gradient => Ok("gradient"),
            _ => Err(std::fmt::Error),
        }?;

        write!(f, "{}", text)
    }
}

impl FromStr for DateBackgroundMode {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "color" => Ok(Self::Color),
            "gradient" => Ok(Self::Gradient),
            x => Err(format!("Unknown DateBackgroundMode::{}", x)),
        }
    }
}

impl DateBackgroundMode {
    fn is_disabled(&self) -> bool {
        *self == Self::Disabled
    }

    // fn needs_gradient(&self) -> bool {
    //     *self == Self::Gradient
    // }
}

#[cfg_attr(test, derive(Debug))]
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct DateColumnStyleConfig {
    #[serde(default = "DateBackgroundMode::default")]
    #[serde(skip_serializing_if = "DateBackgroundMode::is_disabled")]
    pub date_bg_mode: DateBackgroundMode,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub bg_color: Option<String>,
}

/// Exactly like a `ColumnStyleConfig`, except without `Option<>` fields, as
/// this struct represents the default values we should use in the GUI when they
/// are `None` in the real config.  It is also used to decide when to omit a
/// field when serialized a `ColumnStyleConfig` to JSON.
#[derive(Deserialize, Clone, Default, Debug)]
pub struct DateColumnStyleDefaultConfig {
    #[serde(default = "DateBackgroundMode::default")]
    pub date_bg_mode: DateBackgroundMode,

    pub bg_color: String,
}

pub enum DateColumnStyleMsg {
    Reset(
        Box<DateColumnStyleConfig>,
        Box<DateColumnStyleDefaultConfig>,
    ),
    BackEnabledChanged(bool),
    ColorChanged(String),
    DateBackModeChanged(DateBackgroundMode),
}

/// A `ColumnStyle` component is mounted to the window anchored at the screen
/// position of `elem`.  It needs two input configs, the current configuration
/// object and a default version without `Option<>`
#[derive(Properties)]
pub struct DateColumnStyleProps {
    #[prop_or_default]
    pub config: DateColumnStyleConfig,

    #[prop_or_default]
    pub default_config: DateColumnStyleDefaultConfig,

    #[prop_or_default]
    pub on_change: Callback<DateColumnStyleConfig>,

    #[prop_or_default]
    pub weak_link: WeakScope<DateColumnStyle>,
}

impl ModalLink<DateColumnStyle> for DateColumnStyleProps {
    fn weak_link(&self) -> &'_ WeakScope<DateColumnStyle> {
        &self.weak_link
    }
}

impl PartialEq for DateColumnStyleProps {
    fn eq(&self, _other: &Self) -> bool {
        false
    }
}

impl DateColumnStyleProps {}

/// The `ColumnStyle` component stores its UI state privately in its own struct,
/// rather than its props (which has two version of this data itself, the
/// JSON serializable config record and the defaults record).
pub struct DateColumnStyle {
    config: DateColumnStyleConfig,
    bg_mode: DateBackgroundMode,
    bg_color: String,
}

impl Component for DateColumnStyle {
    type Message = DateColumnStyleMsg;
    type Properties = DateColumnStyleProps;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        DateColumnStyle::reset(&ctx.props().config, &ctx.props().default_config)
    }

    fn changed(&mut self, ctx: &Context<Self>) -> bool {
        let mut new = DateColumnStyle::reset(&ctx.props().config, &ctx.props().default_config);
        std::mem::swap(self, &mut new);
        true
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            DateColumnStyleMsg::Reset(config, default_config) => {
                let mut new = DateColumnStyle::reset(&config, &default_config);
                std::mem::swap(self, &mut new);
                true
            }
            DateColumnStyleMsg::BackEnabledChanged(val) => {
                if val {
                    let color_mode = match self.bg_mode {
                        DateBackgroundMode::Disabled => DateBackgroundMode::Color,
                        x => x,
                    };

                    self.config.date_bg_mode = color_mode;
                    self.config.bg_color = Some(self.bg_color.to_owned());
                } else {
                    self.config.date_bg_mode = DateBackgroundMode::Disabled;
                    self.config.bg_color = None;
                }

                self.dispatch_config(ctx);
                true
            }
            DateColumnStyleMsg::ColorChanged(val) => {
                self.bg_color = val;
                self.config.bg_color = Some(self.bg_color.to_owned());
                self.dispatch_config(ctx);
                false
            }
            DateColumnStyleMsg::DateBackModeChanged(val) => {
                self.bg_mode = val;
                self.config.date_bg_mode = val;
                self.dispatch_config(ctx);
                true
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let bg_enabled_oninput = ctx.link().callback(move |event: InputEvent| {
            let input = event
                .target()
                .unwrap()
                .unchecked_into::<web_sys::HtmlInputElement>();
            DateColumnStyleMsg::BackEnabledChanged(input.checked())
        });

        let selected_bg_mode = match self.bg_mode {
            DateBackgroundMode::Disabled => DateBackgroundMode::Color,
            x => x,
        };

        // Color mode radio callback
        let bg_mode_changed = ctx.link().callback(DateColumnStyleMsg::DateBackModeChanged);

        let bg_select_values = vec![DateBackgroundMode::Color, DateBackgroundMode::Gradient];

        let bg_color_controls = if self.config.date_bg_mode == DateBackgroundMode::Color {
            html_template! {
                <span class="row">{ "Color" }</span>
                <div class="row section inner_section">
                    <ColorSelector ..self.color_props(ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Color" }</span>
            }
        };

        let bg_gradient_controls = if self.config.date_bg_mode == DateBackgroundMode::Gradient {
            html_template! {
                <span class="row">{ "Gradient" }</span>
                <div class="row section inner_section">
                    <ColorSelector ..self.color_props(ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Gradient" }</span>
            }
        };

        html_template! {
            <style>
                { &CSS }
            </style>
            <div id="column-style-container">
                <div>
                    <label class="indent">{ "Background" }</label>
                </div>
                <div class="section">
                    <input
                        id="back-selected"
                        type="checkbox"
                        oninput={ bg_enabled_oninput }
                        checked={ !self.config.date_bg_mode.is_disabled() } />
                    <RadioList<DateBackgroundMode>
                        class="indent"
                        name="background-list"
                        disabled={ self.config.date_bg_mode.is_disabled() }
                        values={ bg_select_values }
                        selected={ selected_bg_mode }
                        on_change={ bg_mode_changed } >

                        { bg_color_controls }
                        { bg_gradient_controls }

                    </RadioList<DateBackgroundMode>>
                </div>


            </div>
        }
    }
}

// #[derive(Properties, PartialEq)]
// pub struct MaxValueChooserProps {
//     max_value: f64,
//     on_max_value: Callback<String>,
// }

// #[function_component(MaxValueChooser)]
// fn max_value_chooser(props: &MaxValueChooserProps) -> Html {
//     let oninput = props.on_max_value.reform(|event: InputEvent| {
//         event
//             .target()
//             .unwrap()
//             .unchecked_into::<HtmlInputElement>()
//             .value()
//     });

//     html_template! {
//         <label>{ "Max" }</label>
//         <input
//             id="gradient-param"
//             value={ format!("{}", props.max_value) }
//             class="parameter"
//             oninput={ oninput }
//             type="number"
//             min="0" />
//     }
// }

impl DateColumnStyle {
    /// When this config has changed, we must signal the wrapper element.
    fn dispatch_config(&self, ctx: &Context<Self>) {
        let mut config = self.config.clone();

        match &self.config {
            DateColumnStyleConfig {
                bg_color: Some(color),
                ..
            } if *color == ctx.props().default_config.bg_color => {
                config.bg_color = None;
            }
            _ => {}
        };

        ctx.props().on_change.emit(config);
    }

    fn color_props(&self, ctx: &Context<Self>) -> ColorProps {
        let on_color = ctx.link().callback(DateColumnStyleMsg::ColorChanged);
        let color = self
            .config
            .bg_color
            .clone()
            .unwrap_or_else(|| ctx.props().default_config.bg_color.to_owned());

        props!(ColorProps { color, on_color })
    }

    fn reset(
        config: &DateColumnStyleConfig,
        default_config: &DateColumnStyleDefaultConfig,
    ) -> DateColumnStyle {
        let mut config = config.clone();

        let bg_color = config
            .bg_color
            .as_ref()
            .unwrap_or(&default_config.bg_color)
            .to_owned();

        let bg_mode = match config.date_bg_mode {
            DateBackgroundMode::Disabled => DateBackgroundMode::default(),
            x => {
                config.bg_color = Some(bg_color.to_owned());
                x
            }
        };

        DateColumnStyle {
            config,
            bg_mode,
            bg_color,
        }
    }
}
