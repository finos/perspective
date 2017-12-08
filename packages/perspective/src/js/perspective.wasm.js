/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const load_perspective = require("../../build/wasm_async/psp.js").load_perspective;
const perspective = require('./perspective.js');

if (global.document !== undefined && typeof WebAssembly !== 'undefined') {
	var wasmXHR = new XMLHttpRequest();
	wasmXHR.open('GET', 'wasm_async/psp.wasm', true);
	wasmXHR.responseType = 'arraybuffer';
	wasmXHR.onload = function() {
	    let Module = {};
	    Module.wasmBinary = wasmXHR.response;
	    Module.wasmJSMethod = 'native-wasm';
	    Module = load_perspective(Module);
	    perspective(Module);
	};
	wasmXHR.send(null);
	module.exports = perspective({});
} else {
	module.exports = perspective(load_perspective);
}




