/******************************************************************************
 *
 * Copyright (c) 2022, the perspective authors.
 *
 * This file is part of the perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const webpack = require("webpack");
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");

const devtool = process.argv.mode === "development" ? "source-map" : false;
const plugins = [
    new PerspectivePlugin({inline: true}),
    new webpack.DefinePlugin({
        "process.env": "{}",
    }),
];

const rules = [
    {
        test: /\.less$/,
        exclude: /node_modules/,
        use: ["style-loader", "css-loader", "less-loader"],
    },
    {
        test: /\.css$/,
        exclude: [/monaco-editor/], // <- Exclude `monaco-editor`
        use: ["style-loader", "css-loader"],
    },
];

const externals = ["@jupyter-widgets/base"];

module.exports = {
    entry: "./dist/esm/lab/index.js",
    module: {
        rules,
    },
    devtool,
    plugins,
    externals,
};
