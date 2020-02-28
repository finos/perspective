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
    const options = loaderUtils.getOptions(this) || {};
    validateOptions(schema, options, "File Worker Loader");
    const context = options.context || this.rootContext || (this.options && this.options.context);
    const emitPath = loaderUtils.interpolateName(this, options.name, {
        context,
        content,
        regExp: options.regExp
    });

    if (!options.compiled) {
        var inputPath = this.resourcePath;
        inputPath = inputPath
            .replace(path.join("perspective", "dist", "esm"), path.join("perspective", "dist", "umd"))
            .replace(path.join("perspective", "dist", "cjs"), path.join("perspective", "dist", "umd"))
            .replace(/\.js/, ".worker.js")
            .replace(path.join("dist", "esm"), path.join("dist", "umd"));
        content = fs.readFileSync(inputPath).toString();
        if (!options.inline) {
            this.emitFile(emitPath, "" + content);
            const map_file = `${inputPath}.map`;
            if (fs.existsSync(map_file)) {
                const map_content = fs.readFileSync(map_file).toString();
                this.emitFile(`${emitPath}.map`, map_content, undefined, {development: true});
            }
        }
    }

    const outputPath = JSON.stringify(emitPath);
    const utils_path = JSON.stringify(`!!${path.join(__dirname, "utils.js")}`);

    if (options.inline) {
        const worker_text = JSON.stringify(content.toString())
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029");

        return `module.exports = function() {
            var utils = require(${utils_path});
            return new Promise(function(resolve) { utils.BlobWorker(${worker_text}, resolve); });
        };`;
    } else {
        return `module.exports = function() {
            var utils = require(${utils_path});
            var workerPath = utils.publicPath(__webpack_public_path__) + ${outputPath};
            if (utils.isCrossOrigin(__webpack_public_path__)) {
                return new Promise(function(resolve) {
                    utils.XHRWorker(workerPath, resolve);
                });
            } else {
                return new Promise(function(resolve) {
                    resolve(new Worker(workerPath)); 
                });
            }
        };`;
    }
};
