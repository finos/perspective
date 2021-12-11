/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const PerspectivePlugin = require("@finos/perspective-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
    mode: "development",
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
        new HtmlWebPackPlugin({
            title: "Perspective React Monaco Example",
            template: "./src/index.html",
        }),
        new MonacoWebpackPlugin({
            languages: ["json"],
        }),

        // `PerspectivePlugin` is optional - but if you're already using
        // `MonacoWebpackPlugin` as above, you must disble the former's
        // own support for monaco with `monaco: false` plugin optiom.
        new PerspectivePlugin({monaco: false}),
    ],

    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                loader: "ts-loader",
            },
            {
                test: /\.css$/,
                use: [{loader: "style-loader"}, {loader: "css-loader"}],
            },
            {
                test: /\.ttf$/,
                type: "asset/resource",
            },
        ],
    },
    devServer: {
        contentBase: [
            path.join(__dirname, "dist"),
            path.join(__dirname, "../../node_modules/superstore-arrow"),
        ],
    },
};
