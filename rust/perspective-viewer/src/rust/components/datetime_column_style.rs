////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::color_selector::*;
use super::containers::radio_list::RadioList;
use super::containers::radio_list_item::RadioListItem;
use super::containers::select::*;
use super::modal::{ModalLink, SetModalLink};
use crate::config::*;
use crate::utils::WeakScope;
use crate::*;
use lazy_static::*;
use wasm_bindgen::*;
use web_sys::*;
use yew::prelude::*;
use yew::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = supportedValuesOf, js_namespace = Intl)]
    pub fn supported_values_of(s: &JsValue) -> js_sys::Array;
}

lazy_static! {
    static ref ALL_TIMEZONES: Vec<SelectItem<String>> =
        supported_values_of(&JsValue::from("timeZone"))
            .iter()
            .map(|x| SelectItem::Option(x.as_string().unwrap()))
            .collect();
    static ref USER_TIMEZONE: String = js_sys::Reflect::get(
        &js_sys::Intl::DateTimeFormat::new(&json!([]), &json!({})).resolved_options(),
        &JsValue::from("timeZone")
    )
    .unwrap()
    .as_string()
    .unwrap();
}

pub static CSS: &str = include_str!("../../../build/css/column-style.css");

pub enum DatetimeColumnStyleMsg {
    Reset(DatetimeColumnStyleConfig),
    TimezoneEnabled,
    DateEnabled,
    TimeEnabled,
    DateStyleChanged(DatetimeFormat),
    TimeStyleChanged(DatetimeFormat),
    TimezoneChanged(String),
    ColorModeEnabled(bool),
    ColorModeChanged(DatetimeColorMode),
    ColorChanged(String),
}

#[derive(Properties)]
pub struct DatetimeColumnStyleProps {
    pub enable_time_config: bool,

    #[prop_or_default]
    pub config: DatetimeColumnStyleConfig,

    #[prop_or_default]
    pub default_config: DatetimeColumnStyleDefaultConfig,

    #[prop_or_default]
    pub on_change: Callback<DatetimeColumnStyleConfig>,

    #[prop_or_default]
    weak_link: WeakScope<DatetimeColumnStyle>,
}

impl ModalLink<DatetimeColumnStyle> for DatetimeColumnStyleProps {
    fn weak_link(&self) -> &'_ WeakScope<DatetimeColumnStyle> {
        &self.weak_link
    }
}

impl PartialEq for DatetimeColumnStyleProps {
    fn eq(&self, other: &Self) -> bool {
        self.config == other.config
    }
}

/// The `ColumnStyle` component stores its UI state privately in its own struct,
/// rather than its props (which has two version of this data itself, the
/// JSON serializable config record and the defaults record).
pub struct DatetimeColumnStyle {
    config: DatetimeColumnStyleConfig,
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
            .unwrap_or_else(|| ctx.props().default_config.color.to_owned());

        let color_props = props!(ColorProps { color, on_color });
        if let Some(x) = &self.config.datetime_color_mode && x == mode {
            html_template! {
                <span class="row">{ title }</span>
                <div class="row inner_section">
                    <ColorSelector ..color_props />
                </div>
            }
        } else {
            html! {
                <span class="row">{ title }</span>
            }
        }
    }
}

impl Component for DatetimeColumnStyle {
    type Message = DatetimeColumnStyleMsg;
    type Properties = DatetimeColumnStyleProps;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        DatetimeColumnStyle {
            config: ctx.props().config.clone(),
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
            DatetimeColumnStyleMsg::DateEnabled => {
                self.config.date_style = DatetimeFormat::Short;
                self.dispatch_config(ctx);
                true
            }
            DatetimeColumnStyleMsg::TimeEnabled => {
                self.config.time_style = DatetimeFormat::Medium;
                self.dispatch_config(ctx);
                true
            }
            DatetimeColumnStyleMsg::DateStyleChanged(format) => {
                self.config.date_style = format;
                self.dispatch_config(ctx);
                true
            }
            DatetimeColumnStyleMsg::TimeStyleChanged(format) => {
                self.config.time_style = format;
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

        let on_date_reset = ctx.link().callback(|_| DatetimeColumnStyleMsg::DateEnabled);
        let on_time_reset = ctx.link().callback(|_| DatetimeColumnStyleMsg::TimeEnabled);

        // TODO this checkbox should be disabled if the timezone is local but
        // can't set `checked=false`.
        html_template! {
            <style>
                { &CSS }
            </style>
            <div id="column-style-container">

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

                    <div class="column-style-label">
                        <label class="indent">{ "Time Style" }</label>
                    </div>
                    <div class="section">
                        <input
                            type="checkbox"
                            onchange={ on_time_reset }
                            checked={ !self.config.time_style.is_medium() } />

                        <Select<DatetimeFormat>
                            wrapper_class="indent"
                            selected={ self.config.time_style }
                            on_select={ ctx.link().callback(DatetimeColumnStyleMsg::TimeStyleChanged) }
                            values={ DatetimeFormat::values().iter().map(|x| SelectItem::Option(*x)).collect::<Vec<_>>() } >
                        </Select<DatetimeFormat>>
                    </div>
                }


                <div class="column-style-label">
                    <label class="indent">{ "Date Style" }</label>
                </div>
                <div class="section">
                    <input
                        type="checkbox"
                        onchange={ on_date_reset }
                        checked={ !self.config.date_style.is_short() } />

                    <Select<DatetimeFormat>
                        wrapper_class="indent"
                        selected={ self.config.date_style }
                        on_select={ ctx.link().callback(DatetimeColumnStyleMsg::DateStyleChanged) }
                        values={ DatetimeFormat::values().iter().map(|x| SelectItem::Option(*x)).collect::<Vec<_>>() } >
                    </Select<DatetimeFormat>>
                </div>

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
            </div>
        }
    }
}
