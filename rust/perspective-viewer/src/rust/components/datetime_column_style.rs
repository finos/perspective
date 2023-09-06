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

mod custom;
mod simple;

use std::sync::LazyLock;

use derivative::Derivative;
use wasm_bindgen::*;
use web_sys::*;
use yew::prelude::*;
use yew::*;

use super::containers::radio_list::RadioList;
use super::containers::radio_list_item::RadioListItem;
use super::containers::select::*;
use super::form::color_selector::*;
use super::modal::{ModalLink, SetModalLink};
use super::style::LocalStyle;
use crate::components::datetime_column_style::custom::DatetimeStyleCustom;
use crate::components::datetime_column_style::simple::DatetimeStyleSimple;
use crate::config::*;
use crate::utils::WeakScope;
use crate::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = supportedValuesOf, js_namespace = Intl)]
    pub fn supported_values_of(s: &JsValue) -> js_sys::Array;
}

static ALL_TIMEZONES: LazyLock<Vec<SelectItem<String>>> = LazyLock::new(|| {
    supported_values_of(&JsValue::from("timeZone"))
        .iter()
        .map(|x| SelectItem::Option(x.as_string().unwrap()))
        .collect()
});

static USER_TIMEZONE: LazyLock<String> = LazyLock::new(|| {
    js_sys::Reflect::get(
        &js_sys::Intl::DateTimeFormat::new(&json!([]), &json!({})).resolved_options(),
        &JsValue::from("timeZone"),
    )
    .unwrap()
    .as_string()
    .unwrap()
});

pub enum DatetimeColumnStyleMsg {
    Reset(DatetimeColumnStyleConfig),
    SimpleDatetimeStyleConfigChanged(SimpleDatetimeStyleConfig),
    CustomDatetimeStyleConfigChanged(CustomDatetimeStyleConfig),
    TimezoneEnabled,
    TimezoneChanged(String),
    ColorModeEnabled(bool),
    ColorModeChanged(DatetimeColorMode),
    ColorChanged(String),
}

#[derive(Properties, Derivative)]
#[derivative(Debug)]
pub struct DatetimeColumnStyleProps {
    pub enable_time_config: bool,

    pub config: Option<DatetimeColumnStyleConfig>,

    pub default_config: Option<DatetimeColumnStyleDefaultConfig>,

    #[prop_or_default]
    pub on_change: Callback<DatetimeColumnStyleConfig>,

    #[prop_or_default]
    #[derivative(Debug = "ignore")]
    weak_link: WeakScope<DatetimeColumnStyle>,
}

impl ModalLink<DatetimeColumnStyle> for DatetimeColumnStyleProps {
    fn weak_link(&self) -> &'_ WeakScope<DatetimeColumnStyle> {
        &self.weak_link
    }
}

impl PartialEq for DatetimeColumnStyleProps {
    fn eq(&self, _other: &Self) -> bool {
        false
    }
}

/// The `ColumnStyle` component stores its UI state privately in its own struct,
/// rather than its props (which has two version of this data itself, the
/// JSON serializable config record and the defaults record).
#[derive(Debug)]
pub struct DatetimeColumnStyle {
    config: DatetimeColumnStyleConfig,
    default_config: DatetimeColumnStyleDefaultConfig,
}

impl DatetimeColumnStyle {
    /// When this config has changed, we must signal the wrapper element.
    fn dispatch_config(&self, ctx: &Context<Self>) {
        ctx.props().on_change.emit(self.config.clone());
    }

    /// Generate a color selector component for a specific `StringColorMode`
    /// variant.
    fn color_select_row(&self, ctx: &Context<Self>, mode: &DatetimeColorMode, title: &str) -> Html {
        let on_color = ctx.link().callback(DatetimeColumnStyleMsg::ColorChanged);
        let color = self
            .config
            .color
            .clone()
            .unwrap_or_else(|| self.default_config.color.to_owned());

        let color_props = props!(ColorProps { color, on_color });
        match &self.config.datetime_color_mode {
            Some(x) if x == mode => {
                html_template! {
                    <span class="row">{ title }</span>
                    <div class="row inner_section">
                        <ColorSelector ..color_props />
                    </div>
                }
            }
            _ => {
                html! {
                    <span class="row">{ title }</span>
                }
            }
        }
    }
}

