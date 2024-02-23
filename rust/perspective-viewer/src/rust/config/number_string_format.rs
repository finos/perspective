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

// #[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
// pub enum NumberStringFormat {
//     Simple(SimpleNumberStringFormat),
//     Custom(CustomNumberStringFormat),
// }
// impl Default for NumberStringFormat {
//     fn default() -> Self {
//         Self::Simple(SimpleNumberStringFormat {})
//     }
// }

// #[derive(Serialize, Deserialize, Debug, Default, PartialEq, Clone)]
// pub struct SimpleNumberStringFormat {
//     // todo
// }

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
#[serde(rename_all = "camelCase")]
pub enum UseGrouping {
    Always,
    #[default]
    Auto,
    Min2, // default if notation is compact
    False,
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
    pub fn filter_default(
        self,
        send_sig: bool,
        send_frac: bool,
        send_rounding_increment: bool,
        send_rounding_priority: bool,
    ) -> Self {
        let (frac_min, frac_max) = self.default_fraction_digits();
        Self {
            _style: self
                ._style
                .filter(|style| !matches!(style, NumberFormatStyle::Decimal)),
            minimum_integer_digits: self.minimum_integer_digits.filter(|val| *val != 1.),
            minimum_fraction_digits: self
                .minimum_fraction_digits
                .filter(|_| send_frac)
                .filter(|val| *val != frac_min),
            maximum_fraction_digits: self
                .rounding_increment
                .filter(|_| send_rounding_increment)
                .map(|_| 0.)
                .or_else(|| {
                    self.maximum_fraction_digits
                        .filter(|_| send_frac)
                        .filter(|val| *val != frac_max)
                }),
            minimum_significant_digits: self
                .minimum_significant_digits
                .filter(|_| send_sig)
                .filter(|val| *val != 1.),
            maximum_significant_digits: self
                .maximum_significant_digits
                .filter(|_| send_sig)
                .filter(|val| *val != 21.),
            rounding_priority: self
                .rounding_priority
                .filter(|_| send_rounding_priority)
                .filter(|val| *val != RoundingPriority::default()),
            rounding_increment: self.rounding_increment.filter(|_| send_rounding_increment),
            rounding_mode: self
                .rounding_mode
                .filter(|val| *val != RoundingMode::default()),
            trailing_zero_display: self
                .trailing_zero_display
                .filter(|val| *val != TrailingZeroDisplay::default()),
            _notation: self
                ._notation
                .filter(|notation| !matches!(notation, Notation::Standard)),
            use_grouping: self
                .use_grouping
                .filter(|val| *val != UseGrouping::default()),
            sign_display: self
                .sign_display
                .filter(|val| *val != SignDisplay::default()),
        }
    }

    pub fn default_fraction_digits(&self) -> (f64, f64) {
        let min = if matches!(self._style, Some(NumberFormatStyle::Currency(_))) {
            2.
        } else {
            0.
        };

        let max = match self._style {
            // Technically this should depend on the currency.
            // https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml
            Some(NumberFormatStyle::Currency(_)) => {
                max!(self.minimum_fraction_digits.unwrap_or(min), 2.)
            },
            Some(NumberFormatStyle::Percent) => {
                max!(self.minimum_fraction_digits.unwrap_or(min), 0.)
            },
            _ => max!(self.minimum_fraction_digits.unwrap_or(min), 3.),
        };
        (min, max)
    }
}

// NOTE: These will need to be shimmed into d3-style format strings for the d3fc
// plugins

#[test]
pub fn test() {
    let config = CustomNumberFormatConfig {
        _style: Some(NumberFormatStyle::Currency(CurrencyNumberFormatStyle {
            currency: CurrencyCode::XXX,
            currency_display: Some(CurrencyDisplay::NarrowSymbol),
            currency_sign: Some(CurrencySign::Accounting),
        })),
        _notation: Some(Notation::Compact(CompactDisplay::Long)),
        ..Default::default()
    };
    let config = serde_json::to_string(&config).unwrap();
    assert_eq!(config, String::new());
}
#[test]
pub fn test2() {
    let json = serde_json::json!({});
    let config: CustomNumberFormatConfig = serde_json::from_value(json).unwrap();
    assert_eq!(config, CustomNumberFormatConfig::default());
}
