/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const functionality = require("./computed/functionality");
const numeric = require("./computed/numeric");
const string = require("./computed/string");
const datetime = require("./computed/datetime");
const updates = require("./computed/updates");

module.exports = perspective => {
    functionality(perspective);
    numeric(perspective);
    string(perspective);
    datetime(perspective);
    updates(perspective);
};
