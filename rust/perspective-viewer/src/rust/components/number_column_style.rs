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

use wasm_bindgen::*;
use web_sys::*;
use yew::prelude::*;
use yew::*;

use super::containers::radio_list::RadioList;
use super::containers::radio_list_item::RadioListItem;
use super::form::color_range_selector::*;
use super::form::number_input::*;
use super::modal::*;
use super::style::LocalStyle;
use crate::config::*;
use crate::session::Session;
use crate::utils::WeakScope;
use crate::*;

#[derive(PartialEq, Eq, Copy, Clone)]
pub enum Side {
    Fg,
    Bg,
}

use Side::*;

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
    DefaultGradientChanged(f64),
}

/// A `ColumnStyle` component is mounted to the window anchored at the screen
/// position of `elem`.  It needs two input configs, the current configuration
/// object and a default version without `Option<>`
#[derive(Properties)]
pub struct NumberColumnStyleProps {
    #[cfg_attr(test, prop_or_default)]
    pub config: Option<NumberColumnStyleConfig>,

    #[cfg_attr(test, prop_or_default)]
    pub default_config: NumberColumnStyleDefaultConfig,

    #[prop_or_default]
    pub on_change: Callback<NumberColumnStyleConfig>,

    #[prop_or_default]
    pub weak_link: WeakScope<NumberColumnStyle>,

    #[prop_or_default]
    pub session: Option<Session>,

    #[prop_or_default]
    pub column_name: Option<String>,
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

impl NumberColumnStyleProps {
    fn set_default_gradient(&self, ctx: &Context<NumberColumnStyle>) {
        if let Some(session) = self.session.clone() && let Some(column_name) = self.column_name.clone() {
            ctx.link().send_future(async move {
                let view = session.get_view().unwrap();
                let min_max = view.get_min_max(&column_name).await.unwrap();
                let abs_max = max!(min_max.0.abs(), min_max.1.abs());
                let gradient = (abs_max * 100.).round() / 100.;
                NumberColumnStyleMsg::DefaultGradientChanged(gradient)
            });
        }
    }
}

/// The `ColumnStyle` component stores its UI state privately in its own struct,
/// rather than its props (which has two version of this data itself, the
/// JSON serializable config record and the defaults record).
pub struct NumberColumnStyle {
    config: NumberColumnStyleConfig,
    default_config: NumberColumnStyleDefaultConfig,
    fg_mode: NumberForegroundMode,
    bg_mode: NumberBackgroundMode,
    pos_fg_color: String,
    neg_fg_color: String,
    pos_bg_color: String,
    neg_bg_color: String,
    fg_gradient: Option<f64>,
    bg_gradient: Option<f64>,
}

impl Component for NumberColumnStyle {
    type Message = NumberColumnStyleMsg;
    type Properties = NumberColumnStyleProps;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();

        ctx.props().set_default_gradient(ctx);

        Self::reset(
            &ctx.props().config.clone().unwrap_or_default(),
            &ctx.props().default_config.clone(),
        )
    }

