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

use yew::prelude::*;

use crate::components::containers::select::{Select, SelectItem};
use crate::components::modal::{ModalLink, SetModalLink};
use crate::config::*;
use crate::utils::WeakScope;
use crate::*;

pub enum DatetimeStyleCustomMsg {
    FractionalSeconds(String),
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
                let fractional = match fractional.parse::<u32>() {
                    Ok(x) => x,
                    Err(_) if fractional.is_empty() => 0,
                    Err(_) => 0,
                };

                self.config.fractional_seconds = fractional;
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
        let fractional_oninput = |f: fn(String) -> DatetimeStyleCustomMsg| {
            ctx.link().callback(move |event: InputEvent| {
                f(event
                    .target()
                    .unwrap()
                    .unchecked_into::<web_sys::HtmlInputElement>()
                    .value())
            })
        };

        let all_values = CustomDatetimeFormat::values()
            .iter()
            .map(|x| SelectItem::Option(*x))
            .collect::<Vec<_>>();

        let number_values = CustomDatetimeFormat::values_1()
            .iter()
            .map(|x| SelectItem::Option(*x))
            .collect::<Vec<_>>();

        let text_values = CustomDatetimeFormat::values_2()
            .iter()
            .map(|x| SelectItem::Option(*x))
            .collect::<Vec<_>>();

        let hour12_ = {
            let hour12 = self.config.hour12;
            ctx.link()
                .callback(move |_: Event| DatetimeStyleCustomMsg::Hour12(!hour12))
        };

        html! {
            <>
                if ctx.props().enable_time_config {
                    <div class="column-style-label"><label class="indent">{ "Year" }</label></div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            onchange={ctx.link().callback(|_| DatetimeStyleCustomMsg::Year(CustomDatetimeFormat::TwoDigit))}
                            checked={self.config.year != CustomDatetimeFormat::TwoDigit}
                        />
                        <Select<CustomDatetimeFormat>
                            wrapper_class="indent"
                            selected={self.config.year}
                            on_select={ctx.link().callback(DatetimeStyleCustomMsg::Year)}
                            values={number_values.clone()}
                        />
                    </div>
                    <div class="column-style-label"><label class="indent">{ "Month" }</label></div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            onchange={ctx.link().callback(|_| DatetimeStyleCustomMsg::Month(CustomDatetimeFormat::Numeric))}
                            checked={self.config.month != CustomDatetimeFormat::Numeric}
                        />
                        <Select<CustomDatetimeFormat>
                            wrapper_class="indent"
                            selected={self.config.month}
                            on_select={ctx.link().callback(DatetimeStyleCustomMsg::Month)}
                            values={all_values.clone()}
                        />
                    </div>
                    <div class="column-style-label"><label class="indent">{ "Day" }</label></div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            onchange={ctx.link().callback(|_| DatetimeStyleCustomMsg::Day(CustomDatetimeFormat::Numeric))}
                            checked={self.config.day != CustomDatetimeFormat::Numeric}
                        />
                        <Select<CustomDatetimeFormat>
                            wrapper_class="indent"
                            selected={self.config.day}
                            on_select={ctx.link().callback(DatetimeStyleCustomMsg::Day)}
                            values={number_values.clone()}
                        />
                    </div>
                    <div
                        class="column-style-label"
                    >
                        <label class="indent">{ "Weekday" }</label>
                    </div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            onchange={ctx.link().callback(|_| DatetimeStyleCustomMsg::Weekday(CustomDatetimeFormat::Disabled))}
                            checked={self.config.weekday != CustomDatetimeFormat::Disabled}
                        />
                        <Select<CustomDatetimeFormat>
                            wrapper_class="indent"
                            selected={self.config.weekday}
                            on_select={ctx.link().callback(DatetimeStyleCustomMsg::Weekday)}
                            values={text_values.clone()}
                        />
                    </div>
                    <div class="column-style-label"><label class="indent">{ "Hour" }</label></div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            onchange={ctx.link().callback(|_| DatetimeStyleCustomMsg::Hour(CustomDatetimeFormat::Numeric))}
                            checked={self.config.hour != CustomDatetimeFormat::Numeric}
                        />
                        <Select<CustomDatetimeFormat>
                            wrapper_class="indent"
                            selected={self.config.hour}
                            on_select={ctx.link().callback(DatetimeStyleCustomMsg::Hour)}
                            values={number_values.clone()}
                        />
                    </div>
                    <div class="column-style-label"><label class="indent">{ "Minute" }</label></div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            onchange={ctx.link().callback(|_| DatetimeStyleCustomMsg::Minute(CustomDatetimeFormat::Numeric))}
                            checked={self.config.minute != CustomDatetimeFormat::Numeric}
                        />
                        <Select<CustomDatetimeFormat>
                            wrapper_class="indent"
                            selected={self.config.minute}
                            on_select={ctx.link().callback(DatetimeStyleCustomMsg::Minute)}
                            values={number_values.clone()}
                        />
                    </div>
                    <div
                        class="column-style-label"
                    >
                        <label class="indent">{ "Seconds" }</label>
                    </div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            onchange={ctx.link().callback(|_| DatetimeStyleCustomMsg::Second(CustomDatetimeFormat::Numeric))}
                            checked={self.config.second != CustomDatetimeFormat::Numeric}
                        />
                        <Select<CustomDatetimeFormat>
                            wrapper_class="indent"
                            selected={self.config.second}
                            on_select={ctx.link().callback(DatetimeStyleCustomMsg::Second)}
                            values={number_values.clone()}
                        />
                    </div>
                    <div
                        class="column-style-label"
                    >
                        <label class="indent">{ "Fractional Seconds" }</label>
                    </div>
                    <div
                        class="row section"
                    >
                        <input
                            type="checkbox"
                            onchange={ctx.link().callback(|_| DatetimeStyleCustomMsg::FractionalSeconds("0".to_owned()))}
                            checked={self.config.fractional_seconds != 0}
                        />
                        <input
                            id="fixed-param"
                            class="parameter"
                            type="number"
                            min="0"
                            step="1"
                            max="3"
                            value={self.config.fractional_seconds.to_string()}
                            oninput={fractional_oninput(DatetimeStyleCustomMsg::FractionalSeconds)}
                        />
                    </div>
                    <div
                        class="column-style-label"
                    >
                        <label class="indent">{ "12/24 Hours" }</label>
                    </div>
                    <div
                        class="section"
                    >
                        <input type="checkbox" onchange={hour12_} checked={!self.config.hour12} />
                        <span >{ if self.config.hour12 { "12 Hour" } else { "24 hour" } }</span>
                    </div>
                }
            </>
        }
    }
}
