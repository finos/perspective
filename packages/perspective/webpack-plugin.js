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

class PerspectiveWebpackPlugin {
    constructor() {}

    apply(compiler) {
        const rules = [
            {
                test: /perspective\.(wasm|asmjs)\.js$/,
                use: {
                    loader: WORKER_LOADER_PATH,
                    options: {name: "[name].js"}
                }
            },
            {
                test: /psp\.async\.wasm\.js$/,
                use: {loader: WASM_LOADER_PATH, options: {name: "[name]"}}
            }
        ];
        const compilerOptions = compiler.options;
        const moduleOptions = compilerOptions.module || (compilerOptions.module = {});
        moduleOptions.rules = (moduleOptions.rules || []).concat(rules);
    }
}

module.exports = PerspectiveWebpackPlugin;
