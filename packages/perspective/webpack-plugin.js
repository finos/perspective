/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const WORKER_LOADER_PATH = require.resolve("./src/loader/file_worker_loader");
const WASM_LOADER_PATH = require.resolve("./src/loader/cross_origin_file_loader.js");
const BLOB_LOADER_PATH = require.resolve("./src/loader/blob_worker_loader.js");

const BABEL_CONFIG = require("./babel.config.js");

class PerspectiveWebpackPlugin {
    constructor(options = {}) {
        this.options = options;
    }

    apply(compiler) {
        const load_path = [__dirname];
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
            test: /\.js$/,
            include: load_path,
            exclude: /node_modules[/\\](?!\@jpmorganchase)|psp\.(asmjs|async|sync)\.js|perspective\.(asmjs|wasm)\.worker\.js/,
            loader: "babel-loader",
            options: BABEL_CONFIG
        });

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
