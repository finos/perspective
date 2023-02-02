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
// const render_warning_tests = require("@finos/perspective-viewer/test/js/render_warning_tests.js");

const { withTemplate } = require("./simple-template");

withTemplate("bar", "Y Bar");
withTemplate("bar-x", "X Bar");
withTemplate("bar-themed", "Y Bar", { template: "themed-template" });

utils.with_server({}, () => {
    describe.page(
        "bar.html",
        () => {
            const get_contents = utils.get_contents.bind(
                null,
                "perspective-viewer perspective-viewer-d3fc-ybar"
            );
            simple_tests.default(get_contents);
            // render_warning_tests.default("Y Bar");
        },
        { root: path.join(__dirname, "..", "..", "..") }
    );

    describe.page(
        "bar-x.html",
        () => {
            const get_contents = utils.get_contents.bind(
                null,
                "perspective-viewer perspective-viewer-d3fc-xbar"
            );
            simple_tests.default(get_contents);
            // render_warning_tests.default("X Bar");
        },
        { root: path.join(__dirname, "..", "..", "..") }
    );

    describe.page(
        "bar-themed.html",
        () => {
            simple_tests.default(
                utils.get_contents.bind(
                    null,
                    "perspective-viewer perspective-viewer-d3fc-ybar"
                )
            );
            // render_warning_tests.default("Y Bar");
        },
        { root: path.join(__dirname, "..", "..", "..") }
    );
});
