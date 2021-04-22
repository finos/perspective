////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::WeakComponentLink;

use serde::{Deserialize, Serialize};
use wasm_bindgen::JsCast;
use wasm_bindgen::*;
use yew::prelude::*;

pub static CSS: &str = include_str!("../../../dist/css/column-style.css");

pub enum ColumnStyleMsg {
    SetPos(u32, u32),
    FixedChanged(String),
    ColorEnabledChanged(bool),
    PosColorChanged(String),
    NegColorChanged(String),
    ColorModeChanged(ColorMode),
    GradientChanged(String),
}

#[derive(Properties, Clone)]
pub struct ColumnStyleProps {
    pub elem: web_sys::HtmlElement,
    pub config: ColumnStyleConfig,
    pub default_config: ColumnStyleDefaultConfig,

    #[prop_or_default]
    pub weak_link: WeakComponentLink<ColumnStyle>,
}

impl ColumnStyleProps {
    fn dispatch_config(&self) {
        let mut event_init = web_sys::CustomEventInit::new();
        event_init.detail(&JsValue::from_serde(&self.config).unwrap());
        let event = web_sys::CustomEvent::new_with_event_init_dict(
            "perspective-column-style-change",
            &event_init,
        );

        self.elem.dispatch_event(&event.unwrap()).unwrap();
    }
}

pub struct ColumnStyle {
    props: ColumnStyleProps,
    top: u32,
    left: u32,
    color_mode: ColorMode,
    pos_color: String,
    neg_color: String,
    gradient: f64,
}

#[derive(PartialEq, Serialize, Deserialize, Clone)]
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

#[derive(Serialize, Deserialize, Clone)]
pub struct ColumnStyleDefaultConfig {
    pub gradient: f64,
    pub fixed: u32,
    pub pos_color: String,
    pub neg_color: String,
}

impl ColumnStyle {
    /// Human readable precision hint, e.g. "Prec 0.001" for `{fixed: 3}`.
    fn make_fixed_text(&self) -> String {
        match self.props.config.fixed {
            Some(x) if x > 0 => format!("0.{}1", "0".repeat(x as usize - 1)),
            None if self.props.default_config.fixed > 0 => {
                let n = self.props.default_config.fixed as usize - 1;
                format!("0.{}1", "0".repeat(n))
            }
            Some(_) | None => "1".to_owned(),
        }
    }
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
        let fixed_oninput = self.props.weak_link.borrow().as_ref().unwrap().callback(
            move |event: InputData| ColumnStyleMsg::FixedChanged(event.value),
        );

        // Color enabled/disabled oninput callback
        let color_enabled_oninput =
            self.props.weak_link.borrow().as_ref().unwrap().callback(
                move |event: InputData| {
                    ColumnStyleMsg::ColorEnabledChanged(
                        event
                            .event
                            .target()
                            .unwrap()
                            .unchecked_into::<web_sys::HtmlInputElement>()
                            .checked(),
                    )
                },
            );

        let pos_color_oninput =
            self.props.weak_link.borrow().as_ref().unwrap().callback(
                move |event: InputData| ColumnStyleMsg::PosColorChanged(event.value),
            );

        let neg_color_oninput =
            self.props.weak_link.borrow().as_ref().unwrap().callback(
                move |event: InputData| ColumnStyleMsg::NegColorChanged(event.value),
            );

        let color_mode_changed =
            self.props.weak_link.borrow().as_ref().unwrap().callback(
                move |event: InputData| {
                    ColumnStyleMsg::ColorModeChanged(match &event.value[..] {
                        "foreground" => ColorMode::Foreground,
                        "background" => ColorMode::Background,
                        "gradient" => ColorMode::Gradient,
                        _ => unimplemented!(),
                    })
                },
            );

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
                    <div>
                        <input type="checkbox" checked=true disabled=true/>
                        <span id="fixed-examples">{
                            format!("Prec {}", self.make_fixed_text())
                        }</span>
                    </div>
                    <div class="section">
                        <span></span>
                        <input
                            class="parameter"
                            disable=true
                            id="fixed-param"
                            value={ match self.props.config.fixed { None => self.props.default_config.fixed, Some(x) => x } }
                            oninput=fixed_oninput
                            type="number"
                            min="0"
                            step="1" />
                    </div>
                    <div>
                        <input
                            id="color-selected"
                            type="checkbox"
                            oninput=color_enabled_oninput
                            checked={ self.props.config.color_mode.is_some() } />
                        <input
                            id="color-param"
                            value={ &self.pos_color }
                            disabled={ self.props.config.color_mode.is_none() }
                            oninput=pos_color_oninput
                            class="parameter"
                            type="color" />
                        <span class="operator">{ " + / - " }</span>
                        <input
                            id="neg-color-param"
                            value={ &self.neg_color }
                            disabled={ self.props.config.color_mode.is_none() }
                            oninput=neg_color_oninput
                            class="parameter"
                            type="color" />
                    </div>
                    <div class="indent1">
                        <input
                            id="color-mode-1"
                            name="color-mode"
                            type="radio"
                            value="foreground"
                            class="parameter"
                            oninput=color_mode_changed.clone()
                            disabled=self.props.config.color_mode.is_none()
                            checked={ self.color_mode == ColorMode::Foreground } />
                        <span>{ "Foreground" }</span>
                    </div>
                    <div class="indent1">
                        <input
                            id="color-mode-2"
                            name="color-mode"
                            type="radio"
                            value="background"
                            class="parameter"
                            oninput=color_mode_changed.clone()
                            disabled=self.props.config.color_mode.is_none()
                            checked={ self.color_mode == ColorMode::Background } />
                        <span>{ "Background" }</span>
                    </div>
                    <div class="indent1">
                        <input
                            id="color-mode-3"
                            name="color-mode"
                            type="radio"
                            value="gradient"
                            class="parameter"
                            oninput=color_mode_changed
                            disabled={ self.props.config.color_mode.is_none() }
                            checked={ self.color_mode == ColorMode::Gradient } />
                        <span>{ "Gradient" }</span>
                    </div>
                    <div class="indent1">
                        <span></span>
                        <input
                            id="gradient-param"
                            value={ self.gradient }
                            class="parameter"
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
