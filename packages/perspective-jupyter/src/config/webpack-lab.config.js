/******************************************************************************
 *
 * Copyright (c) 2022, the perspective authors.
 *
 * This file is part of the perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");

const plugins = [new PerspectivePlugin({inline: true})];

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

module.exports = {
    module: {
        rules,
    },
    plugins,
};
