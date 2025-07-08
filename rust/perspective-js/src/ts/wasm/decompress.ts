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

// @ts-ignore
import { extract } from "pro_self_extracting_wasm";

if (typeof WebAssembly === "undefined") {
    throw new Error("WebAssembly not supported.");
}

interface Module extends WebAssembly.Exports {
    size(): number;
    offset(): number;
    memory: WebAssembly.Memory;
}

// Perform a silly dance to deal with the different ways webpack and esbuild
// load binary, as this may either be an `ArrayBuffer` or `URL` depending
// on whether `inline` option was specified to `perspective-esbuild-plugin`.
async function compile(
    buffer: ArrayBuffer | Response | WebAssembly.Module | WebAssembly.Exports
): Promise<Module> {
    if (buffer instanceof Response) {
        return (await WebAssembly.instantiateStreaming(buffer)).instance
            .exports as Module;
    } else if (buffer instanceof WebAssembly.Module) {
        return (await WebAssembly.instantiate(buffer)).exports as Module;
    } else if (buffer instanceof WebAssembly.Instance) {
        return buffer.exports as Module;
    } else if (buffer instanceof ArrayBuffer) {
        return (await WebAssembly.instantiate(buffer as BufferSource)).instance
            .exports as Module;
    } else {
        return buffer as Module;
    }
}

export async function load_wasm_stage_0(
    wasm:
        | ArrayBuffer
        | Response
        | WebAssembly.Module
        | (() => Promise<ArrayBuffer>)
): Promise<Uint8Array> {
    if (wasm instanceof Function) {
        wasm = await wasm();
    }

    try {
        return await extract(wasm as ArrayBuffer);
    } catch (e) {
        console.warn("Stage 0 wasm loading failed, skipping");
        return new Uint8Array(wasm as ArrayBuffer);
    }
}
