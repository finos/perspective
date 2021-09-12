/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const arrows = require("./../test_arrows");

exports.data = [
    {x: 1, y: "a", z: true},
    {x: 2, y: "b", z: false},
    {x: 3, y: "c", z: true},
    {x: 4, y: "d", z: false},
];

exports.int_float_data = [
    {w: 1.5, x: 1, y: "a", z: true},
    {w: 2.5, x: 2, y: "b", z: false},
    {w: 3.5, x: 3, y: "c", z: true},
    {w: 4.5, x: 4, y: "d", z: false},
];

exports.int_float_subtract_data = [
    {u: 2.5, v: 2, w: 1.5, x: 1, y: "a", z: true},
    {u: 3.5, v: 3, w: 2.5, x: 2, y: "b", z: false},
    {u: 4.5, v: 4, w: 3.5, x: 3, y: "c", z: true},
    {u: 5.5, v: 5, w: 4.5, x: 4, y: "d", z: false},
];

exports.comparison_data = [
    {u: 0, v: 1.5, w: 1.5, x: 1, x2: 1, y: "a", z: true},
    {u: 1, v: 2.55, w: 2.5, x: 2, x2: 10, y: "b", z: false},
    {u: 0, v: 3.5, w: 3.5, x: 3, x2: 3, y: "c", z: true},
    {u: 1, v: 4.55, w: 4.5, x: 4, x2: 10, y: "d", z: false},
];

exports.cols = [
    "i8",
    "ui8",
    "i16",
    "ui16",
    "i32",
    "ui32",
    "i64",
    "ui64",
    "f32",
    "f64",
];
exports.arrow = arrows.numbers_arrow;
exports.all_types_arrow = arrows.all_types_arrow;
exports.all_types_multi_arrow = arrows.all_types_multi_arrow;

exports.days_of_week = [
    "1 Sunday",
    "2 Monday",
    "3 Tuesday",
    "4 Wednesday",
    "5 Thursday",
    "6 Friday",
    "7 Saturday",
];
exports.months_of_year = [
    "01 January",
    "02 February",
    "03 March",
    "04 April",
    "05 May",
    "06 June",
    "07 July",
    "08 August",
    "09 September",
    "10 October",
    "11 November",
    "12 December",
];

exports.second_bucket = function (val) {
    return new Date(Math.floor(new Date(val).getTime() / 1000) * 1000);
};

exports.minute_bucket = function (val) {
    let date = new Date(val);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

exports.hour_bucket = function (val) {
    let date = new Date(val);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

exports.day_bucket = function (val) {
    let date = new Date(val);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

exports.week_bucket = function (val) {
    let date = new Date(val);
    let day = date.getDay();
    let diff = date.getDate() - day + (day == 0 ? -6 : 1);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setDate(diff);
    return date;
};

exports.month_bucket = function (val) {
    let date = new Date(val);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setDate(1);
    return date;
};

exports.year_bucket = function (val) {
    let date = new Date(val);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setDate(1);
    date.setMonth(0);
    return date;
};
