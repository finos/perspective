////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::radio_list::RadioList;
use crate::utils::WeakComponentLink;

use serde::{Deserialize, Serialize};
use std::fmt::Display;
use std::str::FromStr;
use wasm_bindgen::*;
use yew::prelude::*;

#[cfg(test)]
use wasm_bindgen_test::*;

pub static CSS: &str = include_str!("../../../dist/css/column-style.css");

#[derive(PartialEq, Serialize, Deserialize, Clone, Debug)]
pub enum ColorMode {
    #[serde(rename = "foreground")]
    Foreground,

    #[serde(rename = "background")]
    Background,

    #[serde(rename = "gradient")]
    Gradient,
}

impl Default for ColorMode {
    fn default() -> Self {
        ColorMode::Foreground
    }
}

impl Display for ColorMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let text = match self {
            ColorMode::Foreground => "foreground",
            ColorMode::Background => "background",
            ColorMode::Gradient => "gradient",
        };

        write!(f, "{}", text)
    }
}

impl FromStr for ColorMode {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "foreground" => Ok(ColorMode::Foreground),
            "background" => Ok(ColorMode::Background),
            "gradient" => Ok(ColorMode::Gradient),
            x => Err(format!("Unknown ColorMode '{}'", x)),
        }
    }
}

#[cfg_attr(test, derive(Debug))]
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct ColumnStyleConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_mode: Option<ColorMode>,

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
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct ColumnStyleDefaultConfig {
    pub gradient: f64,
    pub fixed: u32,
    pub pos_color: String,
    pub neg_color: String,
}

pub enum ColumnStyleMsg {
    SetPos(u32, u32),
    FixedChanged(String),
    ColorEnabledChanged(bool),
    PosColorChanged(String),
    NegColorChanged(String),
    ColorModeChanged(ColorMode),
    GradientChanged(String),
}

/// A `ColumnStyle` component is mounted to the window anchored at the screen
/// position of `elem`.  It needs two input configs, the current configuration
/// object and a default version without `Option<>`
#[derive(Properties, Clone)]
pub struct ColumnStyleProps {
    #[prop_or_default]
    pub config: ColumnStyleConfig,

    #[prop_or_default]
    pub default_config: ColumnStyleDefaultConfig,

    #[prop_or_default]
    pub on_change: Callback<ColumnStyleConfig>,

    #[prop_or_default]
    pub weak_link: WeakComponentLink<ColumnStyle>,
}

impl ColumnStyleProps {
    /// When this config has changed, we must signal the wrapper element to
    fn dispatch_config(&self) {
        self.on_change.emit(self.config.clone());
    }

    /// Human readable precision hint, e.g. "Prec 0.001" for `{fixed: 3}`.
    fn make_fixed_text(&self) -> String {
        match self.config.fixed {
            Some(x) if x > 0 => format!("0.{}1", "0".repeat(x as usize - 1)),
            None if self.default_config.fixed > 0 => {
                let n = self.default_config.fixed as usize - 1;
                format!("0.{}1", "0".repeat(n))
            }
            Some(_) | None => "1".to_owned(),
        }
    }
}

/// The `ColumnStyle` component stores its UI state privately in its own struct,
/// rather than its props (which has two version of this data itself, the
/// JSON serializable config record and the defaults record).
pub struct ColumnStyle {
    props: ColumnStyleProps,
    top: u32,
    left: u32,
    color_mode: ColorMode,
    pos_color: String,
    neg_color: String,
    gradient: f64,
}

impl Component for ColumnStyle {
    type Message = ColumnStyleMsg;
    type Properties = ColumnStyleProps;

    fn create(props: Self::Properties, _link: ComponentLink<Self>) -> Self {
        *props.weak_link.borrow_mut() = Some(_link);
        let config = props.config.clone();
        let default_config = props.default_config.clone();
        let gradient = match config.gradient {
            Some(x) => x,
            None => default_config.gradient,
        };

        let (color_mode, pos_color, neg_color) = match config.color_mode {
            Some(x) => (x, config.pos_color.unwrap(), config.neg_color.unwrap()),
            None => (
                Default::default(),
                default_config.pos_color,
                default_config.neg_color,
            ),
        };

        ColumnStyle {
            top: 0,
            left: 0,
            props,
            color_mode,
            pos_color,
            neg_color,
            gradient,
        }
    }