impl Component for DatetimeColumnStyle {
    type Message = DatetimeColumnStyleMsg;
    type Properties = DatetimeColumnStyleProps;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        Self {
            config: ctx.props().config.clone().unwrap_or_default(),
            default_config: ctx.props().default_config.clone().unwrap_or_default(),
        }
    }

    // Always re-render when config changes.
    fn changed(&mut self, ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        let mut new_config = ctx.props().config.clone().unwrap_or_default();
        if self.config != new_config {
            std::mem::swap(&mut self.config, &mut new_config);
            true
        } else {
            false
        }
    }

    // TODO could be more conservative here with re-rendering
    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            DatetimeColumnStyleMsg::Reset(config) => {
                self.config = config;
                true
            }
            DatetimeColumnStyleMsg::TimezoneEnabled => {
                self.config.time_zone = None;
                self.dispatch_config(ctx);
                true
            }
            DatetimeColumnStyleMsg::TimezoneChanged(val) => {
                if *USER_TIMEZONE != val {
                    self.config.time_zone = Some(val);
                } else {
                    self.config.time_zone = None;
                }

                self.dispatch_config(ctx);
                true
            }
            DatetimeColumnStyleMsg::ColorModeEnabled(enabled) => {
                if enabled {
                    self.config.datetime_color_mode = Some(DatetimeColorMode::default());
                } else {
                    self.config.datetime_color_mode = None;
                    self.config.color = None;
                }

                self.dispatch_config(ctx);
                true
            }
            DatetimeColumnStyleMsg::ColorModeChanged(mode) => {
                self.config.datetime_color_mode = Some(mode);
                self.dispatch_config(ctx);
                true
            }
            DatetimeColumnStyleMsg::ColorChanged(color) => {
                self.config.color = Some(color);
                self.dispatch_config(ctx);
                true
            }

            DatetimeColumnStyleMsg::SimpleDatetimeStyleConfigChanged(simple) => {
                self.config._format = DatetimeFormatType::Simple(simple);
                self.dispatch_config(ctx);
                true
            }
            DatetimeColumnStyleMsg::CustomDatetimeStyleConfigChanged(custom) => {
                self.config._format = DatetimeFormatType::Custom(custom);
                self.dispatch_config(ctx);
                true
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let color_enabled_oninput = ctx.link().callback(move |event: InputEvent| {
            let input = event
                .target()
                .unwrap()
                .unchecked_into::<web_sys::HtmlInputElement>();
            DatetimeColumnStyleMsg::ColorModeEnabled(input.checked())
        });

        let selected_color_mode = self.config.datetime_color_mode.unwrap_or_default();
        let color_mode_changed = ctx
            .link()
            .callback(DatetimeColumnStyleMsg::ColorModeChanged);

        let foreground_controls =
            self.color_select_row(ctx, &DatetimeColorMode::Foreground, "Foreground");

        let background_controls =
            self.color_select_row(ctx, &DatetimeColorMode::Background, "Background");

        let on_time_zone_reset = ctx
            .link()
            .callback(|_| DatetimeColumnStyleMsg::TimezoneEnabled);

        html_template! {
            <LocalStyle href={ css!("column-style") } />
            <div id="column-style-container" class="datetime-column-style-container">
                <div class="column-style-label">
                    <label class="indent">{ "Color" }</label>
                </div>
                <div class="section">
                    <input
                        type="checkbox"
                        oninput={ color_enabled_oninput }
                        checked={ self.config.datetime_color_mode.is_some() } />

                    <RadioList<DatetimeColorMode>
                        class="indent"
                        name="color-radio-list"
                        disabled={ self.config.datetime_color_mode.is_none() }
                        selected={ selected_color_mode }
                        on_change={ color_mode_changed } >

                        <RadioListItem<DatetimeColorMode>
                            value={ DatetimeColorMode::Foreground }>
                            { foreground_controls }
                        </RadioListItem<DatetimeColorMode>>
                        <RadioListItem<DatetimeColorMode>
                            value={ DatetimeColorMode::Background }>
                            { background_controls }
                        </RadioListItem<DatetimeColorMode>>
                    </RadioList<DatetimeColorMode>>
                </div>

                if ctx.props().enable_time_config {
                    <div class="column-style-label">
                        <label class="indent">{ "Timezone" }</label>
                    </div>
                    <div class="section">
                        <input
                            type="checkbox"
                            onchange={ on_time_zone_reset }
                            checked={ self.config.time_zone.is_some() } />

                        <Select<String>
                            wrapper_class="indent"
                            values={ ALL_TIMEZONES.iter().cloned().collect::<Vec<_>>() }
                            selected={ self.config.time_zone.as_ref().unwrap_or(&*USER_TIMEZONE).clone() }
                            on_select={ ctx.link().callback(DatetimeColumnStyleMsg::TimezoneChanged) }>
                        </Select<String>>
                    </div>
                }


                if let DatetimeFormatType::Simple(config) = &self.config._format {
                    if ctx.props().enable_time_config {
                        <button
                            id="datetime_format"
                            data-title={ "Simple" }
                            data-title-hover={ "Switch to Custom" }
                            onclick={ ctx.link().callback(|_| DatetimeColumnStyleMsg::CustomDatetimeStyleConfigChanged(CustomDatetimeStyleConfig::default()))}>
                        </button>
                    }

                    <DatetimeStyleSimple
                        enable_time_config={ ctx.props().enable_time_config }
                        on_change={ ctx.link().callback(DatetimeColumnStyleMsg::SimpleDatetimeStyleConfigChanged) }
                        config={ config.clone() }>
                    </DatetimeStyleSimple>
                } else if let DatetimeFormatType::Custom(config) = &self.config._format {
                    if ctx.props().enable_time_config {
                        <button
                            id="datetime_format"
                            data-title={ "Custom" }
                            data-title-hover={ "Switch to Simple" }
                            onclick={ ctx.link().callback(|_| DatetimeColumnStyleMsg::SimpleDatetimeStyleConfigChanged(SimpleDatetimeStyleConfig::default()))}>
                        </button>
                    }

                    <DatetimeStyleCustom
                        enable_time_config={ ctx.props().enable_time_config }
                        on_change={ ctx.link().callback(DatetimeColumnStyleMsg::CustomDatetimeStyleConfigChanged) }
                        config={ config.clone() }>
                    </DatetimeStyleCustom>
                }

            </div>
        }
    }
}
