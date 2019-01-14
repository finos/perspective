/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

const loaderUtils = require("loader-utils");
const validateOptions = require("schema-utils");

const fs = require("fs");

const schema = {
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
    if (process.env.PSP_DEBUG && content && content.indexOf("asmjs") > -1) {
        return "module.exports = function() {};";
    }
    const options = loaderUtils.getOptions(this) || {};
    validateOptions(schema, options, "File Worker Loader");
    const context = options.context || this.rootContext || (this.options && this.options.context);
    const url = loaderUtils.interpolateName(this, options.name, {
        context,
        content,
        regExp: options.regExp
    });
    const outputPath = url.replace(/\.js/, ".worker.js");

    if (!options.compiled) {
        var inputPath = this.resourcePath;
        if (!options.inline) {
            inputPath = inputPath
                .replace(path.join("perspective", "build"), "perspective")
                .replace(/\.js/, ".worker.js")
                .replace(/(src\/js)/, "build");
        }
        content = fs.readFileSync(inputPath).toString();
        if (!options.compiled) {
            this.emitFile(outputPath, "" + content);
            const map_file = `${inputPath}.map`;
            if (fs.existsSync(map_file)) {
                const map_content = fs.readFileSync(map_file).toString();
                this.emitFile(`${outputPath}.map`, "" + map_content);
            }
        }
    }

    const publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;
    const utils_path = JSON.stringify(`!!${path.join(__dirname, "utils.js")}`);

    if (options.inline) {
        const worker_text = JSON.stringify(content.toString())
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029");

        return `module.exports = function() {
            var utils = require(${utils_path});
            return new Promise(function(resolve) { utils.BlobWorker(${worker_text}, resolve); });
        };`;
    }

    return `module.exports = function() {
        var utils = require(${utils_path});
        if (window.location.origin === utils.host.slice(0, window.location.origin.length)) {
            return new Promise(function(resolve) { resolve(new Worker(utils.path + ${publicPath})); });
        } else {
            return new Promise(function(resolve) { utils.XHRWorker(utils.path + ${publicPath}, resolve); });
        }
    };`;
};
