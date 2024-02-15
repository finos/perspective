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

use crate::components::containers::select::*;
use crate::components::modal::{ModalLink, SetModalLink};
use crate::config::*;
use crate::utils::WeakScope;

pub enum DatetimeStyleSimpleMsg {
    DateEnabled,
    TimeEnabled,
    DateStyleChanged(SimpleDatetimeFormat),
    TimeStyleChanged(SimpleDatetimeFormat),
}

#[derive(Properties)]
pub struct DatetimeStyleSimpleProps {
    pub enable_time_config: bool,

    pub config: SimpleDatetimeStyleConfig,

    #[prop_or_default]
    pub on_change: Callback<SimpleDatetimeStyleConfig>,

    #[prop_or_default]
    weak_link: WeakScope<DatetimeStyleSimple>,
}

impl ModalLink<DatetimeStyleSimple> for DatetimeStyleSimpleProps {
    fn weak_link(&self) -> &'_ WeakScope<DatetimeStyleSimple> {
        &self.weak_link
    }
}

impl PartialEq for DatetimeStyleSimpleProps {
    fn eq(&self, _other: &Self) -> bool {
        false
    }
}

/// `DatetimeStyleSimple` represents the variation of the options parameter to
/// `Intl.DatetimeFormat()` which supports `timeStyle` and `dateStyle`. These
/// options are mutually exclusive with those of `DatetimeStyleCustom`, hence
/// the two-struct model for this options parameter.
pub struct DatetimeStyleSimple {
    config: SimpleDatetimeStyleConfig,
}

impl DatetimeStyleSimple {
    /// When this config has changed, we must signal the wrapper element.
    fn dispatch_config(&self, ctx: &Context<Self>) {
        ctx.props().on_change.emit(self.config.clone());
    }
}

impl Component for DatetimeStyleSimple {
    type Message = DatetimeStyleSimpleMsg;
    type Properties = DatetimeStyleSimpleProps;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.set_modal_link();
        Self {
            config: ctx.props().config.clone(),
        }
    }

    // TODO could be more conservative here with re-rendering
    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            DatetimeStyleSimpleMsg::DateEnabled => {
                self.config.date_style = SimpleDatetimeFormat::Short;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleSimpleMsg::TimeEnabled => {
                self.config.time_style = SimpleDatetimeFormat::Medium;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleSimpleMsg::DateStyleChanged(format) => {
                self.config.date_style = format;
                self.dispatch_config(ctx);
                true
            },
            DatetimeStyleSimpleMsg::TimeStyleChanged(format) => {
                self.config.time_style = format;
                self.dispatch_config(ctx);
                true
            },
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

    fn view(&self, ctx: &Context<Self>) -> Html {
        let on_date_reset = ctx.link().callback(|_| DatetimeStyleSimpleMsg::DateEnabled);
        let on_time_reset = ctx.link().callback(|_| DatetimeStyleSimpleMsg::TimeEnabled);

        html! {
            <>
                <div class="column-style-label"><label class="indent">{ "Date Style" }</label></div>
                <div
                    class="section"
                >
                    <input
                        type="checkbox"
                        onchange={on_date_reset}
                        checked={!self.config.date_style.is_short()}
                    />
                    <Select<SimpleDatetimeFormat>
                        wrapper_class="indent"
                        selected={self.config.date_style}
                        on_select={ctx.link().callback(DatetimeStyleSimpleMsg::DateStyleChanged)}
                        values={SimpleDatetimeFormat::values().iter().map(|x| SelectItem::Option(*x)).collect::<Vec<_>>()}
                    />
                </div>
                if ctx.props().enable_time_config {
                    <div
                        class="column-style-label"
                    >
                        <label class="indent">{ "Time Style" }</label>
                    </div>
                    <div
                        class="section"
                    >
                        <input
                            type="checkbox"
                            onchange={on_time_reset}
                            checked={!self.config.time_style.is_medium()}
                        />
                        <Select<SimpleDatetimeFormat>
                            wrapper_class="indent"
                            selected={self.config.time_style}
                            on_select={ctx.link().callback(DatetimeStyleSimpleMsg::TimeStyleChanged)}
                            values={SimpleDatetimeFormat::values().iter().map(|x| SelectItem::Option(*x)).collect::<Vec<_>>()}
                        />
                    </div>
                }
            </>
        }
    }
}
