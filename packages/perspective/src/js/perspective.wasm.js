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
	module.exports = perspective(load_perspective({
		wasmJSMethod: "native-wasm",
		locateFile: path => `wasm_async/${path}`,
		filePackagePrefixURL: "",
		printErr: (x) => console.error(x),
		print: (x) => console.warn(x)
	}));
} else {
	module.exports = perspective(load_perspective);
}




