/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {decompressSync} from "fflate";

import init_wasm from "@finos/perspective-viewer/dist/pkg/perspective_viewer.js";
import wasm from "@finos/perspective-viewer/dist/pkg/perspective_viewer_bg.wasm";

// There is no way to provide a default rejection handler within a promise and
// also not lock the await-er, so this module attaches a global handler to
// filter out cancelled query messages.
window.addEventListener("unhandledrejection", (event) => {
    if (event.reason?.message === "View method cancelled") {
        event.preventDefault();
    }
});

async function load_wasm() {
    // Perform a silly dance to deal with the different ways webpack and esbuild
    // load binary
    const compressed = (await wasm) as unknown;

    let buffer;
    if (compressed instanceof URL || typeof compressed === "string") {
        const resp = await fetch(compressed.toString());
        buffer = await resp.arrayBuffer();
    } else if (compressed instanceof Uint8Array) {
        buffer = compressed.buffer;
    } else {
        buffer = compressed as ArrayBuffer;
    }

    // Unzip if needed
    if (new Uint32Array(buffer.slice(0, 4))[0] == 559903) {
        return await init_wasm(decompressSync(new Uint8Array(buffer)));
    } else {
        return await init_wasm(buffer);
    }
}

export const WASM_MODULE = load_wasm();
