////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::color_selector::*;
use super::containers::radio_list::RadioList;
use super::modal::{ModalLink, SetModalLink};
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
pub enum StringColorMode {
    #[serde(rename = "foreground")]
    Foreground,

    #[serde(rename = "background")]
    Background,

    #[serde(rename = "series")]
    Series,
}

impl Default for StringColorMode {
    fn default() -> Self {
        StringColorMode::Foreground
    }
}

impl Display for StringColorMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            StringColorMode::Foreground => "foreground",
            StringColorMode::Background => "background",
            StringColorMode::Series => "series",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for StringColorMode {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "foreground" => Ok(StringColorMode::Foreground),
            "background" => Ok(StringColorMode::Background),
            "series" => Ok(StringColorMode::Series),
            x => Err(format!("Unknown StringColorMode::{}", x)),
        }
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum FormatMode {
    #[serde(rename = "link")]
    Link,

    #[serde(rename = "image")]
    Image,

    #[serde(rename = "bold")]
    Bold,

    #[serde(rename = "italics")]
    Italics,
}

impl Default for FormatMode {
    fn default() -> Self {
        FormatMode::Bold
    }
}

impl Display for FormatMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            FormatMode::Link => "link",
            FormatMode::Image => "image",
            FormatMode::Bold => "bold",
            FormatMode::Italics => "italics",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for FormatMode {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "link" => Ok(FormatMode::Link),
            "image" => Ok(FormatMode::Image),
            "bold" => Ok(FormatMode::Bold),
            "italics" => Ok(FormatMode::Italics),
            x => Err(format!("Unknown format mode {}", x)),
        }
    }
}

#[cfg_attr(test, derive(Debug))]
#[derive(Clone, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct StringColumnStyleConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<FormatMode>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub string_color_mode: Option<StringColorMode>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

#[derive(Clone, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct StringColumnStyleDefaultConfig {
    pub color: String,
}

pub enum StringColumnStyleMsg {
    Reset(StringColumnStyleConfig),
    FormatEnabled(bool),
    FormatChanged(FormatMode),
    ColorModeEnabled(bool),
    ColorModeChanged(StringColorMode),
    ColorChanged(String),
}

#[derive(Properties)]
pub struct StringColumnStyleProps {
    #[prop_or_default]
    pub config: StringColumnStyleConfig,

    #[prop_or_default]
    pub default_config: StringColumnStyleDefaultConfig,

    #[prop_or_default]
    pub on_change: Callback<StringColumnStyleConfig>,

    #[prop_or_default]
    weak_link: WeakScope<StringColumnStyle>,
}

impl ModalLink<StringColumnStyle> for StringColumnStyleProps {
    fn weak_link(&self) -> &'_ WeakScope<StringColumnStyle> {
        &self.weak_link
    }
}

impl PartialEq for StringColumnStyleProps {
    fn eq(&self, other: &Self) -> bool {
        self.config == other.config
    }
}

impl StringColumnStyle {
    /// When this config has changed, we must signal the wrapper element.
    fn dispatch_config(&self, ctx: &Context<Self>) {
        ctx.props().on_change.emit(self.config.clone());
    }

    fn color_props(&self, ctx: &Context<Self>) -> ColorProps {
        let on_color = ctx.link().callback(StringColumnStyleMsg::ColorChanged);
        let color = self
            .config
            .color
            .clone()
            .unwrap_or_else(|| ctx.props().default_config.color.to_owned());

        props!(ColorProps { color, on_color })
    }
}

/// The `ColumnStyle` component stores its UI state privately in its own struct,
/// rather than its props (which has two version of this data itself, the
/// JSON serializable config record and the defaults record).
pub struct StringColumnStyle {
    config: StringColumnStyleConfig,
}

