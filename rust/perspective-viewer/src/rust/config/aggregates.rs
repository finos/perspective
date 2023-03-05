////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::fmt::Display;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

use super::column_type::*;
use crate::utils::{ApiError, ApiResult};

#[derive(Clone, Copy, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
#[serde()]
pub enum SingleAggregate {
    #[serde(rename = "sum")]
    Sum,

    #[serde(rename = "sum abs")]
    SumAbs,

    #[serde(rename = "sum not null")]
    SumNotNull,

    #[serde(rename = "abs sum")]
    AbsSum,

    #[serde(rename = "pct sum parent")]
    PctSumParent,

    #[serde(rename = "pct sum grand total")]
    PctSumGrandTotal,

    #[serde(rename = "any")]
    Any,

    #[serde(rename = "unique")]
    Unique,

    #[serde(rename = "dominant")]
    Dominant,

    #[serde(rename = "median")]
    Median,

    #[serde(rename = "first")]
    First,

    #[serde(rename = "last by index")]
    LastByIndex,

    #[serde(rename = "last minus first")]
    LastMinusFirst,

    #[serde(rename = "last")]
    Last,

    #[serde(rename = "count")]
    Count,

    #[serde(rename = "distinct count")]
    DistinctCount,

    #[serde(rename = "avg")]
    Avg,

    #[serde(rename = "mean")]
    Mean,

    #[serde(rename = "join")]
    Join,

    #[serde(rename = "high")]
    High,

    #[serde(rename = "low")]
    Low,

    #[serde(rename = "high minus low")]
    HighMinusLow,

    #[serde(rename = "stddev")]
    StdDev,

    #[serde(rename = "var")]
    Var,
}

impl Display for SingleAggregate {
    fn fmt(&self, fmt: &mut std::fmt::Formatter<'_>) -> Result<(), std::fmt::Error> {
        let term = match self {
            Self::Sum => "sum",
            Self::SumAbs => "sum abs",
            Self::SumNotNull => "sum not null",
            Self::AbsSum => "abs sum",
            Self::PctSumParent => "pct sum parent",
            Self::PctSumGrandTotal => "pct sum grand total",
            Self::Any => "any",
            Self::Unique => "unique",
            Self::Dominant => "dominant",
            Self::Median => "median",
            Self::First => "first",
            Self::LastByIndex => "last by index",
            Self::LastMinusFirst => "last minus first",
            Self::Last => "last",
            Self::Count => "count",
            Self::DistinctCount => "distinct count",
            Self::Avg => "avg",
            Self::Mean => "mean",
            Self::Join => "join",
            Self::High => "high",
            Self::Low => "low",
            Self::HighMinusLow => "high minus low",
            Self::StdDev => "stddev",
            Self::Var => "var",
        };

        write!(fmt, "{}", term)
    }
}

impl FromStr for SingleAggregate {
    type Err = ApiError;

    fn from_str(value: &str) -> ApiResult<Self> {
        match value {
            "sum" => Ok(Self::Sum),
            "sum abs" => Ok(Self::SumAbs),
            "sum not null" => Ok(Self::SumNotNull),
            "abs sum" => Ok(Self::AbsSum),
            "pct sum parent" => Ok(Self::PctSumParent),
            "pct sum grand total" => Ok(Self::PctSumGrandTotal),
            "any" => Ok(Self::Any),
            "unique" => Ok(Self::Unique),
            "dominant" => Ok(Self::Dominant),
            "median" => Ok(Self::Median),
            "first" => Ok(Self::First),
            "last by index" => Ok(Self::LastByIndex),
            "last minus first" => Ok(Self::LastMinusFirst),
            "last" => Ok(Self::Last),
            "count" => Ok(Self::Count),
            "distinct count" => Ok(Self::DistinctCount),
            "avg" => Ok(Self::Avg),
            "mean" => Ok(Self::Mean),
            "join" => Ok(Self::Join),
            "high" => Ok(Self::High),
            "low" => Ok(Self::Low),
            "high minus low" => Ok(Self::HighMinusLow),
            "stddev" => Ok(Self::StdDev),
            "var" => Ok(Self::Var),
            x => Err(format!("Unknown aggregate `{}`", x).into()),
        }
    }
}

#[derive(Clone, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
#[serde()]
pub enum MultiAggregate {
    #[serde(rename = "weighted mean")]
    WeightedMean,
}

#[derive(Clone, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(untagged)]
pub enum Aggregate {
    SingleAggregate(SingleAggregate),
    MultiAggregate(MultiAggregate, String),
}

impl Display for Aggregate {
    fn fmt(&self, fmt: &mut std::fmt::Formatter<'_>) -> std::result::Result<(), std::fmt::Error> {
        match self {
            Self::SingleAggregate(x) => write!(fmt, "{}", x)?,
            Self::MultiAggregate(MultiAggregate::WeightedMean, x) => {
                write!(fmt, "weighted mean by {}", x)?
            }
        };
        Ok(())
    }
}

impl FromStr for Aggregate {
    type Err = ApiError;

    fn from_str(input: &str) -> ApiResult<Self> {
        Ok(
            if let Some(stripped) = input.strip_prefix("weighted mean by ") {
                Self::MultiAggregate(MultiAggregate::WeightedMean, stripped.to_owned())
            } else {
                Self::SingleAggregate(SingleAggregate::from_str(input)?)
            },
        )
    }
}

const STRING_AGGREGATES: &[SingleAggregate] = &[
    SingleAggregate::Any,
    SingleAggregate::Count,
    SingleAggregate::DistinctCount,
    SingleAggregate::Dominant,
    SingleAggregate::First,
    SingleAggregate::Join,
    SingleAggregate::Last,
    SingleAggregate::LastByIndex,
    SingleAggregate::Median,
    SingleAggregate::Unique,
];

const NUMBER_AGGREGATES: &[SingleAggregate] = &[
    SingleAggregate::AbsSum,
    SingleAggregate::Any,
    SingleAggregate::Avg,
    SingleAggregate::Count,
    SingleAggregate::DistinctCount,
    SingleAggregate::Dominant,
    SingleAggregate::First,
    SingleAggregate::High,
    SingleAggregate::Low,
    SingleAggregate::HighMinusLow,
    SingleAggregate::LastByIndex,
    SingleAggregate::LastMinusFirst,
    SingleAggregate::Last,
    SingleAggregate::Mean,
    SingleAggregate::Median,
    SingleAggregate::PctSumParent,
    SingleAggregate::PctSumGrandTotal,
    SingleAggregate::StdDev,
    SingleAggregate::Sum,
    SingleAggregate::SumAbs,
    SingleAggregate::SumNotNull,
    SingleAggregate::Unique,
    SingleAggregate::Var,
];

impl Type {
    pub fn aggregates_iter(&self) -> Box<dyn Iterator<Item = Aggregate>> {
        match self {
            Self::Bool | Self::Date | Self::Datetime | Self::String => Box::new(
                STRING_AGGREGATES
                    .iter()
                    .map(|x| Aggregate::SingleAggregate(*x)),
            ),
            Self::Integer | Self::Float => Box::new(
                NUMBER_AGGREGATES
                    .iter()
                    .map(|x| Aggregate::SingleAggregate(*x)),
            ),
        }
    }

    pub const fn default_aggregate(&self) -> Aggregate {
        match self {
            Self::Bool | Self::Date | Self::Datetime | Self::String => {
                Aggregate::SingleAggregate(SingleAggregate::Count)
            }
            Self::Integer | Self::Float => Aggregate::SingleAggregate(SingleAggregate::Sum),
        }
    }
}
