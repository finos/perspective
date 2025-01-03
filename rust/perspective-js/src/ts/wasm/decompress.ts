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

if (typeof WebAssembly === "undefined") {
    throw new Error("WebAssembly not supported.");
}

type Module = {
    size(): number;
    offset(): number;
    memory: WebAssembly.Memory;
};

// Perform a silly dance to deal with the different ways webpack and esbuild
// load binary, as this may either be an `ArrayBuffer` or `URL` depending
// on whether `inline` option was specified to `perspective-esbuild-plugin`.
async function compile(
    buffer: ArrayBuffer | Response
): Promise<WebAssembly.Instance> {
    if (buffer instanceof Response) {
        return (await WebAssembly.instantiateStreaming(buffer)).instance;
    } else {
        return (await WebAssembly.instantiate(buffer as BufferSource)).instance;
    }
}

export async function load_wasm_stage_0(
    wasm: ArrayBuffer | Response | (() => Promise<ArrayBuffer>)
): Promise<Uint8Array> {
    if (wasm instanceof Function) {
        wasm = await wasm();
    }

    const mod = await compile(wasm);
    try {
        const exports = mod.exports as Module;
        const size = exports.size();
        const offset = exports.offset();
        const array = new Uint8Array(exports.memory.buffer);
        return array.slice(offset, offset + size);
    } catch (e) {
        console.warn("Stage 0 wasm loading failed, skipping");
        return new Uint8Array(wasm as ArrayBuffer);
    }
}
