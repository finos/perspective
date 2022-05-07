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
const version = require("./package.json").version;
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");

const devtool = process.argv.mode === "development" ? "source-map" : false;
const plugins = [
    new PerspectivePlugin({inline: true}),
    new webpack.DefinePlugin({
        "process.env": "{}",
        global: {}
      })];

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
    {test: /\.js$/, loader: "babel-loader"},
  ];
  
// Packages that shouldn't be bundled but loaded at runtime
const externals = ["@jupyter-widgets/base"];
const resolve = {
// Add '.ts' and '.tsx' as resolvable extensions.
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
        entry: "./lib/extension.js",
        output: {
            filename: "extension.js",
            path: path.resolve(
                __dirname,
                "..",
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
        entry: "./lib/index.js",
        devtool,
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
            publicPath: "",
            libraryTarget: "amd",
        },
        module: {
            rules,
        },
        externals,
        plugins,
    },
    {
        // Embeddable {{ cookiecutter.npm_package_name }} bundle
        //
        // This bundle is generally almost identical to the notebook bundle
        // containing the custom widget views and models.
        //
        // The only difference is in the configuration of the webpack public path
        // for the static assets.
        //
        // It will be automatically distributed by unpkg to work with the static
        // widget embedder.
        //
        // The target bundle is always `dist/index.js`, which is the path required
        // by the custom widget embedder.
        //
        entry: "./lib/embed.js",
        output: {
            filename: "index.js",
            path: path.resolve(__dirname, "dist"),
            libraryTarget: "amd",
            publicPath:
                "https://unpkg.com/@finos/perspective-jupyter@" +
                version +
                "/dist/",
        },
        devtool,
        module: {
            rules,
        },
        externals,
        plugins,
    },
];
