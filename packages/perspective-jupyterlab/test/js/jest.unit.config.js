/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

module.exports = {
    roots: ["unit"],
    verbose: true,
    testURL: "http://localhost/",
    automock: false,
    transform: {
        ".js$": "./transform.js",
        ".html$": "html-loader-jest"
    },
    setupFiles: ["./beforeEachSpec.js"]
};
