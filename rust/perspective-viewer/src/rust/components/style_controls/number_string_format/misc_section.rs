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
use crate::components::form::select_field::SelectEnumField;
use crate::components::style_controls::{CustomNumberFormatMsg, NotationName};
use crate::config::*;

impl CustomNumberFormat {
    pub fn misc_section(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        let compact_display_checkbox = if let Some(Notation::Compact(val)) = self.config._notation {
            let cb = ctx.link().callback(CustomNumberFormatMsg::CompactDisplay);
            Some(html! {
                <SelectEnumField<CompactDisplay>
                    label="Compact Display"
                    on_change={cb}
                    current_value={val}
                />
            })
        } else {
            None
        };

        html! {
            <>
                <SelectEnumField<NotationName>
                    label="Notation"
                    on_change={ctx.link().callback(CustomNumberFormatMsg::NotationChanged)}
                    current_value={self.notation.unwrap_or_default()}
                />
                { compact_display_checkbox }
                <SelectEnumField<UseGrouping>
                    label="Use Grouping"
                    on_change={ctx.link().callback(CustomNumberFormatMsg::UseGrouping)}
                    current_value={self.config.use_grouping.unwrap_or_default()}
                />
                <SelectEnumField<SignDisplay>
                    label="Sign Display"
                    on_change={ctx.link().callback(CustomNumberFormatMsg::SignDisplay)}
                    current_value={self.config.sign_display.unwrap_or_default()}
                />
            </>
        }
    }
}
