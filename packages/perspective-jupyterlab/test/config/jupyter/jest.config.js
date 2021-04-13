/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const main_config = require("@finos/perspective-test/jest.config.js");

module.exports = Object.assign(main_config, {
    globalSetup: "<rootDir>/test/config/jupyter/globalSetup.js",
    setupFilesAfterEnv: ["<rootDir>/test/config/jupyter/teardown.js"],
    testMatch: ["<rootDir>/test/jupyter/*.spec.js"],
    roots: ["test"]
});
