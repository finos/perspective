/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");
const PerspectivePlugin = require("@jpmorganchase/perspective/webpack-plugin");
const webpack = require("webpack");

module.exports = {
    entry: "./src/ts/index.ts",
    resolveLoader: {
        alias: {
            "file-worker-loader": "@jpmorganchase/perspective/loader/file_worker_loader.js"
        }
    },
    resolve: {
        extensions: [".ts", ".js", ".json"]
    },
    externals: /\@jupyter|\@phosphor/,
    plugins: [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/), 
        new PerspectivePlugin()
    ],
    module: {
        rules: [
            {
                test: /\.less$/,
                exclude: /themes/,
                use: [
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "clean-css-loader",
                        options: {
                            level: 2
                        }
                    },
                    {
                        loader: "less-loader"
                    }
                ]
            },
            {
                test: /\.(html)$/,
                loader: "html-loader"
            },
            {
                test: /\.(arrow)$/,
                loader: "arraybuffer-loader"
            },
            {
                test: /\.js$/,
                exclude: /node_modules[/\\](?!\@jpmorganchase)|psp\.(asmjs|async|sync)\.js|perspective\.(asmjs|wasm)\.worker\.js/,
                loader: "babel-loader",
            },
            {
                test: /\.css$/,
                use: [{loader: "css-loader"}]
            },
            {
                test: /\.ts?$/, loader: "ts-loader"
            }
        ]
    },
    output: {
        filename: "index.js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../dist")
    }
};
