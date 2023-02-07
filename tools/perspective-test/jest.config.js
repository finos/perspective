/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
module.exports = {
    roots: ["test/js/"],
    testEnvironmentOptions: {
        url: "http://localhost/",
    },
    transform: {
        ".html$": "html-loader-jest",
    },
    transformIgnorePatterns: [
        "/node_modules/(?!(d3|internmap|delaunator|robust-predicates)).+\\.js",
    ],
    automock: false,
    setupFiles: ["@finos/perspective-test/src/js/beforeEachSpec.js"],
    testEnvironment: "@finos/perspective-test/src/js/set_timezone.js",
    reporters: ["default"],
    // globalSetup: "@finos/perspective-test/src/js/globalSetup.js",
    // globalTeardown: "@finos/perspective-test/src/js/globalTeardown.js",
};
