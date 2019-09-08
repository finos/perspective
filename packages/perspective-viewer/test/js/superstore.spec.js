/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");

const simple_tests = require("./simple_tests.js");
const responsive_tests = require("./responsive_tests");
const path = require("path");

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            simple_tests.default();

            describe("Responsive Layout", () => {
                responsive_tests.default();
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});
