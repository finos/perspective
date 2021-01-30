/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const path = require("path");
const {existsSync} = require("fs");
const {execute, execute_return} = require("./script_utils.js");

// Packages listed as dependencies & dev dependencies inside Jupyterlab plugin
const packages = ["perspective", "perspective-viewer", "perspective-viewer-datagrid", "perspective-viewer-d3fc", "perspective-test", "perspective-webpack-plugin"].map(pkg => `@finos/${pkg}`);

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
(async function() {
    try {
        // check if @finos packages are already linked
        const link_path = path.resolve(process.env.HOME, ".config/yarn/link", "@finos");

        if (!existsSync(link_path)) {
            throw Error(`No @finos links found in ${link_path} - run \`yarn link\` inside all Perspective packages first.`);
        }

        const paths = await execute_return("jupyter lab path");
        const app_path = paths["stdout"]
            .split("\n")[0]
            .split(":")[1]
            .trim();
        const staging_path = path.resolve(app_path, "staging");

        if (!existsSync(staging_path)) {
            throw Error("Jupyterlab staging path does not exist - run `jupyter lab build` first.");
        }

        process.chdir(staging_path);

        // Run yarn link inside jlab staging
        for (const pkg of packages) {
            execute(`yarn link ${pkg}`);
        }

        // Build from Perspective root
        process.chdir(path.resolve(__dirname, ".."));
        console.log("--------------------------");
        execute("jupyter lab build");

        console.log("--------------------------");
        console.log("Jupyterlab should now have all changes from the current working directory. To pick up new changes, run `yarn build` and `jupyter lab build`.");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
