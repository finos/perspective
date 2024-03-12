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

mod enums;
pub use enums::*;
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use strum::{Display, EnumIter};

use crate::max;

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase", tag = "style")]
pub enum NumberFormatStyle {
    #[default]
    Decimal,
    Currency(CurrencyNumberFormatStyle),
    Percent,
    Unit(UnitNumberFormatStyle),
}

#[derive(Default, Serialize, Deserialize, Debug, PartialEq, Clone, Copy, EnumIter, Display)]
#[serde(rename_all = "camelCase")]
pub enum CurrencyDisplay {
    Code,
    #[default]
    Symbol,
    NarrowSymbol,
    Name,
}

#[derive(Default, Serialize, Deserialize, Debug, PartialEq, Clone, Copy, EnumIter, Display)]
#[serde(rename_all = "camelCase")]
pub enum CurrencySign {
    #[default]
    Standard,
    Accounting,
}

#[skip_serializing_none]
#[derive(Default, Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CurrencyNumberFormatStyle {
    #[serde(default)]
    pub currency: CurrencyCode,
    pub currency_display: Option<CurrencyDisplay>,
    pub currency_sign: Option<CurrencySign>,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone, Copy, EnumIter, Display)]
#[serde(rename_all = "camelCase")]
pub enum UnitDisplay {
    #[default]
    Short,
    Narrow,
    Long,
}

#[skip_serializing_none]
#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UnitNumberFormatStyle {
    #[serde(default)]
    pub unit: Unit,
    pub unit_display: Option<UnitDisplay>,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone, Copy, EnumIter, Display)]
#[serde(rename_all = "camelCase")]
pub enum RoundingPriority {
    #[default]
    Auto,
    MorePrecision,
    LessPrecision,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone, Copy, EnumIter, Display)]
#[serde(rename_all = "camelCase")]
pub enum RoundingMode {
    Ceil,
    Floor,
    Expand,
    Trunc,
    HalfCeil,
    HalfFloor,
    #[default]
    HalfExpand,
    HalfTrunc,
    HalfEven,
}

#[derive(Default, Debug, PartialEq, Clone)]
pub enum RoundingIncrement {
    #[default]
    Auto,
    Custom(f64),
}
impl std::fmt::Display for RoundingIncrement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RoundingIncrement::Auto => f.write_str("Auto"),
            RoundingIncrement::Custom(val) => f.write_fmt(format_args!("{val}")),
        }
    }
}

pub const ROUNDING_INCREMENTS: [f64; 15] = [
    1., 2., 5., 10., 20., 25., 50., 100., 200., 250., 500., 1000., 2000., 2500., 5000.,
];

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone, Copy, EnumIter, Display)]
#[serde(rename_all = "camelCase")]
pub enum TrailingZeroDisplay {
    #[default]
    Auto,
    StripIfInteger,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase", tag = "notation")]
pub enum Notation {
    #[default]
    Standard,
    Scientific,
    Engineering,
    Compact(CompactDisplay),
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone, Copy, EnumIter, Display)]
#[serde(rename_all = "camelCase", tag = "compactDisplay")]
pub enum CompactDisplay {
    #[default]
    Short,
    Long,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone, Copy, EnumIter, Display)]
#[serde(rename_all = "snake_case")]
pub enum UseGrouping {
    Always,

    #[default]
    Auto,
    Min2, // default if notation is compact

    #[serde(untagged)]
    False(bool),
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone, Copy, EnumIter, Display)]
#[serde(rename_all = "camelCase")]
pub enum SignDisplay {
    #[default]
    Auto,
    Always,
    ExceptZero,
    Negative,
    Never,
}

#[skip_serializing_none]
#[derive(Serialize, Deserialize, Debug, Default, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CustomNumberFormatConfig {
    #[serde(flatten)]
    pub _style: Option<NumberFormatStyle>,

    // see Digit Options
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumintegerdigits
    // these min/max props can all be specified but it results in possible conflicts
    // may consider making them distinct options
    pub minimum_integer_digits: Option<f64>,
    pub minimum_fraction_digits: Option<f64>,
    pub maximum_fraction_digits: Option<f64>,
    pub minimum_significant_digits: Option<f64>,
    pub maximum_significant_digits: Option<f64>,
    pub rounding_priority: Option<RoundingPriority>,

    // specific values https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#roundingincrement
    // Only available with automatic rounding priority
    // Cannot be mixed with sigfig rounding. (Does this mean max/min sigfig must be unset?)
    pub rounding_increment: Option<f64>,
    pub rounding_mode: Option<RoundingMode>,
    pub trailing_zero_display: Option<TrailingZeroDisplay>,

    #[serde(flatten)]
    pub _notation: Option<Notation>,
    pub use_grouping: Option<UseGrouping>,
    pub sign_display: Option<SignDisplay>,
}

impl CustomNumberFormatConfig {
    pub fn filter_default(self, is_float: bool) -> Self {
        let (frac_min, frac_max) = if is_float { (2., 2.) } else { (0., 0.) };
        let rounding_increment = self.rounding_increment;
        let use_grouping = self
            .use_grouping
            .filter(|val| *val != UseGrouping::default());

        let mut minimum_fraction_digits =
            self.minimum_fraction_digits.filter(|val| *val != frac_min);

        let mut maximum_fraction_digits =
            self.maximum_fraction_digits.filter(|val| *val != frac_max);

        let mut show_frac = is_float
            && (minimum_fraction_digits.is_some()
                || maximum_fraction_digits.is_some()
                || use_grouping.is_some()
                || matches!(
                    self._style,
                    Some(NumberFormatStyle::Percent | NumberFormatStyle::Unit(_))
                ))
            || !is_float && matches!(self._style, Some(NumberFormatStyle::Currency(_)));

        // Rounding increment does not work unless `minimum_fraction_digits`
        // and `maximum_fraction_digits` are set to 0.
        if rounding_increment.is_some() {
            show_frac = true;
            minimum_fraction_digits = Some(0.);
            maximum_fraction_digits = Some(0.);
        }

        let minimum_significant_digits = self.minimum_significant_digits.filter(|val| *val != 1.);
        let maximum_significant_digits = self.maximum_significant_digits.filter(|val| *val != 21.);
        let show_sig = minimum_significant_digits.is_some() || maximum_significant_digits.is_some();
        Self {
            _style: self
                ._style
                .filter(|style| !matches!(style, NumberFormatStyle::Decimal)),
            minimum_integer_digits: self.minimum_integer_digits.filter(|val| *val != 1.),
            minimum_fraction_digits: show_frac
                .then_some(minimum_fraction_digits.unwrap_or(frac_min)),
            maximum_fraction_digits: show_frac
                .then_some(maximum_fraction_digits.unwrap_or(frac_max)),
            minimum_significant_digits: show_sig
                .then_some(minimum_significant_digits.unwrap_or(1.)),
            maximum_significant_digits: show_sig
                .then_some(minimum_significant_digits.unwrap_or(21.)),
            rounding_priority: self
                .rounding_priority
                .filter(|val| *val != RoundingPriority::default()),
            rounding_increment,
            rounding_mode: self
                .rounding_mode
                .filter(|val| *val != RoundingMode::default()),
            trailing_zero_display: self
                .trailing_zero_display
                .filter(|val| *val != TrailingZeroDisplay::default()),
            _notation: self
                ._notation
                .filter(|notation| !matches!(notation, Notation::Standard)),
            use_grouping,
            sign_display: self
                .sign_display
                .filter(|val| *val != SignDisplay::default()),
        }
    }
}
