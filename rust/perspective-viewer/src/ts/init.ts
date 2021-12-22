/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {Decompress} from "fflate";

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

function is_gzip(buffer) {
    return new Uint32Array(buffer.slice(0, 4))[0] == 559903;
}

async function load_wasm() {
    // Perform a silly dance to deal with the different ways webpack and esbuild
    // load binary
    const compressed = (await wasm) as unknown;

    let parts = [];
    let length = 0;
    const decompressor = new Decompress((chunk) => {
        if (chunk) {
            length += chunk.byteLength;
            parts.push(chunk);
        }
    });

    if (compressed instanceof URL || typeof compressed === "string") {
        const resp = await fetch(compressed.toString());
        const reader = resp.body.getReader();
        let state = 0;
        while (true) {
            const {value, done} = await reader.read();
            if (done) break;
            if ((state === 0 && is_gzip(value.buffer)) || state === 1) {
                state = 1;
                decompressor.push(value, done);
            } else {
                state = 2;
                length += value.byteLength;
                parts.push(value);
            }
        }
    } else if (compressed instanceof Uint8Array) {
        if (is_gzip(compressed.buffer)) {
            decompressor.push(compressed, true);
        } else {
            length = compressed.byteLength;
            parts = [compressed];
        }
    } else {
        const array = new Uint8Array(compressed as ArrayBuffer);
        if (is_gzip(compressed)) {
            decompressor.push(array, true);
        } else {
            length = array.byteLength;
            parts = [array];
        }
    }

    let offset = 0;
    const buffer = new Uint8Array(length);
    for (const part of parts) {
        buffer.set(part, offset);
        offset += part.byteLength;
    }

    return await init_wasm(buffer);
}

export const WASM_MODULE = load_wasm();