    fn changed(&mut self, ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        let mut new = Self::reset(
            &ctx.props().config.clone().unwrap_or_default(),
            &ctx.props().default_config.clone(),
        );
        ctx.props().set_default_gradient(ctx);
        std::mem::swap(self, &mut new);
        true
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            NumberColumnStyleMsg::Reset(config, default_config) => {
                let mut new = Self::reset(&config, &default_config);
                std::mem::swap(self, &mut new);
                true
            },
            NumberColumnStyleMsg::FixedChanged(fixed) => {
                let fixed = match fixed.parse::<u32>() {
                    Ok(x) if x != self.default_config.fixed => Some(x),
                    Ok(_) => None,
                    Err(_) if fixed.is_empty() => Some(0),
                    Err(_) => None,
                };

                self.config.fixed = fixed.map(|x| std::cmp::min(15, x));
                self.dispatch_config(ctx);
                true
            },
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
                        self.config.fg_gradient = Some(self.fg_gradient.unwrap());
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
            },
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
                        self.config.bg_gradient = Some(self.bg_gradient.unwrap());
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
            },
            NumberColumnStyleMsg::PosColorChanged(side, val) => {
                if side == Fg {
                    self.pos_fg_color = val;
                    self.config.pos_fg_color = Some(self.pos_fg_color.to_owned());
                } else {
                    self.pos_bg_color = val;
                    self.config.pos_bg_color = Some(self.pos_bg_color.to_owned());
                }

                self.dispatch_config(ctx);
                false
            },
            NumberColumnStyleMsg::NegColorChanged(side, val) => {
                if side == Fg {
                    self.neg_fg_color = val;
                    self.config.neg_fg_color = Some(self.neg_fg_color.to_owned());
                } else {
                    self.neg_bg_color = val;
                    self.config.neg_bg_color = Some(self.neg_bg_color.to_owned());
                }

                self.dispatch_config(ctx);
                false
            },
            NumberColumnStyleMsg::NumberForeModeChanged(val) => {
                self.fg_mode = val;
                self.config.number_fg_mode = val;
                if self.fg_mode.needs_gradient() {
                    self.config.fg_gradient = Some(self.fg_gradient.unwrap());
                } else {
                    self.config.fg_gradient = None;
                }

                self.dispatch_config(ctx);
                true
            },
            NumberColumnStyleMsg::NumberBackModeChanged(val) => {
                self.bg_mode = val;
                self.config.number_bg_mode = val;
                if self.bg_mode.needs_gradient() {
                    self.config.bg_gradient = Some(self.bg_gradient.unwrap());
                } else {
                    self.config.bg_gradient = None;
                }

                self.dispatch_config(ctx);
                true
            },
            NumberColumnStyleMsg::GradientChanged(side, gradient) => {
                match (side, gradient.parse::<f64>()) {
                    (Fg, Ok(x)) => {
                        self.fg_gradient = Some(x);
                        self.config.fg_gradient = Some(x);
                    },
                    (Fg, Err(_)) if gradient.is_empty() => {
                        self.fg_gradient = Some(self.default_config.fg_gradient);
                        self.config.fg_gradient = Some(self.default_config.fg_gradient);
                    },
                    (Fg, Err(_)) => {
                        self.fg_gradient = Some(self.default_config.fg_gradient);
                        self.config.fg_gradient = None;
                    },
                    (Bg, Ok(x)) => {
                        self.bg_gradient = Some(x);
                        self.config.bg_gradient = Some(x);
                    },
                    (Bg, Err(_)) if gradient.is_empty() => {
                        self.bg_gradient = Some(self.default_config.bg_gradient);
                        self.config.bg_gradient = Some(self.default_config.bg_gradient);
                    },
                    (Bg, Err(_)) => {
                        self.bg_gradient = Some(self.default_config.bg_gradient);
                        self.config.bg_gradient = None;
                    },
                };

                self.dispatch_config(ctx);
                false
            },
            NumberColumnStyleMsg::DefaultGradientChanged(gradient) => {
                self.fg_gradient.get_or_insert(gradient);
                self.bg_gradient.get_or_insert(gradient);
                self.default_config.fg_gradient = gradient;
                self.default_config.bg_gradient = gradient;
                true
            },
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
            .unwrap_or(self.default_config.fixed)
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

        let fg_color_controls = html! {
            <>
                <span class="row">{ "Color" }</span>
                if self.config.number_fg_mode == NumberForegroundMode::Color {
                    <div
                        class="row inner_section"
                    >
                        <ColorRangeSelector ..self.color_props(Fg, ctx) />
                    </div>
                }
            </>
        };

        let fg_bar_controls = html! {
            <>
                <span class="row">{ "Bar" }</span>
                if self.config.number_fg_mode == NumberForegroundMode::Bar {
                    <div
                        class="row inner_section"
                    >
                        <ColorRangeSelector ..self.color_props(Fg, ctx) />
                        <NumberInput ..self.max_value_props(Fg, ctx) />
                    </div>
                }
            </>
        };

        let bg_color_controls = html! {
            <>
                <span class="row">{ "Color" }</span>
                if self.config.number_bg_mode == NumberBackgroundMode::Color {
                    <div
                        class="row inner_section"
                    >
                        <ColorRangeSelector ..self.color_props(Bg, ctx) />
                    </div>
                }
            </>
        };

        let bg_gradient_controls = html! {
            <>
                <span class="row">{ "Gradient" }</span>
                if self.config.number_bg_mode == NumberBackgroundMode::Gradient {
                    <div
                        class="row inner_section"
                    >
                        <ColorRangeSelector ..self.color_props(Bg, ctx) />
                        <NumberInput ..self.max_value_props(Bg, ctx) />
                    </div>
                }
            </>
        };

        let bg_pulse_controls = html! {
            <>
                <span class="row">{ "Pulse (Δ)" }</span>
                if self.config.number_bg_mode == NumberBackgroundMode::Pulse {
                    <div
                        class="row inner_section"
                    >
                        <ColorRangeSelector ..self.color_props(Bg, ctx) />
                    </div>
                }
            </>
        };

        html! {
            <>
                <LocalStyle
                    href={css!("column-style")}
                />
                <div
                    id="column-style-container"
                    class="number-column-style-container"
                >
                    <div
                        class="column-style-label"
                    >
                        <label
                            id="fixed-examples"
                            class="indent"
                        >
                            { self.make_fixed_text(ctx) }
                        </label>
                    </div>
                    <div
                        class="row section"
                    >
                        <input
                            type="checkbox"
                            checked=true
                            disabled=true
                        />
                        <input
                            id="fixed-param"
                            class="parameter"
                            type="number"
                            min="0"
                            step="1"
                            value={fixed_value}
                            oninput={fixed_oninput}
                        />
                    </div>
                    <div
                        class="column-style-label"
                    >
                        <label class="indent">{ "Foreground" }</label>
                    </div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            oninput={fg_enabled_oninput}
                            checked={self.config.number_fg_mode.is_enabled()}
                        />
                        <RadioList<NumberForegroundMode>
                            class="indent"
                            name="foreground-list"
                            disabled={!self.config.number_fg_mode.is_enabled()}
                            selected={selected_fg_mode}
                            on_change={fg_mode_changed}
                        >
                            <RadioListItem<NumberForegroundMode>
                                value={NumberForegroundMode::Color}
                            >
                                { fg_color_controls }
                            </RadioListItem<NumberForegroundMode>>
                            <RadioListItem<NumberForegroundMode>
                                value={NumberForegroundMode::Bar}
                            >
                                { fg_bar_controls }
                            </RadioListItem<NumberForegroundMode>>
                        </RadioList<NumberForegroundMode>>
                    </div>
                    <div
                        class="column-style-label"
                    >
                        <label class="indent">{ "Background" }</label>
                    </div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            oninput={bg_enabled_oninput}
                            checked={!self.config.number_bg_mode.is_disabled()}
                        />
                        <RadioList<NumberBackgroundMode>
                            class="indent"
                            name="background-list"
                            disabled={self.config.number_bg_mode.is_disabled()}
                            selected={selected_bg_mode}
                            on_change={bg_mode_changed}
                        >
                            <RadioListItem<NumberBackgroundMode>
                                value={NumberBackgroundMode::Color}
                            >
                                { bg_color_controls }
                            </RadioListItem<NumberBackgroundMode>>
                            <RadioListItem<NumberBackgroundMode>
                                value={NumberBackgroundMode::Gradient}
                            >
                                { bg_gradient_controls }
                            </RadioListItem<NumberBackgroundMode>>
                            <RadioListItem<NumberBackgroundMode>
                                value={NumberBackgroundMode::Pulse}
                            >
                                { bg_pulse_controls }
                            </RadioListItem<NumberBackgroundMode>>
                        </RadioList<NumberBackgroundMode>>
                    </div>
                </div>
            </>
        }
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
            } if *pos_color == self.default_config.pos_fg_color
                && *neg_color == self.default_config.neg_fg_color =>
            {
                config.pos_fg_color = None;
                config.neg_fg_color = None;
            },
            _ => {},
        };

        match &self.config {
            NumberColumnStyleConfig {
                pos_bg_color: Some(pos_color),
                neg_bg_color: Some(neg_color),
                ..
            } if *pos_color == self.default_config.pos_bg_color
                && *neg_color == self.default_config.neg_bg_color =>
            {
                config.pos_bg_color = None;
                config.neg_bg_color = None;
            },
            _ => {},
        };

        ctx.props().on_change.emit(config);
    }

    fn color_props(&self, side: Side, ctx: &Context<Self>) -> ColorRangeProps {
        let on_pos_color = ctx
            .link()
            .callback(move |x| NumberColumnStyleMsg::PosColorChanged(side, x));
        let on_neg_color = ctx
            .link()
            .callback(move |x| NumberColumnStyleMsg::NegColorChanged(side, x));

        props!(ColorRangeProps {
            pos_color: if side == Fg {
                &self.pos_fg_color
            } else {
                &self.pos_bg_color
            }
            .to_owned(),
            neg_color: if side == Fg {
                &self.neg_fg_color
            } else {
                &self.neg_bg_color
            }
            .to_owned(),
            on_pos_color,
            on_neg_color
        })
    }

    fn max_value_props(&self, side: Side, ctx: &Context<Self>) -> NumberInputProps {
        let on_max_value = ctx
            .link()
            .callback(move |x| NumberColumnStyleMsg::GradientChanged(side, x));

        props!(NumberInputProps {
            max_value: if side == Fg {
                self.fg_gradient.unwrap_or_default()
            } else {
                self.bg_gradient.unwrap_or_default()
            },
            on_max_value
        })
    }

    /// Human readable precision hint, e.g. "Prec 0.001" for `{fixed: 3}`.
    fn make_fixed_text(&self, _ctx: &Context<Self>) -> String {
        let fixed = match self.config.fixed {
            Some(x) if x > 0 => format!("0.{}1", "0".repeat(x as usize - 1)),
            None if self.default_config.fixed > 0 => {
                let n = self.default_config.fixed as usize - 1;
                format!("0.{}1", "0".repeat(n))
            },
            Some(_) | None => "1".to_owned(),
        };

        format!("Prec {}", fixed)
    }

    fn reset(
        config: &NumberColumnStyleConfig,
        default_config: &NumberColumnStyleDefaultConfig,
    ) -> Self {
        let mut config = config.clone();
        let fg_gradient = config.fg_gradient;
        let bg_gradient = config.bg_gradient;

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
            },
        };

        let bg_mode = match config.number_bg_mode {
            NumberBackgroundMode::Disabled => NumberBackgroundMode::default(),
            x => {
                config.pos_bg_color = Some(pos_bg_color.to_owned());
                config.neg_bg_color = Some(neg_bg_color.to_owned());
                x
            },
        };

        Self {
            config,
            default_config: default_config.clone(),
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
