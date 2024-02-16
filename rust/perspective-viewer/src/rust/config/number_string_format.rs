//! This module describes configurations for formatting numbers as strings.
//! It follows the [Intl.NumberFormat specification](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

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

#[derive(Default, Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub enum CurrencyDisplay {
    Code,
    #[default]
    Symbol,
    NarrowSymbol,
    Name,
}
#[derive(Default, Serialize, Deserialize, Debug, PartialEq, Clone)]
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
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#currency_2
    pub currency: Option<String>,
    pub currency_display: Option<CurrencyDisplay>,
    pub currency_sign: Option<CurrencySign>,
}

// https://tc39.es/ecma402/#table-sanctioned-single-unit-identifiers
#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub enum Unit {
    Todo,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone)]
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
    pub unit: Unit,
    pub unit_display: Option<UnitDisplay>,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub enum RoundingPriority {
    #[default]
    Auto,
    MorePrecision,
    LessPrecision,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub enum RoundingMode {
    Ceil,
    Floor,
    Expand,
    Trunc,
    HalfCiel,
    HalfFloor,
    #[default]
    HalfExpand,
    HalfTrunc,
    HalfEven,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone)]
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

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase", tag = "compactDisplay")]
pub enum CompactDisplay {
    #[default]
    Short,
    Long,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub enum UseGrouping {
    Always,
    #[default]
    Auto,
    Min2, // default if notation is compact
    False,
}

#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Clone)]
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
pub struct CustomNumberStringFormat {
    #[serde(flatten)]
    pub _style: Option<NumberFormatStyle>,
    // see Digit Options
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumintegerdigits
    // these min/max props can all be specified but it results in possible conflicts
    // may consider making them distinct options
    pub minimum_integer_digits: Option<u8>,
    pub minimum_fraction_digits: Option<u8>,
    pub maximum_fraction_digits: Option<u8>,
    pub minimum_significant_digits: Option<u8>,
    pub maximum_significant_digits: Option<u8>,
    pub rounding_priority: Option<RoundingPriority>,
    // specific values https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#roundingincrement
    // Only available with automatic rounding priority
    // Cannot be mixed with sigfig rounding. (Does this mean max/min sigfig must be unset?)
    pub rounding_increment: Option<String>,
    pub rounding_mode: Option<RoundingMode>,
    pub trailing_zero_display: Option<TrailingZeroDisplay>,
    #[serde(flatten)]
    pub _notation: Option<Notation>,
    pub use_grouping: Option<UseGrouping>,
    pub sign_display: Option<SignDisplay>,
}

// NOTE: These will need to be shimmed into d3-style format strings for the d3fc
// plugins

#[test]
pub fn test() {
    let config = CustomNumberStringFormat {
        _style: Some(NumberFormatStyle::Currency(CurrencyNumberFormatStyle {
            currency: Some("USD".to_string()),
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
    let config: CustomNumberStringFormat = serde_json::from_value(json).unwrap();
    assert_eq!(config, CustomNumberStringFormat::default());
}
