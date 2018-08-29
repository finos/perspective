/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const load_perspective = require("../../build/asmjs/psp.js").load_perspective;
const perspective = require('./perspective.js');

if (global.document !== undefined) {
	const Module = load_perspective({
		wasmJSMethod: "asmjs",
        filePackagePrefixURL: "",
	    printErr: (x) => console.error(x),
	    print: (x) => console.warn(x)
	});
	module.exports = perspective(Module);
} else {
	module.exports = perspective(load_perspective);
}

