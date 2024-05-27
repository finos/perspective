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

use serde::{Deserialize, Serialize};
use strum::{Display, EnumIter};

// NOTE: These should probably be pulled from a server somewhere.

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#currency_2
#[derive(Clone, Copy, Debug, Default, PartialEq, Display, EnumIter, Serialize, Deserialize)]
#[rustfmt::skip]
pub enum CurrencyCode {
    AED, AFN, ALL, AMD, ANG, AOA, ARS, AUD, AWG, AZN, BAM, BBD, BDT,
    BGN, BHD, BIF, BMD, BND, BOB, BOV, BRL, BSD, BTN, BWP, BYR, BZD,
    CAD, CDF, CHE, CHF, CHW, CLF, CLP, CNY, COP, COU, CRC, CUC, CUP,
    CVE, CZK, DJF, DKK, DOP, DZD, EGP, ERN, ETB, EUR, FJD, FKP, GBP,
    GEL, GHS, GIP, GMD, GNF, GTQ, GYD, HKD, HNL, HRK, HTG, HUF, IDR,
    ILS, INR, IQD, IRR, ISK, JMD, JOD, JPY, KES, KGS, KHR, KMF, KPW,
    KRW, KWD, KYD, KZT, LAK, LBP, LKR, LRD, LSL, LTL, LVL, LYD, MAD,
    MDL, MGA, MKD, MMK, MNT, MOP, MRO, MUR, MVR, MWK, MXN, MXV, MYR,
    MZN, NAD, NGN, NIO, NOK, NPR, NZD, OMR, PAB, PEN, PGK, PHP, PKR,
    PLN, PYG, QAR, RON, RSD, RUB, RWF, SAR, SBD, SCR, SDG, SEK, SGD,
    SHP, SLL, SOS, SRD, SSP, STD, SYP, SZL, THB, TJS, TMT, TND, TOP,
    TRY, TTD, TWD, TZS, UAH, UGX, #[default] USD, USN, USS, UYI, UYU, UZS, VEF,
    VND, VUV, WST, XAF, XAG, XAU, XBA, XBB, XBC, XBD, XCD, XDR, XFU,
    XOF, XPD, XPF, XPT, XTS, XXX, YER, ZAR, ZMW,
}

// https://tc39.es/ecma402/#table-sanctioned-single-unit-identifiers
#[derive(Clone, Copy, Debug, Default, PartialEq, Display, EnumIter, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Unit {
    Acre,
    Bit,
    Byte,
    Celsius,
    Centimeter,
    Day,
    Degree,
    Fahrenheit,
    FluidOunce,
    Foot,
    Gallon,
    Gigabit,
    Gigabyte,
    Gram,
    Hectare,
    Hour,
    Inch,
    Kilobit,
    Kilobyte,
    Kilogram,
    Kilometer,
    Liter,
    Megabit,
    Megabyte,
    Meter,
    Microsecond,
    Mile,
    MileScandinavian,
    Milliliter,
    Millimeter,
    Millisecond,
    Minute,
    Month,
    Nanosecond,
    Ounce,
    #[default]
    Percent,
    Petabyte,
    Pound,
    Second,
    Stone,
    Terabit,
    Terabyte,
    Week,
    Yard,
    Year,
}
