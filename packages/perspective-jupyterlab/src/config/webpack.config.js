/******************************************************************************
 *
 * Copyright (c) 2022, the perspective authors.
 *
 * This file is part of the perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const path = require("path");
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

// Packages that shouldn't be bundled but loaded at runtime
const externals = ["@jupyter-widgets/base"];
const resolve = {
    extensions: [".webpack.js", ".web.js", ".js"],
};

module.exports = [
    /**
     * Notebook extension
     *
     * This bundle only contains the part of the JavaScript that is run on load of
     * the notebook.
     */
    {
        entry: path.resolve(
            __dirname,
            "..",
            "..",
            "dist",
            "esm",
            "notebook",
            "extension.js"
        ),
        output: {
            filename: "extension.js",
            path: path.resolve(
                __dirname,
                "..",
                "..",
                "..",
                "..",
                "python",
                "perspective",
                "perspective",
                "nbextension",
                "static"
            ),
            publicPath: "",
            libraryTarget: "amd",
        },
        module: {
            rules,
        },
        devtool,
        plugins,
        externals,
    },
    {
        // Bundle for the notebook containing the custom widget views and models
        //
        // This bundle contains the implementation for the custom widget views and
        // custom widget.
        // It must be an amd module
        //
        entry: path.resolve(
            __dirname,
            "..",
            "..",
            "dist",
            "esm",
            "notebook",
            "index.js"
        ),
        devtool,
        resolve,
        output: {
            filename: "index.js",
            path: path.resolve(
                __dirname,
                "..",
                "..",
                "..",
                "..",
                "python",
                "perspective",
                "perspective",
                "nbextension",
                "static"
            ),
            publicPath: "",
            libraryTarget: "amd",
        },
        module: {
            rules,
        },
        externals,
        plugins,
    },
];
