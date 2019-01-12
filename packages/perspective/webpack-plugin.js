/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const WORKER_LOADER_PATH = require.resolve("./loader/file_worker_loader");
const WASM_LOADER_PATH = require.resolve("./loader/cross_origin_file_loader.js");
const BLOB_LOADER_PATH = require.resolve("./loader/blob_worker_loader.js");

const load_path = [__dirname];

class PerspectiveWebpackPlugin {
    constructor(options = {}) {
        this.options = options;
    }

    apply(compiler) {
        // FIXME These shouldn't be shipped with perspective as they are perspective-viewer or test dependencies
        const rules = [
            {
                test: /\.less$/,
                exclude: /themes/,
                include: load_path,
                use: [{loader: "css-loader"}, {loader: "clean-css-loader", options: {level: 2}}, {loader: "less-loader"}]
            },
            {
                test: /\.(html)$/,
                include: load_path,
                use: {
                    loader: "html-loader",
                    options: {}
                }
            },
            {
                test: /\.(arrow)$/,
                include: load_path,
                use: {
                    loader: "arraybuffer-loader",
                    options: {}
                }
            }
        ];

        if (this.options.build_worker) {
            rules.push({
                test: /perspective\.(asmjs|wasm)\.js$/,
                include: load_path,
                use: [
                    {
                        loader: WORKER_LOADER_PATH,
                        options: {name: "[name].js", compiled: true}
                    },
                    {
                        loader: BLOB_LOADER_PATH,
                        options: {name: "[name].worker.js"}
                    }
                ]
            });
        } else {
            rules.push({
                test: /perspective\.(wasm|asmjs)\.js$/,
                include: load_path,
                use: {
                    loader: WORKER_LOADER_PATH,
                    options: {name: "[name].js"}
                }
            });
        }

        rules.push({
            test: /psp\.(sync|async)\.wasm\.js$/,
            include: load_path,
            use: {loader: WASM_LOADER_PATH, options: {name: "[name]"}}
        });

        const compilerOptions = compiler.options;
        const moduleOptions = compilerOptions.module || (compilerOptions.module = {});
        moduleOptions.rules = (moduleOptions.rules || []).concat(rules);
    }
}

module.exports = PerspectiveWebpackPlugin;
