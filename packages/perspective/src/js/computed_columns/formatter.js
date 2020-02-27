/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
export const COMPUTED_FUNCTION_FORMATTERS = {
    "Hour of Day": x => `hour_of_day(${x})`,
    "Day of Week": x => `day_of_week(${x})`,
    "Month of Year": x => `month_of_year(${x})`,
    "Bucket (s)": x => `second_bucket(${x})`,
    "Bucket (m)": x => `minute_bucket(${x})`,
    "Bucket (h)": x => `hour_bucket(${x})`,
    "Bucket (D)": x => `day_bucket(${x})`,
    "Bucket (W)": x => `week_bucket(${x})`,
    "Bucket (M)": x => `month_bucket(${x})`,
    "Bucket (Y)": x => `year_bucket(${x})`,
    "Bucket (10)": x => `bin10(${x})`,
    "Bucket (100)": x => `bin100(${x})`,
    "Bucket (1000)": x => `bin1000(${x})`,
    "Bucket (1/10)": x => `bin10th(${x})`,
    "Bucket (1/100)": x => `bin100th(${x})`,
    "Bucket (1/1000)": x => `bin1000th(${x})`,
    "+": (x, y) => `(${x} + ${y})`,
    "-": (x, y) => `(${x} - ${y})`,
    "*": (x, y) => `(${x} * ${y})`,
    "/": (x, y) => `(${x} / ${y})`,
    "1/x": x => `(1 / ${x})`,
    "x^2": x => `(${x} ^ 2)`,
    sqrt: x => `sqrt(${x})`,
    abs: x => `abs(${x})`,
    "%": (x, y) => `(${x} %% ${y})`,
    Uppercase: x => `uppercase(${x})`,
    Lowercase: x => `lowercase(${x})`,
    length: x => `length(${x})`,
    concat_space: x => `concat_space(${x})`,
    concat_comma: x => `concat_comma(${x})`
};
