/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {WasmPlugin} = require("./wasm.js");
const {WorkerPlugin} = require("./worker.js");
const {ReplacePlugin} = require("./replace.js");

exports.PerspectiveEsbuildPlugin = function PerspectiveEsbuildPlugin(
    options = {}
) {
    const wasm_plugin = WasmPlugin(!!options.wasm?.inline);
    const worker_plugin = WorkerPlugin(!!options.worker?.inline);

    // Rust outputs a `URL()` when an explicit path for the wasm
    // is not specified.  Esbuild ignores this, but webpack does not,
    // and we always call this method with an explicit path, so this
    // plugin strips this URL so webpack builds don't fail.
    const replace_plugin = ReplacePlugin(
        /["']perspective_viewer_bg\.wasm["']/,
        "undefined"
    );

    function setup(build) {
        wasm_plugin.setup(build);
        worker_plugin.setup(build);
        // replace_plugin.setup(build);
        // build.onResolve({filter: /^[A-Za-z0-9\@]/}, (args) => {
        //     if (!whitelist || !args.path.startsWith(whitelist)) {
        //         return {
        //             path: args.path,
        //             external: true,
        //             namespace: "skip-node-modules",
        //         };
        //     }
        // });
    }

    return {
        name: "@finos/perspective-esbuild-plugin",
        setup,
    };
};

// exports.PerspectiveEsbuildPlugin = exports;
