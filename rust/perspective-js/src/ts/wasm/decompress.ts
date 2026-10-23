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

type ModType = {
    resize: (x: number) => number;
    memory: WebAssembly.Memory;
    compile: (x: number, y: number) => number;
};

export async function extract(input: any) {
    let bin: WebAssembly.WebAssemblyInstantiatedSource;
    if (input instanceof Response) {
        bin = await WebAssembly.instantiateStreaming(input);
    } else if (typeof input === "string") {
        bin = await WebAssembly.instantiateStreaming(fetch(input));
    } else if (input instanceof ArrayBuffer) {
        bin = await WebAssembly.instantiate(input);
    } else {
        bin = input;
    }

    const inst = bin.instance.exports as ModType;
    const [payload] = WebAssembly.Module.customSections(
        bin.module,
        "psp-runtime",
    );

    const [raw_length_view] = WebAssembly.Module.customSections(
        bin.module,
        "psp-len",
    );

    const raw_length = new DataView(raw_length_view).getUint32(0, true);
    const ptr = inst.resize(payload.byteLength);
    new Uint8Array(inst.memory.buffer).set(new Uint8Array(payload), ptr);
    const offset = inst.compile(payload.byteLength, raw_length);
    return new Uint8Array(inst.memory.buffer).slice(
        offset,
        raw_length + offset,
    );
}

if (typeof WebAssembly === "undefined") {
    throw new Error("WebAssembly not supported.");
}

interface Module extends WebAssembly.Exports {
    size(): number;
    offset(): number;
    memory: WebAssembly.Memory;
}

export async function load_wasm_stage_0(
    wasm:
        | ArrayBuffer
        | Response
        | WebAssembly.Module
        | (() => Promise<ArrayBuffer>),
): Promise<Uint8Array> {
    if (wasm instanceof Function) {
        wasm = await wasm();
    }

    if (wasm instanceof Promise) {
        wasm = await wasm;
    }

    try {
        return await extract(wasm as ArrayBuffer);
    } catch (e) {
        console.warn("Stage 0 wasm loading failed, skipping");
        return new Uint8Array(wasm as ArrayBuffer);
    }
}
