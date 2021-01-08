/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const path = require("path");
const {execute_throw, getarg} = require("./script_utils.js");

const IS_FIX = getarg("--fix");

const lintRustWASM = package_name => {
    console.log(`-- ${IS_FIX ? "Linting" : "Formatting"} ${package_name}`);
    const base_dir = path.join(__dirname, "..", "rust", "perspective", package_name);
    execute_throw`cd ${base_dir} && cargo fmt ${IS_FIX ? "" : "-- --check"}`;
};

try {
    lintRustWASM("arrow_accessor");
} catch (e) {
    console.log(e);
    process.exit(1);
}
