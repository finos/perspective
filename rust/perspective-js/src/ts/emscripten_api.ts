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
import * as perspective_server from "../../dist/pkg/web/perspective-server.js";
import { load_wasm_stage_0 } from "./decompress.ts";

export type * from "../../dist/pkg/perspective-js.d.ts";

export interface EmscriptenServer {}
export interface EmscriptenApi {
    HEAP8: Int8Array;
    HEAPU8: Uint8Array;
    HEAP16: Int16Array;
    HEAPU16: Uint16Array;
    HEAP32: Int32Array;
    HEAPU32: Uint32Array;
    _psp_alloc(size: number): number;
    _psp_free(ptr: number): void;
    _psp_new_server(): EmscriptenServer;
    _psp_delete_server(server: EmscriptenServer): void;
    _psp_handle_request(
        server: EmscriptenServer,
        client_id: number,
        buffer_ptr: number,
        buffer_len: number
    ): number;
    _psp_poll(server: EmscriptenServer): number;
    _psp_new_session(server: EmscriptenServer): number;
    _psp_close_session(server: EmscriptenServer, client_id: number): void;
}

export async function compile_perspective(
    compressed_binary: ArrayBuffer
): Promise<EmscriptenApi> {
    const module = await perspective_server.default({
        locateFile(x: any) {
            return x;
        },
        instantiateWasm: async (
            imports: any,
            receive: (_: WebAssembly.Instance) => void
        ) => {
            const wasmBinary = await load_wasm_stage_0(compressed_binary);
            imports["env"] = {
                ...imports["env"],
                psp_stack_trace() {
                    const str = Error().stack || "";
                    const textEncoder = new TextEncoder();
                    const bytes = textEncoder.encode(str);
                    const ptr = module._psp_js_alloc(bytes.byteLength + 1);
                    module.HEAPU8.set(bytes, ptr);
                    module.HEAPU8[ptr + bytes.byteLength] = 0;
                    return ptr;
                },
                psp_heap_size() {
                    return module.HEAP8.buffer.byteLength;
                },
            };

            const webasm = await WebAssembly.instantiate(wasmBinary, imports);
            receive(webasm.instance);
            return webasm.instance.exports;
        },
    });

    return module;
}
