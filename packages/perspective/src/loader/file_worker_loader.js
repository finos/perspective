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
        compiled: {
            type: "boolean"
        },
        inline: {
            type: "boolean"
        },
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

    if (!options.compiled) {
        var inputPath = this.resourcePath;
        if (!options.inline) {
            inputPath = inputPath
                .replace("build", "")
                .replace(/\.js/, ".worker.js")
                .replace(/(src\/js)/, "build");
        }
        content = fs.readFileSync(inputPath).toString();
    }

    var outputPath = url.replace(/\.js/, ".worker.js");
    var publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;
    var worker_text = '""';

    if (!options.inline && !options.compiled) {
        this.emitFile(outputPath, "" + content);
    }

    if (options.inline) {
        worker_text = JSON.stringify(content.toString())
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029");
    }

    const utils_path = JSON.stringify(`!!${path.join(__dirname, "utils.js")}`);

    return `module.exports = function() {
        var utils = require(${utils_path});
        if (${options.inline}) {
            return new Promise(function(resolve) { utils.BlobWorker(${worker_text}, resolve); });
        } else if (window.location.origin === utils.host.slice(0, window.location.origin.length)) {
            return new Promise(function(resolve) { resolve(new Worker(utils.path + ${publicPath})); });
        } else {
            return new Promise(function(resolve) { utils.XHRWorker(utils.path + ${publicPath}, resolve); });
        }
    };`;
};
