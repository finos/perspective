/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require('../../src/js/perspective.js');
const load_asmjs = require("../../build/asmjs/psp.js").load_perspective;
const fs = require('fs');

const RUNTIMES = {
    ASMJS: perspective(load_asmjs({
        wasmJSMethod: "asmjs",
        memoryInitializerPrefixURL: 'build/asmjs/',
        asmjsCodeFile: "asmjs/psp.js",
        ENVIRONMENT: "NODE"
    })),
    WASM: {}
}

if (typeof WebAssembly !== "undefined") {
    const load_wasm = require("../../build/wasm_sync/psp.js").load_perspective;
    const wasm = fs.readFileSync('./build/wasm_sync/psp.wasm');
    RUNTIMES["WASM"] = perspective(load_wasm({
        wasmBinary: wasm,
        wasmJSMethod: 'native-wasm',
        ENVIRONMENT: "NODE"
    }));
}

const constructor_tests = require("./constructors.js");
const pivot_tests = require("./pivots.js");
const update_tests = require("./updates.js");
const filter_tests = require("./filters.js");

describe("perspective.js", function() {

    Object.keys(RUNTIMES).forEach(function(mode) {

        (typeof WebAssembly === 'undefined' && mode === "WASM" ? xdescribe : describe)(mode, function() {
    
            constructor_tests(RUNTIMES[mode]);
            pivot_tests(RUNTIMES[mode]);
            update_tests(RUNTIMES[mode]);
            filter_tests(RUNTIMES[mode]);

        });

    });

});