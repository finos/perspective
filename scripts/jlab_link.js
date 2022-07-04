/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const {execute} = require("./script_utils.js");

// Packages listed as dependencies & dev dependencies inside Jupyterlab plugin
const packages = [
    "./packages/perspective",
    "./rust/perspective-viewer",
    "./packages/perspective-viewer-datagrid",
    "./packages/perspective-viewer-d3fc",
    "./packages/perspective-viewer-openlayers",
    "./packages/perspective-jupyterlab",
];

/**
 * In order for Jupyterlab to pick up changes to @finos/perspective-* in the
 * local working directory, we use `yarn link` to force Jupyterlab to look
 * locally for all `perspective` packages, instead of pulling them from NPM
 * during `jupyter lab install`. This script should be run whenever
 * `jupyter lab clean` has been run, as cleaning the Jupyterlab dir will
 * also break links.
 *
 * This allows us to distribute just the Jupyterlab plugin without inlining
 * the rest of Perspective, but also allows for developers to see their local
 * changes picked up in their current Jupyterlab installation.
 *
 * To set up your Jupyterlab environment with the local
 * `perspective-jupyterlab` plugin, run
 * `jupyter labextension install ./packages/perspective-jupyterlab` to link
 * to the local plugin.
 */
(async function () {
    try {
        execute`jupyter labextension link ${packages.join(" ")}`;
        console.log(
            "Jupyterlab should now have all changes from the current working directory. To pick up new changes, run `yarn build` and `jupyter lab build`."
        );
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
