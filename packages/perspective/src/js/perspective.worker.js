/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import load_perspective_txt from "@finos/perspective/pkg/esm/perspective.cpp.js";
import perspective_worker_txt from "@finos/perspective/pkg/esm/perspective.cpp.worker.js";
import perspective from "./perspective.js";

const psp_url = (() => {
    const blob = new Blob([load_perspective_txt], {type: "text/javascript"});
    return URL.createObjectURL(blob);
})();

const load_perspective = (async () => {
    return await import(psp_url);
})();

const worker_url = (() => {
    const worker_blob = new Blob([perspective_worker_txt], {
        type: "text/javascript",
    });
    return URL.createObjectURL(worker_blob);
})();

let _perspective_instance;
if (global.document !== undefined && typeof WebAssembly !== "undefined") {
    _perspective_instance = global.perspective = perspective(
        load_perspective({
            wasmJSMethod: "native-wasm",
            printErr: (x) => console.error(x),
            print: (x) => console.log(x),
        }),
        psp_url,
        worker_url
    );
} else {
    _perspective_instance = global.perspective = perspective(
        load_perspective,
        psp_url,
        worker_url
    );
}

export default _perspective_instance;
