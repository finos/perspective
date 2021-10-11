/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import init, * as internal from "../../dist/pkg/perspective_viewer.js";

// There is no way to provide a default rejection handler within a promise and
// also not lock the await-er, so this module attaches a global handler to
// filter out cancelled query messages.
window.addEventListener("unhandledrejection", (event) => {
    if (event.reason?.message === "View method cancelled") {
        event.preventDefault();
    }
});

async function init_wasm({default: wasm_module}): Promise<typeof internal> {
    await init(wasm_module);
    return internal;
}

export const WASM_MODULE = import(
    /* webpackChunkName: "perspective-viewer.custom-element" */
    /* webpackMode: "eager" */
    "../../dist/pkg/perspective_viewer_bg.wasm"
).then(init_wasm);
