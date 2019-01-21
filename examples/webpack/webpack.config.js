/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const PerspectivePlugin = require("@jpmorganchase/perspective/webpack-plugin");
const path = require("path");

module.exports = {
    context: __dirname,
    mode: "development",
    entry: "./in.js",
    output: {
        filename: "out.js",
        library: "out",
        libraryTarget: "umd",
        libraryExport: "default",
        path: path.resolve(__dirname, "./build"),
        publicPath: "http://localhost:8080/build/"
    },
    plugins: [new PerspectivePlugin()],
    devtool: "source-map"
};
