/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const FILE_WORKER_LOADER = require.resolve("@jpmorganchase/perspective-webpack-plugin/lib/file-worker-loader");
const CROSS_ORIGIN_FILE_LOADER = require.resolve("@jpmorganchase/perspective-webpack-plugin/lib/cross-origin-file-loader.js");
const BLOB_LOADER = require.resolve("@jpmorganchase/perspective-webpack-plugin/lib/blob-worker-loader.js");

const include = [__dirname];

class PerspectiveWebpackPlugin {
    constructor(options = {}) {
        this.options = options;
    }

    apply(compiler) {
        const rules = [
            {
                test: /psp\.(sync|async)\.wasm\.js$/,
                include,
                use: {
                    loader: CROSS_ORIGIN_FILE_LOADER, 
                    options: {
                        name: "[name]"
                    }
                }
            }
        ];

        if (this.options.build_worker) {
            rules.push({
                test: /perspective\.(asmjs|wasm)\.js$/,
                include,
                use: [
                    {
                        loader: FILE_WORKER_LOADER,
                        options: {name: "[name].js", compiled: true}
                    },
                    {
                        loader: BLOB_LOADER,
                        options: {
                            name: "[name].worker.js"
                        }
                    }
                ]
            });
        } else {
            rules.push({
                test: /perspective\.(wasm|asmjs)\.js$/,
                include,
                use: {
                    loader: FILE_WORKER_LOADER,
                    options: {
                        name: "[name].js"
                    }
                }
            });
        }

        const compilerOptions = compiler.options;
        const moduleOptions = compilerOptions.module || (compilerOptions.module = {});
        moduleOptions.rules = (moduleOptions.rules || []).concat(rules);
    }
}

module.exports = PerspectiveWebpackPlugin;
