/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { execute_throw } = require("./script_utils.js");
const path = require("path");

try {
    const cwd = process.cwd();
    const cmd = process.argv.slice(2).join(" ");
    const emsdkdir = path.join(__dirname, "..", ".emsdk");
    const emversion = require(path.join(
        __dirname,
        "..",
        "package.json"
    )).emscripten;
    if (!emversion) {
        throw new Error("Emscripten version not specified in package.json");
    }
    execute_throw`cd ${emsdkdir} && . ./emsdk_env.sh >/dev/null 2>&1 && emsdk activate ${emversion} >/dev/null && cd ${cwd} && ${cmd}`;
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
