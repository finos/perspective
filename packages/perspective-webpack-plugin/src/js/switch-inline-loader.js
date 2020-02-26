/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

exports.default = function pitch(request) {
    return request;
};

exports.pitch = function(request) {
    const new_path = request.replace(/umd[/\\]perspective.inline/, path.join("esm", "perspective.parallel")).replace(/\\/g, "\\\\");
    return `module.exports = require("${new_path}");`;
};

exports.raw = true;
