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

exports.default = function loader(content) {
    var options = loaderUtils.getOptions(this) || {};

    validateOptions(schema, options, "File Worker Loader");

    var context = options.context || this.rootContext || (this.options && this.options.context);

    var url = loaderUtils.interpolateName(this, options.name, {
        context,
        content,
        regExp: options.regExp
    });

    var outputPath = url.replace(/\.js/, ".worker.js");
    var inputPath = this.resourcePath.replace(/\.js/, ".worker.js").replace(/src\/js/, "build");
    var new_content = fs.readFileSync(inputPath);

    var publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;

    this.emitFile(outputPath, new_content);

    const utils_path = JSON.stringify(`!!${path.join(__dirname, "utils.js")}`);

    return `module.exports = function() {
        var utils = require(${utils_path});
        
        if (window.location.origin === utils.host.slice(0, window.location.origin.length)) {
            return new Promise(function(resolve) { resolve(new Worker(utils.path + ${publicPath})); });
        } else {
            return new Promise(function(resolve) { new utils.XHRWorker(utils.path + ${publicPath}, resolve); });
        }
    };`;
};

exports.raw = true;
