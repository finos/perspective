/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const HtmlWebPackPlugin = require("html-webpack-plugin");
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");

module.exports = {
    context: __dirname,
    entry: "./src/index.js",
    mode: "development",
    output: {
        filename: "public/bundle.js",
        publicPath: "http://localhost:8080/"
    },
    plugins: [
        new HtmlWebPackPlugin({
            title: "Perspective Webpack Cross-Origin Example",
            template: "./src/index.html",
            filename: "public/index.html",
            inject: "head"
        }),
        new PerspectivePlugin({
            wasmLoaderOptions: {
                name: "[hash].wasm"
            },
            workerLoaderOptions: {
                name: "[hash].worker.[ext]"
            }
        })
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                exclude: [/packages/, /node_modules/],
                use: [{loader: "style-loader"}, {loader: "css-loader"}]
            }
        ]
    },
    devtool: "source-map",
    devServer: {
        historyApiFallback: true,
        watchOptions: {aggregateTimeout: 300, poll: 1000},
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        }
    }
};
