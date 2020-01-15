/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

exports.default = function pitch(request) {
    return request;
};

exports.pitch = function() {
    return `module.exports.default = function() {}`;
};

exports.raw = true;