impl Component for StringColumnStyle {
    type Message = StringColumnStyleMsg;
    type Properties = StringColumnStyleProps;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        StringColumnStyle {
            config: ctx.props().config.clone(),
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            StringColumnStyleMsg::Reset(config) => {
                self.config = config;
                true
            }
            StringColumnStyleMsg::FormatEnabled(val) => {
                self.config.format = if val {
                    Some(FormatMode::default())
                } else {
                    None
                };

                self.dispatch_config(ctx);
                true
            }
            StringColumnStyleMsg::FormatChanged(val) => {
                self.config.format = Some(val);
                self.dispatch_config(ctx);
                true
            }
            StringColumnStyleMsg::ColorModeEnabled(enabled) => {
                if enabled {
                    self.config.string_color_mode = Some(StringColorMode::default());
                } else {
                    self.config.string_color_mode = None;
                    self.config.color = None;
                }

                self.dispatch_config(ctx);
                true
            }
            StringColumnStyleMsg::ColorModeChanged(mode) => {
                self.config.string_color_mode = Some(mode);
                self.dispatch_config(ctx);
                true
            }
            StringColumnStyleMsg::ColorChanged(color) => {
                self.config.color = Some(color);
                self.dispatch_config(ctx);
                true
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        // Format enabled/disabled oninput callback
        let format_enabled_oninput = ctx.link().callback(move |event: InputEvent| {
            let input = event
                .target()
                .unwrap()
                .unchecked_into::<web_sys::HtmlInputElement>();
            StringColumnStyleMsg::FormatEnabled(input.checked())
        });

        let format_mode_selected = self.config.format.unwrap_or_default();

        // Format mode radio callback
        let format_mode_changed = ctx.link().callback(StringColumnStyleMsg::FormatChanged);

        // Color enabled/disabled oninput callback
        let color_enabled_oninput = ctx.link().callback(move |event: InputEvent| {
            let input = event
                .target()
                .unwrap()
                .unchecked_into::<web_sys::HtmlInputElement>();
            StringColumnStyleMsg::ColorModeEnabled(input.checked())
        });

        let selected_color_mode = self.config.string_color_mode.unwrap_or_default();

        // Color mode radio callback
        let color_mode_changed = ctx.link().callback(StringColumnStyleMsg::ColorModeChanged);

        let select_values = vec![
            StringColorMode::Foreground,
            StringColorMode::Background,
            StringColorMode::Series,
        ];

        let foreground_controls =
            if let Some(StringColorMode::Foreground) = self.config.string_color_mode {
                html_template! {
                    <span class="row">{ "Foreground" }</span>
                    <div class="row section inner_section">
                        <ColorSelector ..self.color_props(ctx) />
                    </div>
                }
            } else {
                html! {
                    <span class="row">{ "Foreground" }</span>
                }
            };

        let background_controls =
            if let Some(StringColorMode::Background) = self.config.string_color_mode {
                html_template! {
                    <span class="row">{ "Background" }</span>
                    <div class="row section inner_section">
                        <ColorSelector ..self.color_props(ctx) />
                    </div>
                }
            } else {
                html! {
                    <span class="row">{ "Background" }</span>
                }
            };

        let series_controls = if let Some(StringColorMode::Series) = self.config.string_color_mode {
            html_template! {
                <span class="row">{ "Series" }</span>
                <div class="row section inner_section">
                    <ColorSelector ..self.color_props(ctx) />
                </div>
            }
        } else {
            html! {
                <span class="row">{ "Series" }</span>
            }
        };

        html_template! {
            <style>
                { &CSS }
            </style>
            <div id="column-style-container">
                <div>
                    <label class="indent">{ "Format" }</label>
                </div>
                <div>
                    <input
                        id="format-selected"
                        type="checkbox"
                        oninput={ format_enabled_oninput }
                        checked={ self.config.format.is_some() } />

                    <RadioList<FormatMode>
                        class="indent"
                        disabled={ self.config.format.is_none() }
                        values={ vec!(FormatMode::Bold, FormatMode::Italics, FormatMode::Link) }
                        selected={ format_mode_selected }
                        on_change={ format_mode_changed } >

                        <span>{ "Bold" }</span>
                        <span>{ "Italics" }</span>
                        <span>{ "Link" }</span>

                    </RadioList<FormatMode>>
                </div>
                <div>
                    <label class="indent">{ "Color" }</label>
                </div>
                <div>
                    <input
                        id="color-selected"
                        type="checkbox"
                        oninput={ color_enabled_oninput }
                        checked={ self.config.string_color_mode.is_some() } />

                    <RadioList<StringColorMode>
                        class="indent"
                        name="color-radio-list"
                        disabled={ self.config.string_color_mode.is_none() }
                        values={ select_values }
                        selected={ selected_color_mode }
                        on_change={ color_mode_changed } >

                        { foreground_controls }
                        { background_controls }
                        { series_controls }

                    </RadioList<StringColorMode>>
                </div>
            </div>
        }
    }
}
