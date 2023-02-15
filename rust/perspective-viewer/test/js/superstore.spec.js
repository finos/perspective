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
const path = require("path");

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            let get_contents = async function get_contents_default(page) {
                return await page.evaluate(async () => {
                    const viewer = document.querySelector(
                        "perspective-viewer perspective-viewer-plugin"
                    );
                    return viewer.innerHTML;
                });
            };
            simple_tests.default(get_contents);
        },
        { reload_page: false, root: path.join(__dirname, "..", "..") }
    );
});
