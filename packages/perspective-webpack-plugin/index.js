/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const PSP_WORKER_LOADER = require.resolve("./src/js/psp-worker-loader");
const WASM_LOADER = require.resolve("./src/js/wasm-loader.js");
const PSP_WORKER_COMPILER_LOADER = require.resolve("./src/js/psp-worker-compiler-loader.js");

const BABEL_CONFIG = require("./babel.config.js");

class PerspectiveWebpackPlugin {
    constructor(options = {}) {
        this.options = options;
    }

    apply(compiler) {
        const load_path = [__dirname.replace("-webpack-plugin", "")];
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
                        loader: PSP_WORKER_LOADER,
                        options: {name: "[name].worker.js", compiled: true}
                    },
                    {
                        loader: PSP_WORKER_COMPILER_LOADER,
                        options: {name: "[name].worker.js"}
                    }
                ]
            });
        } else {
            rules.push({
                test: /perspective\.(wasm|asmjs)\.js$/,
                include: load_path,
                use: {
                    loader: PSP_WORKER_LOADER,
                    options: {name: "[name].worker.js"}
                }
            });
        }

        if (!this.options.build_worker) {
            rules.push({
                test: /\.js$/,
                include: load_path,
                exclude: /node_modules[/\\](?!\@jpmorganchase)|psp\.(asmjs|async|sync)\.js|perspective\.(asmjs|wasm)\.worker\.js/,
                loader: "babel-loader",
                options: BABEL_CONFIG
            });
        }

        rules.push({
            test: /psp\.(sync|async)\.wasm\.js$/,
            include: load_path,
            use: {loader: WASM_LOADER, options: {name: "[name]"}}
        });

        const compilerOptions = compiler.options;
        const moduleOptions = compilerOptions.module || (compilerOptions.module = {});
        moduleOptions.rules = (moduleOptions.rules || []).concat(rules);
    }
}

module.exports = PerspectiveWebpackPlugin;
