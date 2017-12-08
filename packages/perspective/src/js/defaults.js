/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const NUMBER_AGGREGATES = [
    "any",
    "avg",
    "count",
    "distinct count",
    "dominant",
    "first",
    "last",
    "high",
    "low",
    "mean",
    "mean by count",
    "median",
    "pct sum parent",
    "pct sum grand total",
    "sum",
    "sum abs",
    "sum not null",
    "unique"
];

const STRING_AGGREGATES = [
    "any",
    "count",
    "distinct count",
    "distinct leaf",
    "dominant",
    "first",
    "last",
    "mean by count",
    "unique"
];

const BOOLEAN_AGGREGATES = [
    "any",
    "count",
    "distinct count",
    "distinct leaf",
    "dominant",
    "first",
    "last",
    "mean by count",
    "unique",
    "and",
    "or"
];

export const TYPE_AGGREGATES = {
    'string': STRING_AGGREGATES,
    'float': NUMBER_AGGREGATES,
    'integer': NUMBER_AGGREGATES,
    'boolean': BOOLEAN_AGGREGATES,
    'date': STRING_AGGREGATES
};

export const AGGREGATE_DEFAULTS = {
    'string': 'distinct count',
    'float': 'sum',
    'integer': 'sum',
    'boolean': 'distinct count',
    'date': 'distinct count'
};

