/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective_wasm from "../../src/js/perspective.wasm.js";
import perspective_asmjs from "../../src/js/perspective.asmjs.js";
import psp_parallel from "../../src/js/perspective.parallel.js";

import "jasmine-core/lib/jasmine-core/jasmine.css";
import jasmineRequire from "jasmine-core/lib/jasmine-core/jasmine.js";

global.jasmineRequire = window.jasmineRequire = jasmineRequire;

require("jasmine-core/lib/jasmine-core/jasmine-html.js");
require("jasmine-core/lib/jasmine-core/boot.js");

window._onload = window.onload;
window.onload = undefined;

const constructor_tests = require("./constructors.js");
const pivot_tests = require("./pivots.js");
const update_tests = require("./updates.js");
const filter_tests = require("./filters.js");

const RUNTIMES = {
   'WASM': perspective_wasm,
   'ASMJS': perspective_asmjs,
   'Parallel': psp_parallel.worker()
}

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

jasmine.pp = function(obj) {
    if (Array.isArray(obj)) {
        return "[\n" + obj.map(function(x) { return "    " + JSON.stringify(x); }).join("\n") + "\n]";
    } else {
        return JSON.stringify(obj,undefined, 4);
    }
};

const start = window._onload;
let ran = 0;

window.addEventListener('perspective-ready', function () {
    ran++;
    if (ran === (typeof WebAssembly === 'undefined' ? 1 : 2)) {
        setTimeout(start, 500);
    }
})

