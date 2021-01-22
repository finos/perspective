/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

const utils = require("@finos/perspective-test");
const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

const {withTemplate} = require("./simple-template");

withTemplate("bar", "d3_y_bar");
withTemplate("bar-x", "d3_x_bar");
withTemplate("bar-themed", "d3_y_bar", {template: "themed-template"});

utils.with_server({}, () => {
    describe.page(
        "bar.html",
        () => {
            simple_tests.default();
        },
        {root: path.join(__dirname, "..", "..", "..")}
    );

    describe.page(
        "bar-x.html",
        () => {
            simple_tests.default();
        },
        {root: path.join(__dirname, "..", "..", "..")}
    );

    describe.page(
        "bar-themed.html",
        () => {
            simple_tests.default();
        },
        {root: path.join(__dirname, "..", "..", "..")}
    );
});
