/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const path = require("path");
const {execute} = require("./script_utils.js");

const testRustWASM = package_name => {
    console.log(`-- Running tests for ${package_name}`);
    const base_dir = path.join(__dirname, "..", "rust", "perspective", package_name);

    if (process.env.PSP_DOCKER) {
        throw new Error("Not implemented!");
    } else {
        execute`cd ${base_dir} && wasm-pack test --node`;
    }
};

try {
    testRustWASM("arrow_accessor");
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
