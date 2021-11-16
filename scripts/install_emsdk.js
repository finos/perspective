/*******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

require("dotenv").config({path: "./.perspectiverc"});

const {execute_throw} = require("./script_utils.js");
const {emscripten} = require("../package.json");
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

function upgrade() {
    console.log(`-- Emscripten not found, installing ${emscripten}`);
    emsdk_checkout();
    emsdk("install", emscripten);
    emsdk("activate", emscripten);
    console.log(`-- Emscripten ${emscripten} installed`);
}

function check() {
    try {
        const emsdkdir = path.join(__dirname, "..", ".emsdk");
        execute_throw`. ${emsdkdir}/emsdk_env.sh && emcc --version`;
        return true;
    } catch (e) {
        return fs.existsSync(path.join(__dirname, "..", ".emsdk"));
    }
}

if (!check()) {
    upgrade();
}
