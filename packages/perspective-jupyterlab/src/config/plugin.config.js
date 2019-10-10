/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");
const webpack = require("webpack");

module.exports = {
    mode: process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG ? "development" : process.env.NODE_ENV || "production",
    entry: "./src/ts/index.ts",
    devtool: "cheap-eval-source-map",
    resolveLoader: {
        alias: {
            "file-worker-loader": "@finos/perspective-webpack-plugin/src/js/psp-worker-loader.js"
        }
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    externals: /\@jupyter|\@phosphor/,
    stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
    plugins: [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/), new PerspectivePlugin()],
    module: {
        rules: [
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [{loader: "css-loader"}]
            },
            {
                test: /\.(wasm)$/,
                type: "javascript/auto",
                use: {
                    loader: "arraybuffer-loader",
                    options: {}
                }
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: "ts-loader"
            }
        ]
    },
    output: {
        filename: "index.js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../dist")
    }
};
