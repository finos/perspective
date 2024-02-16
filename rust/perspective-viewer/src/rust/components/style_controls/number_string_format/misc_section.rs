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

use web_sys::HtmlInputElement;
use yew::{html, TargetCast};

use super::CustomNumberFormat;
use crate::components::form::optional_field::OptionalField;
use crate::components::form::select_field::SelectField;
use crate::components::style_controls::{CustomNumberFormatMsg, NotationName};
use crate::config::*;

impl CustomNumberFormat {
    pub fn misc_section(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        let compact_display_checkbox = if let Some(Notation::Compact(val)) = self.config._notation {
            let cb = ctx.link().callback(|event: web_sys::Event| {
                let checked = event
                    .target_dyn_into::<HtmlInputElement>()
                    .unwrap()
                    .checked();
                let long = if checked {
                    CompactDisplay::Long
                } else {
                    CompactDisplay::Short
                };
                CustomNumberFormatMsg::CompactDisplay(Some(long))
            });
            let checked = matches!(val, CompactDisplay::Long);
            Some(html! {
                <OptionalField
                    label={format!("Compact Display")}
                    on_check={cb}
                    class="section bool-field"
                    {checked}
                >
                    <label
                        for="Compact-Display-checkbox"
                        style="font-size:11px"
                    >
                        { val.to_string() }
                    </label>
                </OptionalField>
            })
        } else {
            None
        };

        html! {
            <>
                <SelectField<NotationName>
                    label="Notation"
                    on_change={ctx.link().callback(CustomNumberFormatMsg::NotationChanged)}
                    current_value={self.notation.unwrap_or_default()}
                />
                { compact_display_checkbox }
                <SelectField<UseGrouping>
                    label="Use Grouping"
                    on_change={ctx.link().callback(CustomNumberFormatMsg::UseGrouping)}
                    current_value={self.config.use_grouping.unwrap_or_default()}
                />
                <SelectField<SignDisplay>
                    label="Sign Display"
                    on_change={ctx.link().callback(CustomNumberFormatMsg::SignDisplay)}
                    current_value={self.config.sign_display.unwrap_or_default()}
                />
            </>
        }
    }
}
