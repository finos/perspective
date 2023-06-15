/*******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

require("dotenv").config({ path: "./.perspectiverc" });

const { execute_throw } = require("./script_utils.js");
const { emscripten } = require("../package.json");
const path = require("path");
const os = require("os");
const fs = require("fs");

function base() {
    return path.join(__dirname, "..", ".emsdk");
}

function emsdk_checkout() {
    function git(args) {
        execute_throw`git ${args.join(" ")}`;
    }

    git(["clone", "https://github.com/emscripten-core/emsdk.git", base()]);
}

function emsdk(...args) {
    const basedir = base();
    const suffix = os.type() == "Windows_NT" ? ".bat" : "";
    const emsdk = path.join(basedir, "emsdk" + suffix);
    execute_throw`${emsdk} ${args.join(" ")}`;
}

function toolchain_install() {
    console.log(`-- Installing Emscripten ${emscripten}`);
    emsdk("install", emscripten);
    emsdk("activate", emscripten);
    console.log(`-- Emscripten ${emscripten} installed`);
}

function repo_check() {
    return fs.existsSync(path.join(base(), "emsdk_env.sh"));
}

if (!process.env.PSP_SKIP_EMSDK_INSTALL) {
    // if a stale toolchain is still activated in the shell, these vars break
    // emsdk install in a confusing way.  ensure they are unset
    for (let ev of ["EMSDK", "EMSDK_NODE", "EMSDK_PYTHON", "SSL_CERT_FILE"]) {
        delete process.env[ev];
    }
    if (!repo_check()) {
        emsdk_checkout();
    }
    toolchain_install();
}
