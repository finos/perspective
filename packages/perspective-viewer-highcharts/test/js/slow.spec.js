/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@jpmorganchase/perspective-viewer/test/js/utils.js");
const path = require("path");

const mutation_tests = require("@jpmorganchase/perspective-viewer/test/js/mutation_tests.js");

utils.with_server({}, () => {
    describe.page(
        "line.html",
        () => {
            mutation_tests.default();
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
