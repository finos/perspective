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
const {get_config} = require("@finos/perspective/dist/esm/config");

class PerspectiveWebpackPlugin {
    constructor(options = {}) {
        this.options = Object.assign(
            {},
            {
                load_path: [/@finos[\\/]perspective/, __dirname.replace("-webpack-plugin", "")],
                workerLoaderOptions: {
                    name: "[name].worker.js"
                },
                wasmLoaderOptions: {
                    name: "[name]"
                }
            },
            options
        );
    }

    apply(compiler) {
        const compilerOptions = compiler.options;
        const moduleOptions = compilerOptions.module || (compilerOptions.module = {});

        const rules = [];

        if (!this.options.inline) {
            rules.push({
                test: /perspective\.inline\.js/,
                include: this.options.load_path,
                use: [
                    {
                        loader: require.resolve("./src/js/switch-inline-loader.js")
                    }
                ]
            });

            if (compilerOptions.target !== "node") {
                rules.push({
                    test: /__node\.js$/,
                    include: this.options.load_path,
                    use: [
                        {
                            loader: require.resolve("./src/js/null-loader.js")
                        }
                    ]
                });
            }
        }

        if (this.options.build_worker) {
            rules.push({
                test: /perspective\.wasm\.js$/,
                include: this.options.load_path,
                use: [
                    {
                        loader: PSP_WORKER_LOADER,
                        options: Object.assign({}, this.options.workerLoaderOptions, {compiled: true})
                    },
                    {
                        loader: PSP_WORKER_COMPILER_LOADER,
                        options: {name: "[name].worker.js"}
                    }
                ]
            });
        } else {
            rules.push({
                test: /perspective\.wasm\.js$/,
                include: this.options.load_path,
                use: {
                    loader: PSP_WORKER_LOADER,
                    options: this.options.workerLoaderOptions
                }
            });
        }

        rules.push({
            test: /\.js$/,
            loader: "source-map-loader",
            exclude: [/node_modules\/chevrotain/]
        });

        const perspective_config = get_config();
        if (perspective_config) {
            rules.push({
                test: /\.js$/,
                include: /perspective[\\/].+?[\\/]config[\\/]index\.js$/,
                use: [
                    {
                        loader: "string-replace-loader",
                        options: {
                            search: "global.__TEMPLATE_CONFIG__",
                            replace: JSON.stringify(perspective_config, null, 4)
                        }
                    }
                ]
            });
        }

        rules.push({
            test: /psp\.async\.wasm\.js$/,
            include: this.options.load_path,
            use: {
                loader: WASM_LOADER,
                options: this.options.wasmLoaderOptions
            }
        });

        moduleOptions.rules = (moduleOptions.rules || []).concat(rules);
    }
}

module.exports = PerspectiveWebpackPlugin;
