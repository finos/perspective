/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {load_perspective} from "../../obj/psp.async.js";
import wasm_path from "./psp.async.wasm.js";
import perspective from "./perspective.js";

if (global.document !== undefined && typeof WebAssembly !== "undefined") {
    module.exports = global.perspective = perspective(
        load_perspective({
            wasmJSMethod: "native-wasm",
            printErr(message) {
                console.error(message);
            },
            print(message) {
                console.log(message);
            },
            locateFile(path) {
                if (path.endsWith(".wasm")) {
                    return wasm_path;
                }
                return path;
            }
        })
    );
} else {
    module.exports = global.perspective = perspective(load_perspective);
}
