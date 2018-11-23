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
    "first by index",
    "last by index",
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

const STRING_AGGREGATES = ["any", "count", "distinct count", "distinct leaf", "dominant", "first by index", "last by index", "last", "mean by count", "unique"];

const BOOLEAN_AGGREGATES = ["any", "count", "distinct count", "distinct leaf", "dominant", "first by index", "last by index", "last", "mean by count", "unique", "and", "or"];

export const SORT_ORDERS = ["none", "asc", "desc", "col asc", "col desc", "asc abs", "desc abs", "col asc abs", "col desc abs"];

export const SORT_ORDER_IDS = [2, 0, 1, 0, 1, 3, 4, 3, 4];

export const TYPE_AGGREGATES = {
    string: STRING_AGGREGATES,
    float: NUMBER_AGGREGATES,
    integer: NUMBER_AGGREGATES,
    boolean: BOOLEAN_AGGREGATES,
    datetime: STRING_AGGREGATES,
    date: STRING_AGGREGATES
};

export const AGGREGATE_DEFAULTS = {
    string: "distinct count",
    float: "sum",
    integer: "sum",
    boolean: "distinct count",
    datetime: "distinct count",
    date: "distinct count"
};

const BOOLEAN_FILTERS = ["&", "|", "==", "!=", "or", "and"];

const NUMBER_FILTERS = ["<", ">", "==", "<=", ">=", "!=", "is nan", "is not nan"];

const STRING_FILTERS = ["==", "contains", "!=", "in", "begins with", "ends with"];

const DATETIME_FILTERS = ["<", ">", "==", "<=", ">=", "!="];

export const COLUMN_SEPARATOR_STRING = "|";

export const TYPE_FILTERS = {
    string: STRING_FILTERS,
    float: NUMBER_FILTERS,
    integer: NUMBER_FILTERS,
    boolean: BOOLEAN_FILTERS,
    datetime: DATETIME_FILTERS,
    date: DATETIME_FILTERS
};

export const FILTER_DEFAULTS = {
    string: "==",
    float: "==",
    integer: "==",
    boolean: "==",
    datetime: "==",
    date: "=="
};

export const TYPED_ARRAY_SENTINEL_VALUE_INT8 = 255;
export const TYPED_ARRAY_SENTINEL_VALUE_INT16 = 32767;
export const TYPED_ARRAY_SENTINEL_VALUE_INT32 = 2147483647;
export const TYPED_ARRAY_SENTINEL_VALUE_FLOAT32 = 3.40282e38;
export const TYPED_ARRAY_SENTINEL_VALUE_FLOAT64 = Number.MAX_VALUE;
