/*******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

require("dotenv").config({path: "./.perspectiverc"});

const {execute, execute_throw} = require("./script_utils.js");
const {emscripten} = require("../package.json");

function upgrade() {
    console.log(`-- Emscripten not found, installing ${emscripten}`);
    execute`yarn emsdk-checkout`;
    execute`yarn emsdk install ${emscripten}`;
    execute`yarn emsdk activate ${emscripten}`;
    console.log(`-- Emscripten ${emscripten} installed`);
}

function check() {
    try {
        execute_throw`yarn emsdk-run command -v emcc`;
        return true;
    } catch (e) {
        return false;
    }
}

if (!check()) {
    upgrade();
}
