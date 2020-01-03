/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, config =>
    Object.assign(config, {
        entry: path.join(__dirname, "../dist/esm/index.js"),
        externals: [/^[a-z0-9@]/],
        output: {
            filename: "index.js",
            libraryTarget: "commonjs",
            path: path.resolve(__dirname, "../dist/cjs")
        }
    })
);
