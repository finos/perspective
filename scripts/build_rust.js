/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const {bash, execute} = require("./script_utils.js");

/**
 * Compile a Rust package into WASM and copy it into the global node_modules,
 * where it can be used by adding the package name to `package.json`.
 *
 * TODO: consider deploying arrow_accessor as a separate standalone module,
 * like we do with `regular-table`.
 *
 * @param {*} package_name
 */
const compileRustWASM = (package_name, copy = true) => {
    console.log(`-- Compiling ${package_name} to WASM`);
    const base_dir = path.join(__dirname, "..", "rust", "perspective", package_name);
    const node_modules_dir_rust = path.join(__dirname, "..", "node_modules", package_name);

    if (copy) {
        // Clean out existing dir in node_modules
        if (fs.existsSync(node_modules_dir_rust)) {
            console.log(`-- Cleaning existing dir: ${node_modules_dir_rust}`);
            if (process.env.PSP_DOCKER) {
                // execute`${docker()} bash -c "rm -rf /src/${node_modules_dir_rust}"`;
                throw new Error("Not implemented");
            } else {
                execute`rm -rf ${node_modules_dir_rust}`;
            }
        }

        mkdirp.sync(node_modules_dir_rust);
    }

    // Build the rust binary using wasm-pack, which generates WebAssembly
    // compatible binaries and the intermediate binding as well.
    const cmd = bash`wasm-pack build ${process.env.PSP_DEBUG ? " --debug" : ""}`;

    // Copy it to `node_modules` using `yarn` so that our packages can import
    const copy_cmd = bash`ls . && cp -rv . ${node_modules_dir_rust}`;

    console.log(`-- Copying ${package_name} from ${base_dir}/pkg to ${node_modules_dir_rust}`);

    if (process.env.PSP_DOCKER) {
        throw new Error("Not implemented");
        // execute`${docker()} bash -c "cd /src/${base_dir} && ${cmd} && cd src/${base_dir}/pkg && ${copy ? copy_cmd : ""}"`;
    } else {
        execute`cd ${base_dir} && ${cmd}`;
        if (copy) {
            execute`cd ${base_dir}/pkg && ${copy_cmd}`;
        }
    }

    if (copy) {
        console.log(`-- Add ${package_name} to package.json and run "yarn" to use.`);
    }
};

try {
    compileRustWASM("arrow_accessor", false);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
