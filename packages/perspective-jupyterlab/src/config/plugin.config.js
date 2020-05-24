/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");
const webpack = require("webpack");
const packagejson = require("../../package.json");

const rules = [
    {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [{loader: "css-loader"}]
    },
    {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: "ts-loader"
    }
];

module.exports = [
    {
        // bundle for the jupyterlab
        mode: process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG ? "development" : process.env.NODE_ENV || "production",
        entry: {
            index: "./src/ts/labextension.ts"
        },
        resolve: {
            extensions: [".ts", ".js"]
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },
        externals: /\@jupyterlab|\@lumino|\@jupyter-widgets/,
        stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
        plugins: [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)],
        module: {
            rules: rules
        },
        output: {
            filename: "labextension.js",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist")
        }
    },
    {
        // bundle for the classic notebook
        mode: process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG ? "development" : process.env.NODE_ENV || "production",
        entry: "./src/ts/extension.ts",
        resolve: {
            extensions: [".ts", ".js"]
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },
        externals: /\@jupyterlab|\@lumino|\@jupyter-widgets/,
        stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
        plugins: [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)],
        module: {
            rules: rules
        },
        output: {
            filename: "extension.js",
            path: path.resolve(__dirname, "../../dist"),
            libraryTarget: "amd"
        }
    },
    /**
     * Embeddable bundle
     *
     * This bundle is almost identical to the notebook extension bundle. The only
     * difference is in the configuration of the webpack public path for the
     * static assets.
     *
     * The target bundle is always `dist/index.js`, which is the path required by
     * the custom widget embedder.
     */
    {
        mode: process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG ? "development" : process.env.NODE_ENV || "production",
        entry: "./src/ts/index.ts",
        resolve: {
            extensions: [".ts", ".js"]
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },
        externals: /\@jupyterlab|\@lumino|\@jupyter-widgets/,
        stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
        plugins: [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)],
        module: {
            rules: rules
        },
        output: {
            filename: "index.js",
            path: path.resolve(__dirname, "../../dist"),
            libraryTarget: "amd",
            library: "@finos/perspective-jupyterlab",
            publicPath: "https://unpkg.com/@finos/perspective-jupyterlab@" + packagejson.version + "/dist/"
        }
    }
];
