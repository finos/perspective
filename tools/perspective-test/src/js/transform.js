/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const config = require("@finos/perspective-test/babel.config");
config.presets[0][1].modules = "auto";

module.exports = require("babel-jest").createTransformer(config);
