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

use itertools::Itertools;
use yew::html;

use super::CustomNumberFormat;
use crate::components::containers::select::{Select, SelectItem};
use crate::components::form::collapsable_section::CollapsableSection;
use crate::components::form::number_field::NumberField;
use crate::components::form::optional_field::OptionalField;
use crate::components::form::select_field::SelectField;
use crate::components::style_controls::CustomNumberFormatMsg;
use crate::config::{
    RoundingIncrement, RoundingMode, RoundingPriority, TrailingZeroDisplay, Type,
    ROUNDING_INCREMENTS,
};

impl CustomNumberFormat {
    pub fn digits_section(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        let is_float = matches!(ctx.props().view_type, Type::Float);
        html! {
            <>
                <NumberField
                    label="Minimum Integer Digits"
                    min=1.
                    max=21.
                    step=1.
                    default=1.
                    current_value={self.config.minimum_integer_digits}
                    on_change={ctx.link().callback(CustomNumberFormatMsg::MinimumIntegerDigits)}
                />
                if is_float {
                    { self.float_section(ctx) }
                } else {
                    { self.rounding_increment(ctx) }
                }
            </>
        }
    }

    fn rounding_increment(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        let disabled = self.disable_rounding_increment;
        let values = ROUNDING_INCREMENTS
            .iter()
            .map(|val| RoundingIncrement::Custom(*val))
            .map(SelectItem::Option)
            .collect_vec();
        let values = [vec![SelectItem::Option(RoundingIncrement::Auto)], values].concat();
        let on_check = ctx
            .link()
            .callback(|_| CustomNumberFormatMsg::RoundingIncrement(RoundingIncrement::default()));
        let selected = self
            .config
            .rounding_increment
            .map(RoundingIncrement::Custom)
            .unwrap_or_default();
        html! {
            <OptionalField
                label="Rounding Increment"
                {on_check}
                {disabled}
                checked={self.config.rounding_increment.is_some()}
            >
                <Select<RoundingIncrement>
                    {values}
                    {selected}
                    on_select={ctx.link().callback(CustomNumberFormatMsg::RoundingIncrement)}
                />
            </OptionalField>
        }
    }

    fn float_section(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        let (min, max) = self.config.default_fraction_digits();
        let fractional_digits = html! {
            <>
                <NumberField
                    label="Min"
                    min=0.
                    max=20.
                    step=1.
                    default={min}
                    current_value={self.config.minimum_fraction_digits}
                    on_change={ctx.link().callback(CustomNumberFormatMsg::FracMin)}
                />
                <NumberField
                    label="Max"
                    min=0.
                    max=20.
                    step=1.
                    default={max}
                    current_value={self.config.maximum_fraction_digits}
                    on_change={ctx.link().callback(CustomNumberFormatMsg::FracMax)}
                />
            </>
        };
        let significant_digits = html! {
            <>
                <NumberField
                    label="Min"
                    min=1.
                    max=21.
                    step=1.
                    default=1.
                    current_value={self.config.minimum_significant_digits}
                    on_change={ctx.link().callback(CustomNumberFormatMsg::SigMin)}
                />
                <NumberField
                    label="Max"
                    min=1.
                    max=21.
                    step=1.
                    default=21.
                    current_value={self.config.maximum_significant_digits}
                    on_change={ctx.link().callback(CustomNumberFormatMsg::SigMax)}
                />
            </>
        };

        let show_frac = self.show_frac;
        let show_sig = self.show_sig;
        html! {
            <>
                <CollapsableSection
                    label="Fractional Digits"
                    on_check={ctx.link().callback(move |_| CustomNumberFormatMsg::ShowFrac(!show_frac))}
                    checked={self.show_frac}
                >
                    { fractional_digits }
                </CollapsableSection>
                <CollapsableSection
                    label="Significant Digits"
                    on_check={ctx.link().callback(move |_| CustomNumberFormatMsg::ShowSig(!show_sig))}
                    checked={self.show_sig}
                >
                    { significant_digits }
                </CollapsableSection>
                { self.rounding_increment(ctx) }
                <SelectField<RoundingPriority>
                    label="Rounding Priority"
                    disabled={!(self.show_frac && self.show_sig)}
                    current_value={self.config.rounding_priority}
                    on_change={ctx.link().callback(CustomNumberFormatMsg::RoundingPriority)}
                />
                <SelectField<RoundingMode>
                    label="Rounding Mode"
                    current_value={self.config.rounding_mode}
                    on_change={ctx.link().callback(CustomNumberFormatMsg::RoundingMode)}
                />
                <SelectField<TrailingZeroDisplay>
                    label="Trailing Zero Display"
                    current_value={self.config.trailing_zero_display}
                    on_change={ctx.link().callback(CustomNumberFormatMsg::TrailingZero)}
                />
            </>
        }
    }
}
