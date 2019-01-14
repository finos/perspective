/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const loaderUtils = require("loader-utils");
const validateOptions = require("@webpack-contrib/schema-utils");

const NodeTargetPlugin = require("webpack/lib/node/NodeTargetPlugin");
const SingleEntryPlugin = require("webpack/lib/SingleEntryPlugin");
const WebWorkerTemplatePlugin = require("webpack/lib/webworker/WebWorkerTemplatePlugin");

class BlobWorkerLoaderError extends Error {
    constructor(err) {
        super(err);

        this.name = err.name || "Loader Error";
        this.message = `${err.name}\n\n${err.message}\n`;
        this.stack = false;
    }
}

const schema = {
    type: "object",
    properties: {
        name: {
            type: "string"
        }
    },
    additionalProperties: false
};

exports.default = function loader() {};

exports.pitch = function pitch(request) {
    const options = loaderUtils.getOptions(this) || {};

    validateOptions({name: "Blob Worker Loader", schema, target: options});

    if (!this.webpack) {
        throw new BlobWorkerLoaderError({
            name: "Blob Worker Loader",
            message: "This loader is only usable with webpack"
        });
    }

    this.cacheable(false);

    const filename = loaderUtils.interpolateName(this, options.name || "[hash].worker.js", {
        context: options.context || this.rootContext || this.options.context,
        regExp: options.regExp
    });

    if (process.env.PSP_DEBUG && filename.indexOf("asmjs") > -1) {
        return;
    }

    const cb = this.async();

    const worker = {};

    worker.options = {
        filename,
        chunkFilename: `[id].${filename}`,
        namedChunkFilename: null
    };

    worker.compiler = this._compilation.createChildCompiler("worker", worker.options);

    new WebWorkerTemplatePlugin(worker.options).apply(worker.compiler);

    if (this.target !== "webworker" && this.target !== "web") {
        new NodeTargetPlugin().apply(worker.compiler);
    }

    new SingleEntryPlugin(this.context, `!!${request}`, "main").apply(worker.compiler);

    const subCache = `subcache ${__dirname} ${request}`;

    worker.compilation = compilation => {
        if (compilation.cache) {
            if (!compilation.cache[subCache]) {
                compilation.cache[subCache] = {};
            }
            compilation.cache = compilation.cache[subCache];
        }
    };

    if (worker.compiler.hooks) {
        const plugin = {name: "BlobWorkerLoader"};
        worker.compiler.hooks.compilation.tap(plugin, worker.compilation);
    } else {
        worker.compiler.plugin("compilation", worker.compilation);
    }

    worker.compiler.runAsChild((err, entries) => {
        if (err) return cb(err);

        if (entries[0]) {
            worker.file = entries[0].files[0];
            return cb(null, this._compilation.assets[worker.file].children[0]._value);
        }

        return cb(null, null);
    });
};
