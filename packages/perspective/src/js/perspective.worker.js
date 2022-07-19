/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import load_perspective from "@finos/perspective/dist/pkg/esm/perspective.cpp.js";
import perspective from "./perspective.js";

let _perspective_instance;

if (globalThis.document !== undefined && typeof WebAssembly !== "undefined") {
    _perspective_instance = globalThis.perspective = perspective(
        load_perspective({
            wasmJSMethod: "native-wasm",
            printErr: (x) => console.error(x),
            print: (x) => console.log(x),
        })
    );
} else {
    _perspective_instance = globalThis.perspective =
        perspective(load_perspective);
}

export default _perspective_instance;
