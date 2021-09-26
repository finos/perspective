/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const functionality = require("./expressions/functionality");
const numeric = require("./expressions/numeric");
const string = require("./expressions/string");
const datetime = require("./expressions/datetime");
const updates = require("./expressions/updates");
const deltas = require("./expressions/deltas");
const invariant = require("./expressions/invariant");
const multiple_views = require("./expressions/multiple_views");
const conversions = require("./expressions/conversions");
const parsing = require("./expressions/parsing");
const vectors = require("./expressions/vectors");

module.exports = (perspective) => {
    functionality(perspective);
    numeric(perspective);
    string(perspective);
    datetime(perspective);
    updates(perspective);
    deltas(perspective);
    invariant(perspective);
    multiple_views(perspective);
    conversions(perspective);
    parsing(perspective);
    vectors(perspective);
};
