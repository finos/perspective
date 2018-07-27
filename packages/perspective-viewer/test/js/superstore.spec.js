/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require('./utils.js');

const simple_tests = require('./simple_tests.js');
const computed_column_tests = require('./computed_column_tests.js');
const responsive_tests = require('./responsive_tests');

utils.with_server({}, () => {

    describe.page("superstore.html", () => {
        simple_tests.default();
        computed_column_tests.default();
        responsive_tests.default();
    });

});
