// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

// import init_wasm, * as wasm_module from "../../dist/pkg/perspective_bootstrap.js";
import * as wasm_module from "../../dist/pkg/perspective.js";

import wasm from "../../dist/pkg/perspective_bg.wasm";

// There is no way to provide a default rejection handler within a promise and
// also not lock the await-er, so this module attaches a global handler to
// filter out cancelled query messages.
window.addEventListener("unhandledrejection", (event) => {
    if (event.reason?.message === "View method cancelled") {
        event.preventDefault();
    }
});

type Module = {
    size(): number;
    offset(): number;
    memory: WebAssembly.Memory;
};

// Perform a silly dance to deal with the different ways webpack and esbuild
// load binary, as this may either be an `ArrayBuffer` or `URL` depening
// on whether `inline` option was specified to `perspective-esbuild-plugin`.
async function compile(buff_or_url) {
    if (buff_or_url instanceof URL || typeof buff_or_url == "string") {
        return await WebAssembly.instantiateStreaming(fetch(buff_or_url));
    } else {
        return await WebAssembly.instantiate(buff_or_url);
    }
}

async function load_wasm() {
    const buff_or_url = await wasm;
    const mod = await compile(buff_or_url);
    const exports = mod.instance.exports as Module;
    const size = exports.size();
    const offset = exports.offset();
    const array = new Uint8Array(exports.memory.buffer);
    const uncompressed_wasm = array.slice(offset, offset + size);
    await wasm_module.default(uncompressed_wasm);
    wasm_module.defineWebComponents();
    return wasm_module;
}

export const WASM_MODULE = load_wasm();
