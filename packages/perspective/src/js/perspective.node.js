/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require('./perspective.js');

const fs = require('fs');

let Module;

if (typeof WebAssembly === "undefined") {
    const load_perspective = require("../../build/asmjs/psp.js").load_perspective;
    Module = load_perspective({
        wasmJSMethod: "asmjs",
        memoryInitializerPrefixURL: 'build/asmjs/',
        asmjsCodeFile: "asmjs/psp.js",
        ENVIRONMENT: "NODE"
    });
} else {
    const load_perspective = require("../../build/wasm_sync/psp.js").load_perspective;
    const wasm = fs.readFileSync('./build/wasm_sync/psp.wasm');
    Module = load_perspective({
        wasmBinary: wasm,
        wasmJSMethod: 'native-wasm',
        ENVIRONMENT: "NODE"
    });    
}

module.exports = perspective(Module);
