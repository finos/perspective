/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

require("babel-polyfill");

const load_perspective = require("../../obj/psp.asmjs.js").load_perspective;
const perspective = require("./perspective.js").default;

const Module = load_perspective({
    wasmJSMethod: "asmjs",
    printErr: x => console.error(x),
    print: x => console.log(x)
});

module.exports = global.perspective = perspective(Module);
