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
        },
        inline: {
            type: "boolean"
        }
    },
    additionalProperties: true
};

function ab2str(buf) {
    return buf.toString("base64");
}

exports.default = function loader() {};

exports.pitch = function pitch(request) {
    var options = loaderUtils.getOptions(this) || {};
    validateOptions(schema, options, "Cross Origin File Loader");

    var context = options.context || this.rootContext || (this.options && this.options.context);
    var content = fs.readFileSync(request.replace(path.join("dist", "esm"), path.join("dist", "umd")).replace("wasm.js", "wasm"));
    var emitPath = loaderUtils.interpolateName(this, options.name, {
        context,
        content,
        regExp: options.regExp
    });

    if (options.inline) {
        return `
module.exports = (
    function (base64Data) {
        var isBrowser = typeof window !== 'undefined' && typeof window.atob === 'function';
        var binary = isBrowser ? window.atob(base64Data) : Buffer.from(base64Data, 'base64').toString('binary');
        var bytes = new Uint8Array(binary.length);         
        for (var i = 0; i < binary.length; ++i) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer
    }
)("${ab2str(content)}")`;
    } else {
        var outputPath = JSON.stringify(emitPath);
        this.emitFile(emitPath, content);

        const utils_path = JSON.stringify(`!!${path.join(__dirname, "utils.js")}`);
        return `
var utils = require(${utils_path});
module.exports = utils.publicPath(__webpack_public_path__) + ${outputPath};`;
    }
};

exports.raw = true;
