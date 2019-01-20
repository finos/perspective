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
const validateOptions = require("@webpack-contrib/schema-utils");

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
    validateOptions({ schema, target: options, name: "File Worker Loader" });
    const context = options.context || this.rootContext || (this.options && this.options.context);
    const url = loaderUtils.interpolateName(this, options.name, {
        context,
        content,
        regExp: options.regExp
    });
    const emitPath = url.replace(/\.js/, ".worker.js");

    if (!options.compiled) {
        var inputPath = this.resourcePath;
        if (!options.inline) {
            inputPath = inputPath
                .replace(path.join("perspective", "build"), "perspective")
                .replace(/\.js/, ".worker.js")
                .replace(/(es\/js)/, "build");
        }
        content = fs.readFileSync(inputPath).toString();
        if (!options.compiled) {
            this.emitFile(emitPath, "" + content);
            const map_file = `${inputPath}.map`;
            if (fs.existsSync(map_file)) {
                const map_content = fs.readFileSync(map_file).toString();
                this.emitFile(`${emitPath}.map`, "" + map_content);
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
        // TODO: LukeSheard - I think this logic need revisiting in a webpack world.
        return `module.exports = function() {
            var utils = require(${utils_path});
            var publicPath = __webpack_public_path__ || utils.path;
            var workerPath = publicPath + ${outputPath};
            if (__webpack_public_path__ || window.location.hostname === utils.host.slice(0, window.location.hostname.length)) {
                return new Promise(function(resolve) {
                    resolve(new Worker(workerPath)); 
                });
            } else {
                return new Promise(function(resolve) {
                    utils.XHRWorker(workerPath, resolve);
                });
            }
        };`;
    }

};
