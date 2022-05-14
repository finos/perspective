/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
// Entry point for the unpkg bundle containing custom model definitions.
//
// It differs from the notebook bundle in that it does not need to define a
// dynamic baseURL for the static assets and may load some css that would
// already be loaded by the notebook otherwise.

// Export widget models and views, and the npm package version number.
module.exports = require("./nbextension.js");
module.exports["version"] = require("../package.json").version;
