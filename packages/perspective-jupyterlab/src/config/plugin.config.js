/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

module.exports = {
    mode: process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG ? "development" : process.env.NODE_ENV || "production",
    entry: {
        index: "./src/ts/index.ts"
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            path: false,
            fs: false,
            crypto: false
        }
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    externals: [/^[a-z0-9@]/],
    stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
    module: {
        rules: [
            {
                test: /\.less$/,
                use: [{loader: "style-loader"}, {loader: "css-loader"}, {loader: "less-loader"}]
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [{loader: "css-loader"}]
            },
            {
                test: /\.(html)$/,
                use: {
                    loader: "html-loader",
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
        filename: "[name].js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../dist")
    }
};
