/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

var path = require("path");

var loaderUtils = require("loader-utils");
var validateOptions = require("schema-utils");
var fs = require("fs");

var schema = {
    type: "object",
    properties: {
        name: {},
        regExp: {},
        context: {
            type: "string"
        }
    },
    additionalProperties: true
};

exports.default = function loader() {};

exports.pitch = function pitch(request) {
    var options = loaderUtils.getOptions(this) || {};
    validateOptions(schema, options, "Cross Origin File Loader");

    var context = options.context || this.rootContext || (this.options && this.options.context);
    var content = fs.readFileSync(request.replace("src/js", "build").replace("wasm.js", "wasm"));
    var url = loaderUtils.interpolateName(this, options.name, {
        context,
        content,
        regExp: options.regExp
    });

    var outputPath = url;
    var publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;
    this.emitFile(outputPath, content);

    const utils_path = JSON.stringify(`!!${path.join(__dirname, "utils.js")}`);
    return `
    var utils = require(${utils_path});
    module.exports = (utils.path + ${publicPath});    
    `;
};

exports.raw = true;
