/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require('path');
const common = require('@jpmorganchase/perspective/src/config/common.config.js');

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

const plugins = [
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)
];

if (!process.env.PSP_NO_MINIFY && !process.env.PSP_DEBUG) {
    plugins.push(new UglifyJSPlugin({
        sourceMap: false,
        mangle: false,
        output: {
            ascii_only: true
        }
    }));
}
module.exports = Object.assign({}, common(), {
    entry: './src/ts/index.ts',
    plugins: plugins,
    output: {
        filename: 'index.js',
        libraryTarget: "umd",
        path: path.resolve(__dirname, '../../build')
    }
});

module.exports.module.rules.push({test: /\.ts?$/, loader: "ts-loader"})