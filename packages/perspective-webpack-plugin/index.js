/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {get_config} = require("@finos/perspective/dist/esm/config");
const path = require("path");
const webpack = require("webpack");
const cssnano = require("cssnano");

class PerspectiveWebpackPlugin {
    constructor(options = {}) {
        this.options = Object.assign(
            {},
            {
                inline: false,
                inlineWasm: false,
                inlineWorker: false,
                wasmPath: path.dirname(require.resolve("@finos/perspective/package.json")),
                workerPath: path.dirname(require.resolve("@finos/perspective/package.json")),
                wasmName: "[name].wasm",
                workerName: "[name].js"
            },
            options
        );
    }

    apply(compiler) {
        const compilerOptions = compiler.options;
        const moduleOptions = compilerOptions.module || (compilerOptions.module = {});
        const rules = [];
        rules.push({
            test: /perspective\.worker\.js$/,
            type: "javascript/auto",
            include: this.options.workerPath,
            use: {
                loader: "worker-loader",
                options: {
                    filename: this.options.workerName
                }
            }
        });

        rules.push({
            test: /editor\.worker\.js$/,
            type: "javascript/auto",
            include: /monaco\-editor/,
            use: {
                loader: "worker-loader",
                options: {
                    filename: "editor.worker.js"
                }
            }
        });

        if (this.options.inline || this.options.inlineWorker) {
            rules[rules.length - 2].use.options.inline = "no-fallback";
            rules[rules.length - 1].use.options.inline = "no-fallback";
        }

        if (!(this.options.inline || this.options.inlineWasm)) {
            rules.push({
                test: /\.wasm$/,
                type: "javascript/auto",
                include: this.options.wasmPath,
                use: {
                    loader: "file-loader",
                    options: {
                        name: this.options.wasmName
                    }
                }
            });
        } else {
            rules.push({
                test: /\.wasm$/,
                type: "javascript/auto",
                include: this.options.wasmPath,
                loader: "arraybuffer-loader"
            });
        }

        rules.push({
            test: /\.css$/,
            include: /monaco\-editor/,
            use: [
                {loader: "css-loader", options: {sourceMap: false}},
                {
                    loader: "postcss-loader",
                    options: {
                        sourceMap: false,
                        postcssOptions: {
                            map: {annotation: false},
                            minimize: true,
                            plugins: [
                                cssnano({
                                    preset: "lite",
                                    discardComments: {removeAll: true}
                                })
                            ]
                        }
                    }
                }
            ]
        });

        rules.push({
            test: /\.ttf$/,
            include: /monaco\-editor/,
            use: ["file-loader"]
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

        const plugin_replace = new webpack.NormalModuleReplacementPlugin(/@finos\/perspective$/, "@finos/perspective/dist/esm/perspective.parallel.js");
        plugin_replace.apply(compiler);

        moduleOptions.rules = (moduleOptions.rules || []).concat(rules);
    }
}

module.exports = PerspectiveWebpackPlugin;
