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

module.exports = {
    mode:
        process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG
            ? "development"
            : process.env.NODE_ENV || "production",
    entry: {
        index: "./src/js/psp_widget.js",
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            path: false,
            fs: false,
            crypto: false,
        },
    },
    plugins: [new PerspectivePlugin({})],
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },
    stats: {
        modules: false,
        hash: false,
        version: false,
        builtAt: false,
        entrypoints: false,
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                exclude: /node_modules/,
                use: [
                    {loader: "style-loader"},
                    {loader: "css-loader"},
                    {loader: "less-loader"},
                ],
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [{loader: "css-loader"}],
            },
            {
                test: /\.(html)$/,
                exclude: /node_modules/,
                use: {
                    loader: "html-loader",
                    options: {},
                },
            },
        ],
    },
    experiments: {
        syncWebAssembly: true,
    },
    output: {
        filename: "lumino.js",
        libraryTarget: "umd",
        library: "PerspectiveLumino",
        path: path.resolve(__dirname, "../../dist/umd"),
    },
};
