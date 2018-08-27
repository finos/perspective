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
const node_perspective = require("../../src/js/perspective.node.js");

const RUNTIMES = {
    ASMJS: perspective(load_asmjs({
        wasmJSMethod: "asmjs",
        locateFile: path => `build/asmjs/${path}`,
        filePackagePrefixURL: "asmjs/",
        asmjsCodeFile: "asmjs/psp.js",
        ENVIRONMENT: "NODE"
    })),
    NODE: node_perspective
}

if (typeof WebAssembly !== "undefined") {
    RUNTIMES["WASM"] = perspective(require("../../build/wasm_sync/psp.js"));
}

const constructor_tests = require("./constructors.js");
const pivot_tests = require("./pivots.js");
const update_tests = require("./updates.js");
const filter_tests = require("./filters.js");
const internal_tests = require('./internal.js');

describe("perspective.js", function() {

    Object.keys(RUNTIMES).forEach(function(mode) {

        (typeof WebAssembly === 'undefined' && mode === "WASM" ? xdescribe : describe)(mode, function() {
    
            constructor_tests(RUNTIMES[mode]);
            pivot_tests(RUNTIMES[mode]);
            update_tests(RUNTIMES[mode]);
            filter_tests(RUNTIMES[mode]);
            internal_tests(RUNTIMES[mode], mode);

        });

    });

});