    fn update(&mut self, _msg: Self::Message) -> ShouldRender {
        match _msg {
            ColumnStyleMsg::SetPos(top, left) => {
                self.top = top;
                self.left = left;
                true
            }
            ColumnStyleMsg::FixedChanged(fixed) => {
                self.props.config.fixed = match fixed.parse::<u32>() {
                    Ok(x) if x != self.props.default_config.fixed => Some(x),
                    Ok(_) => None,
                    Err(_) if fixed == "" => Some(0),
                    Err(_) => None,
                };
                self.props.dispatch_config();
                true
            }
            ColumnStyleMsg::ColorEnabledChanged(val) => {
                if val {
                    self.props.config.color_mode = Some(self.color_mode.clone());
                    self.props.config.pos_color = Some(self.pos_color.to_owned());
                    self.props.config.neg_color = Some(self.neg_color.to_owned());
                    if self.color_mode == ColorMode::Gradient {
                        self.props.config.gradient = Some(self.gradient);
                    } else {
                        self.props.config.gradient = None;
                    }
                } else {
                    self.props.config.color_mode = None;
                    self.props.config.pos_color = None;
                    self.props.config.neg_color = None;
                    self.props.config.gradient = None;
                }

                self.props.dispatch_config();
                true
            }
            ColumnStyleMsg::PosColorChanged(val) => {
                self.pos_color = val;
                self.props.config.pos_color = Some(self.pos_color.to_owned());
                self.props.dispatch_config();
                false
            }
            ColumnStyleMsg::NegColorChanged(val) => {
                self.neg_color = val;
                self.props.config.neg_color = Some(self.neg_color.to_owned());
                self.props.dispatch_config();
                false
            }
            ColumnStyleMsg::ColorModeChanged(val) => {
                self.color_mode = val.clone();
                self.props.config.color_mode = Some(val.clone());
                if self.color_mode == ColorMode::Gradient {
                    self.props.config.gradient = Some(self.gradient);
                } else {
                    self.props.config.gradient = None;
                }

                self.props.dispatch_config();
                true
            }
            ColumnStyleMsg::GradientChanged(gradient) => {
                self.props.config.gradient = match gradient.parse::<f64>() {
                    Ok(x) => {
                        self.gradient = x;
                        Some(x)
                    }
                    Err(_) if gradient == "" => {
                        self.gradient = self.props.default_config.gradient;
                        Some(self.props.default_config.gradient)
                    }
                    Err(_) => {
                        self.gradient = self.props.default_config.gradient;
                        None
                    }
                };
                self.props.dispatch_config();
                false
            }
        }
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        true
    }

