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

use std::sync::Arc;

use yew::prelude::*;

use crate::components::form::number_field::NumberField;
use crate::components::form::select_field::SelectValueField;
use crate::components::modal::{ModalLink, SetModalLink};
use crate::config::*;
use crate::utils::WeakScope;

pub enum DatetimeStyleCustomMsg {
    FractionalSeconds(Option<f64>),
    Year(CustomDatetimeFormat),
    Month(CustomDatetimeFormat),
    Day(CustomDatetimeFormat),
    Weekday(CustomDatetimeFormat),
    Hour(CustomDatetimeFormat),
    Minute(CustomDatetimeFormat),
    Second(CustomDatetimeFormat),
    Hour12(bool),
}

#[derive(Properties)]
pub struct DatetimeStyleCustomProps {
    pub enable_time_config: bool,

    pub config: CustomDatetimeStyleConfig,

    #[prop_or_default]
    pub on_change: Callback<CustomDatetimeStyleConfig>,

    #[prop_or_default]
    weak_link: WeakScope<DatetimeStyleCustom>,
}

impl ModalLink<DatetimeStyleCustom> for DatetimeStyleCustomProps {
    fn weak_link(&self) -> &'_ WeakScope<DatetimeStyleCustom> {
        &self.weak_link
    }
}

impl PartialEq for DatetimeStyleCustomProps {
    fn eq(&self, _other: &Self) -> bool {
        false
    }
}

/// The custom variation of the options parameter for `Intl.DatetimeFormat`.
/// Complement to `DatetimeStyleSimple`.
pub struct DatetimeStyleCustom {
    config: CustomDatetimeStyleConfig,
}

impl DatetimeStyleCustom {
    fn dispatch_config(&self, ctx: &Context<Self>) {
        ctx.props().on_change.emit(self.config.clone());
    }
}

impl Component for DatetimeStyleCustom {
    type Message = DatetimeStyleCustomMsg;
    type Properties = DatetimeStyleCustomProps;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        Self {
            config: ctx.props().config.clone(),
        }
    }

    // Always re-render when config changes.
    fn changed(&mut self, ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        let mut new_config = ctx.props().config.clone();
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
            DatetimeStyleCustomMsg::Year(year) => {
                self.config.year = year;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleCustomMsg::Month(month) => {
                self.config.month = month;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleCustomMsg::Day(day) => {
                self.config.day = day;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleCustomMsg::Weekday(weekday) => {
                self.config.weekday = weekday;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleCustomMsg::Hour(hour) => {
                self.config.hour = hour;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleCustomMsg::Minute(minute) => {
                self.config.minute = minute;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleCustomMsg::Second(second) => {
                self.config.second = second;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleCustomMsg::FractionalSeconds(fractional) => {
                self.config.fractional_seconds = fractional.unwrap_or_default().floor() as u32;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleCustomMsg::Hour12(hour12) => {
                self.config.hour12 = hour12;
                self.dispatch_config(ctx);
                true
            },
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let all_values = Arc::new(Vec::from(CustomDatetimeFormat::values()));
        let number_values = Arc::new(Vec::from(CustomDatetimeFormat::values_1()));
        let text_values = Arc::new(Vec::from(CustomDatetimeFormat::values_2()));
        type SelectStrField = SelectValueField<&'static str>;
        html! {
            <>
                if ctx.props().enable_time_config {
                    <SelectValueField<CustomDatetimeFormat>
                        label="year"
                        values={number_values.clone()}
                        default_value={CustomDatetimeFormat::TwoDigit}
                        on_change={ctx.link().callback(|x: Option<_>| DatetimeStyleCustomMsg::Year(x.unwrap_or(CustomDatetimeFormat::TwoDigit)))}
                        current_value={self.config.year}
                    />
                    <SelectValueField<CustomDatetimeFormat>
                        label="month"
                        values={all_values.clone()}
                        default_value={CustomDatetimeFormat::Numeric}
                        on_change={ctx.link().callback(|x: Option<_>| DatetimeStyleCustomMsg::Month(x.unwrap_or(CustomDatetimeFormat::Numeric)))}
                        current_value={self.config.month}
                    />
                    <SelectValueField<CustomDatetimeFormat>
                        label="day"
                        values={number_values.clone()}
                        default_value={CustomDatetimeFormat::Numeric}
                        on_change={ctx.link().callback(|x: Option<_>| DatetimeStyleCustomMsg::Day(x.unwrap_or(CustomDatetimeFormat::Numeric)))}
                        current_value={self.config.day}
                    />
                    <SelectValueField<CustomDatetimeFormat>
                        label="weekday"
                        values={text_values.clone()}
                        default_value={CustomDatetimeFormat::Disabled}
                        on_change={ctx.link().callback(|x: Option<_>| DatetimeStyleCustomMsg::Weekday(x.unwrap_or(CustomDatetimeFormat::Disabled)))}
                        current_value={self.config.weekday}
                    />
                    <SelectValueField<CustomDatetimeFormat>
                        label="hour"
                        values={number_values.clone()}
                        default_value={CustomDatetimeFormat::Numeric}
                        on_change={ctx.link().callback(|x: Option<_>| DatetimeStyleCustomMsg::Hour(x.unwrap_or(CustomDatetimeFormat::Numeric)))}
                        current_value={self.config.hour}
                    />
                    <SelectValueField<CustomDatetimeFormat>
                        label="minute"
                        values={number_values.clone()}
                        default_value={CustomDatetimeFormat::Numeric}
                        on_change={ctx.link().callback(|x: Option<_>| DatetimeStyleCustomMsg::Minute(x.unwrap_or(CustomDatetimeFormat::Numeric)))}
                        current_value={self.config.minute}
                    />
                    <SelectValueField<CustomDatetimeFormat>
                        label="second"
                        values={number_values.clone()}
                        default_value={CustomDatetimeFormat::Numeric}
                        on_change={ctx.link().callback(|x: Option<_>| DatetimeStyleCustomMsg::Second(x.unwrap_or(CustomDatetimeFormat::Numeric)))}
                        current_value={self.config.second}
                    />
                    <NumberField
                        label="fractional-seconds"
                        min=0.
                        max=3.
                        step=1.
                        default=0.
                        current_value={self.config.fractional_seconds as f64}
                        on_change={ctx.link().callback(DatetimeStyleCustomMsg::FractionalSeconds)}
                    />
                    <SelectStrField
                        label="hours"
                        values={Arc::new(vec!["12 Hour", "24 Hour"])}
                        default_value="12 Hour"
                        on_change={ctx.link().callback(|x: Option<_>| DatetimeStyleCustomMsg::Hour12(x != Some("24 Hour") ))}
                        current_value={if self.config.hour12 { "12 Hour" } else { "24 Hour" }}
                    />
                }
            </>
        }
    }
}
