/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute, clean, bash} = require("./script_utils.js");

const minimatch = require("minimatch");
const args = process.argv.slice(2);

const IS_SCREENSHOTS = args.indexOf("--screenshots") !== -1;

function clean_screenshots() {
    execute(bash`lerna exec -- mkdirp screenshots`);
    execute(bash`lerna run clean:screenshots --ignore-missing --scope=@finos/${process.env.PACKAGE}`);
}

try {
    if (process.env.PSP_PROJECT === "python") {
        clean("cpp/perspective/obj", "cpp/perspective/cppbuild", "python/perspective/build");
        return;
    }
    if (!IS_SCREENSHOTS && (!process.env.PACKAGE || minimatch("perspective", process.env.PACKAGE))) {
        clean("cpp/perspective/cppbuild");
        let files = ["CMakeFiles", "build", "cmake_install.cmake", "CMakeCache.txt", "compile_commands.json", "libpsp.a", "Makefile"];
        clean(...files.map(x => `cpp/perspective/obj/${x}`));
    }
    if (!process.env.PSP_PROJECT || args.indexOf("--deps") > -1) {
        clean("cpp/perspective/obj");
    }
    if (!IS_SCREENSHOTS) {
        execute(bash`lerna run clean --scope=@finos/${process.env.PACKAGE}`);
        clean("docs/build", "docs/python", "docs/obj");
    }
    clean_screenshots();
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