    fn view(&self) -> Html {
        // Fixed precision control oninput callback
        let fixed_oninput = self
            .props
            .weak_link
            .borrow()
            .as_ref()
            .unwrap()
            .callback(|event: InputData| ColumnStyleMsg::FixedChanged(event.value));

        // Color enabled/disabled oninput callback
        let color_enabled_oninput =
            self.props.weak_link.borrow().as_ref().unwrap().callback(
                move |event: InputData| {
                    let input = event
                        .event
                        .target()
                        .unwrap()
                        .unchecked_into::<web_sys::HtmlInputElement>();
                    ColumnStyleMsg::ColorEnabledChanged(input.checked())
                },
            );

        // Color controls callback
        let pos_color_oninput =
            self.props.weak_link.borrow().as_ref().unwrap().callback(
                |event: InputData| ColumnStyleMsg::PosColorChanged(event.value),
            );

        let neg_color_oninput =
            self.props.weak_link.borrow().as_ref().unwrap().callback(
                |event: InputData| ColumnStyleMsg::NegColorChanged(event.value),
            );

        // Color mode radio callback
        let color_mode_changed = {
            let link = self.props.weak_link.borrow();
            link.as_ref()
                .unwrap()
                .callback(|val: ColorMode| ColumnStyleMsg::ColorModeChanged(val))
        };

        // Gradient input callback
        let gradient_changed =
            self.props.weak_link.borrow().as_ref().unwrap().callback(
                move |event: InputData| ColumnStyleMsg::GradientChanged(event.value),
            );

        let gradient_enabled = self.props.config.color_mode.is_some()
            && self.color_mode == ColorMode::Gradient;

        html! {
            <>
                <style>
                    { &CSS }
                    { format!(":host{{left:{}px;top:{}px;}}", self.left, self.top) }
                </style>
                <div>
                    <div class="row">
                        <input type="checkbox" checked=true disabled=true/>
                        <span id="fixed-examples">{
                            format!("Prec {}", self.props.make_fixed_text())
                        }</span>
                    </div>
                    <div class="row section">
                        <input
                            id="fixed-param"
                            class="parameter indent"
                            type="number"
                            disable=true
                            min="0"
                            step="1"
                            value={ match self.props.config.fixed { None => self.props.default_config.fixed, Some(x) => x } }
                            oninput=fixed_oninput />
                    </div>
                    <div class="row">
                        <input
                            id="color-selected"
                            type="checkbox"
                            oninput=color_enabled_oninput
                            checked={ self.props.config.color_mode.is_some() } />
                        <input
                            id="color-param"
                            class="parameter"
                            type="color"
                            value={ &self.pos_color }
                            disabled={ self.props.config.color_mode.is_none() }
                            oninput=pos_color_oninput />
                        <span class="operator">{ " + / - " }</span>
                        <input
                            id="neg-color-param"
                            class="parameter"
                            type="color"
                            value={ &self.neg_color }
                            disabled={ self.props.config.color_mode.is_none() }
                            oninput=neg_color_oninput />
                    </div>

                    <RadioList<ColorMode>
                        class="indent"
                        disabled={ self.props.config.color_mode.is_none() }
                        values={ vec!(ColorMode::Foreground, ColorMode::Background, ColorMode::Gradient) }
                        selected={ self.color_mode.clone() }
                        on_change={ color_mode_changed } >

                        <span>{ "Foreground" }</span>
                        <span>{ "Background" }</span>
                        <span>{ "Gradient" }</span>

                    </RadioList<ColorMode>>

                    <div class="row indent">
                        <input
                            id="gradient-param"
                            value={ self.gradient }
                            class="parameter indent"
                            oninput={ gradient_changed }
                            disabled={ !gradient_enabled }
                            type="number"
                            min="0" />
                    </div>
                </div>
            </>
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_props(
        config: ColumnStyleConfig,
        default_config: ColumnStyleDefaultConfig,
    ) -> ColumnStyleProps {
        ColumnStyleProps {
            config,
            default_config,
            on_change: Default::default(),
            weak_link: WeakComponentLink::default(),
        }
    }

    #[wasm_bindgen_test]
    pub fn text_fixed_text_default() {
        let config = ColumnStyleConfig::default();
        let mut default_config = ColumnStyleDefaultConfig::default();
        default_config.fixed = 2;
        let props = make_props(config, default_config);
        assert!(props.make_fixed_text() == "0.01");
    }

    #[wasm_bindgen_test]
    pub fn text_fixed_text_override() {
        let mut config = ColumnStyleConfig::default();
        config.fixed = Some(3);
        let mut default_config = ColumnStyleDefaultConfig::default();
        default_config.fixed = 2;
        let props = make_props(config, default_config);
        assert!(props.make_fixed_text() == "0.001");
    }

    #[wasm_bindgen_test]
    pub fn text_fixed_text_zero() {
        let config = ColumnStyleConfig::default();
        let default_config = ColumnStyleDefaultConfig::default();
        let props = make_props(config, default_config);
        assert!(props.make_fixed_text() == "1");
    }
}
