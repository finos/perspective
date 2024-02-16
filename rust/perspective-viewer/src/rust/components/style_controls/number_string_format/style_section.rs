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

use yew::html;

use super::CustomNumberFormat;
use crate::components::form::select_field::SelectField;
use crate::components::style_controls::{CustomNumberFormatMsg, NumberStyle};
use crate::config::*;

impl CustomNumberFormat {
    pub fn style_section(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        let section = match self.config._style.as_ref() {
            Some(NumberFormatStyle::Currency(style)) => Some(html! {
                <>
                    <SelectField<CurrencyCode>
                        label="Currency"
                        on_change={ctx.link().callback(CustomNumberFormatMsg::CurrencyCode)}
                        current_value={style.currency}
                    />
                    <SelectField<CurrencyDisplay>
                        label="Currency Display"
                        on_change={ctx.link().callback(CustomNumberFormatMsg::CurrencyDisplay)}
                        current_value={style.currency_display.unwrap_or_default()}
                    />
                    <SelectField<CurrencySign>
                        label="Currency Sign"
                        on_change={ctx.link().callback(CustomNumberFormatMsg::CurrencySign)}
                        current_value={style.currency_sign.unwrap_or_default()}
                    />
                </>
            }),
            Some(NumberFormatStyle::Unit(style)) => Some(html!(
                <>
                    <SelectField<Unit>
                        label="Unit"
                        on_change={ctx.link().callback(CustomNumberFormatMsg::Unit)}
                        current_value={style.unit}
                    />
                    <SelectField<UnitDisplay>
                        label="Unit Display"
                        on_change={ctx.link().callback(CustomNumberFormatMsg::UnitDisplay)}
                        current_value={style.unit_display.unwrap_or_default()}
                    />
                </>
            )),
            _ => None,
        };
        html! {
            <>
                <SelectField<NumberStyle>
                    required=true
                    label="Style"
                    current_value={self.style}
                    on_change={ctx.link().callback(CustomNumberFormatMsg::StyleChanged)}
                />
                { section }
            </>
        }
    }
}
