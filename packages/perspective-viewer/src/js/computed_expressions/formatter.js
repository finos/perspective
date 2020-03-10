/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// TODO: these have been renamed compared to old computed columns, make sure
// names are consistent throughout.
export const COMPUTED_FUNCTION_FORMATTERS = {
    "+": (x, y) => `(${x} + ${y})`,
    "-": (x, y) => `(${x} - ${y})`,
    "*": (x, y) => `(${x} * ${y})`,
    "/": (x, y) => `(${x} / ${y})`,
    "%": (x, y) => `(${x} %% ${y})`,
    invert: x => `(1 / ${x})`,
    pow2: x => `(${x} ^ 2)`,
    sqrt: x => `sqrt(${x})`,
    abs: x => `abs(${x})`,
    bin10: x => `bin10(${x})`,
    bin100: x => `bin100(${x})`,
    bin1000: x => `bin1000(${x})`,
    bin10th: x => `bin10th(${x})`,
    bin100th: x => `bin100th(${x})`,
    bin1000th: x => `bin1000th(${x})`,
    uppercase: x => `uppercase(${x})`,
    lowercase: x => `lowercase(${x})`,
    length: x => `length(${x})`,
    concat_space: x => `concat_space(${x})`,
    concat_comma: x => `concat_comma(${x})`,
    hour_of_day: x => `hour_of_day(${x})`,
    day_of_week: x => `day_of_week(${x})`,
    month_of_year: x => `month_of_year(${x})`,
    second_bucket: x => `second_bucket(${x})`,
    minute_bucket: x => `minute_bucket(${x})`,
    hour_bucket: x => `hour_bucket(${x})`,
    day_bucket: x => `day_bucket(${x})`,
    week_bucket: x => `week_bucket(${x})`,
    month_bucket: x => `month_bucket(${x})`,
    year_bucket: x => `year_bucket(${x})`
};
