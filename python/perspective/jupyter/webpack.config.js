/******************************************************************************
 *
 * Copyright (c) 2022, the perspective authors.
 *
 * This file is part of the perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const path = require("path");

const exclude = /\.\.\/\.\.\/\.\.\/node_modules/;
const rules = [
    {test: /\.js$/, loader: "source-map-loader", exclude},
    {test: /\.css$/, use: ["style-loader", "css-loader"], exclude},
];

// Packages that shouldn't be bundled but loaded at runtime
// const externals = ["@jupyter-widgets/base", /@jupyterlab/, /node_modules/];
const externals = /\.\.\/\.\.\/\.\.\/node_modules/;
const resolve = {
    extensions: [".js"],
};

module.exports = [
    /**
     * Notebook extension
     *
     * This bundle only contains the part of the JavaScript that is run on load of
     * the notebook.
     */
    {
        entry: "./src/extension.js",
        output: {
            filename: "index.js",
            path: path.resolve(
                __dirname,
                "..",
                "perspective",
                "nbextension",
                "static"
            ),
            libraryTarget: "amd",
        },
        module: {
            rules,
        },
        devtool: "source-map",
        externals,
        resolve,
    },
    {
        // Bundle for the notebook containing the custom widget views and models
        //
        // This bundle contains the implementation for the custom widget views and
        // custom widget.
        // It must be an amd module
        //
        entry: "./lib/index.js",
        devtool: "source-map",
        resolve,
        output: {
            filename: "index.js",
            path: path.resolve(
                __dirname,
                "..",
                "perspective",
                "nbextension",
                "static"
            ),
            libraryTarget: "amd",
        },
        module: {
            rules,
        },
        externals: ["@jupyter-widgets/base"],
    },
];
