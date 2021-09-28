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
                wasmPath: path.dirname(
                    require.resolve("@finos/perspective/package.json")
                ),
                viewerPath: path.dirname(
                    require.resolve("@finos/perspective-viewer/package.json")
                ),
                workerPath: path.dirname(
                    require.resolve("@finos/perspective/package.json")
                ),
                wasmName: "[name].wasm",
                workerName: "[name].js",
            },
            options
        );
    }

    apply(compiler) {
        const compilerOptions = compiler.options;
        const moduleOptions =
            compilerOptions.module || (compilerOptions.module = {});
        const rules = [];
        rules.push({
            test: /perspective\.worker\.js$/,
            type: "javascript/auto",
            include: this.options.workerPath,
            use: {
                loader: require.resolve("worker-loader"),
                options: {
                    filename: this.options.workerName,
                },
            },
        });

        rules.push({
            test: /editor\.worker\.js$/,
            type: "javascript/auto",
            include: /monaco\-editor/,
            use: {
                loader: require.resolve("worker-loader"),
                options: {
                    filename: "editor.worker.js",
                },
            },
        });

        if (this.options.inline || this.options.inlineWorker) {
            rules[rules.length - 2].use.options.inline = "no-fallback";
            rules[rules.length - 1].use.options.inline = "no-fallback";
        } else {
            rules.push({
                test: /\.js$/,
                include: path.dirname(
                    require.resolve("@finos/perspective-viewer/package.json")
                ),
                use: [
                    {
                        loader: require.resolve("string-replace-loader"),
                        options: {
                            search: /webpackMode:\s*?"eager"/g,
                            replace: "",
                        },
                    },
                ],
            });
        }

        if (!(this.options.inline || this.options.inlineWasm)) {
            rules.push({
                test: /\.wasm$/,
                type: "javascript/auto",
                include: [this.options.wasmPath, this.options.viewerPath],
                use: {
                    loader: require.resolve("file-loader"),
                    options: {
                        name: this.options.wasmName,
                    },
                },
            });
        } else {
            rules.push({
                test: /\.wasm$/,
                type: "javascript/auto",
                include: [this.options.wasmPath, this.options.viewerPath],
                loader: require.resolve("arraybuffer-loader"),
            });
        }

        rules.push({
            test: /\.css$/,
            include: /monaco\-editor/,
            use: [
                {
                    loader: require.resolve("css-loader"),
                    options: {sourceMap: false},
                },
                {
                    loader: require.resolve("postcss-loader"),
                    options: {
                        sourceMap: false,
                        postcssOptions: {
                            map: {annotation: false},
                            minimize: true,
                            plugins: [
                                cssnano({
                                    preset: "lite",
                                    discardComments: {removeAll: true},
                                }),
                            ],
                        },
                    },
                },
            ],
        });

        rules.push({
            test: /\.ttf$/,
            include: /monaco\-editor/,
            use: [require.resolve("file-loader")],
        });

        const perspective_config = get_config();
        if (perspective_config) {
            rules.push({
                test: /\.js$/,
                include: /perspective[\\/].+?[\\/]config[\\/]index\.js$/,
                use: [
                    {
                        loader: require.resolve("string-replace-loader"),
                        options: {
                            search: "global.__TEMPLATE_CONFIG__",
                            replace: JSON.stringify(
                                perspective_config,
                                null,
                                4
                            ),
                        },
                    },
                ],
            });
        }

        const plugin_replace = new webpack.NormalModuleReplacementPlugin(
            /@finos\/perspective$/,
            "@finos/perspective/dist/esm/perspective.parallel.js"
        );
        plugin_replace.apply(compiler);

        const plugin_replace2 = new webpack.NormalModuleReplacementPlugin(
            /@finos\/perspective\-viewer$/,
            "@finos/perspective-viewer/dist/esm/index.js"
        );
        plugin_replace2.apply(compiler);

        moduleOptions.rules = (moduleOptions.rules || []).concat(rules);
    }
}

module.exports = PerspectiveWebpackPlugin;
