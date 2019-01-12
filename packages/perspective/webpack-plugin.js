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

const include = [__dirname];

class PerspectiveWebpackPlugin {
    constructor(options = {}) {
        this.options = options;
    }

    apply(compiler) {
        if (this.options.build_worker) {
            rules.push({
                test: /perspective\.(asmjs|wasm)\.js$/,
                include,
                use: [
                    {
                        loader: WORKER_LOADER_PATH,
                        options: {name: "[name].js", compiled: true}
                    },
                    {
                        loader: BLOB_LOADER_PATH,
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
                    loader: WORKER_LOADER_PATH,
                    options: {
                        name: "[name].js"
                    }
                }
            });
        }

        rules.push({
            test: /psp\.(sync|async)\.wasm\.js$/,
            include,
            use: {
                loader: WASM_LOADER_PATH, 
                options: {
                    name: "[name]"
                }
            }
        });

        const compilerOptions = compiler.options;
        const moduleOptions = compilerOptions.module || (compilerOptions.module = {});
        moduleOptions.rules = (moduleOptions.rules || []).concat(rules);
    }
}

module.exports = PerspectiveWebpackPlugin;
