/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");

const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

utils.with_server({}, () => {
    describe.page(
        "heatmap.html",
        () => {
            simple_tests.default();

            describe("tooltip tests", () => {
                const point = ".highcharts-point";

                test.capture("tooltip shows on hover.", async page => {
                    await utils.invoke_tooltip(point, page);
                });
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});
