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

import { EmscriptenApi, EmscriptenServer } from "./emscripten_api.ts";

export type ApiResponse = {
    client_id: number;
    data: Uint8Array;
};

export class PerspectiveServer {
    clients: Map<number, (buffer: Uint8Array) => Promise<void>>;
    id_gen: number;
    server: EmscriptenServer;
    module: EmscriptenApi;
    constructor(module: EmscriptenApi) {
        this.clients = new Map();
        this.id_gen = 0;
        this.module = module;
        this.server = module._js_new_server();
    }

    /**
     * Helper function to create server emitter/receiver pairs
     */
    make_session(
        callback: (buffer: Uint8Array) => Promise<void>
    ): PerspectiveSession {
        const client_id = this.id_gen++;
        this.clients.set(client_id, callback);
        return new PerspectiveSession(
            this.module,
            this.server,
            client_id,
            this.clients
        );
    }
}

export class PerspectiveSession {
    constructor(
        private mod: EmscriptenApi,
        private server: EmscriptenServer,
        private client_id: number,
        private client_map: Map<number, (buffer: Uint8Array) => void>
    ) {}

    async handle_request(view: Uint8Array) {
        const ptr = await convert_typed_array_to_pointer(
            this.mod,
            view,
            async (viewPtr) => {
                return this.mod._js_handle_request(
                    this.server,
                    this.client_id,
                    viewPtr,
                    view.byteLength
                );
            }
        );

        decode_api_responses(this.mod, ptr, async (msg: ApiResponse) => {
            await this.client_map.get(msg.client_id)!(msg.data);
        });
    }

    poll() {
        const polled = this.mod._js_poll(this.server);
        decode_api_responses(this.mod, polled, async (msg: ApiResponse) => {
            await this.client_map.get(msg.client_id)!(msg.data);
        });
    }

    delete() {
        this.mod._js_delete_server(this.server);
    }
}

async function convert_typed_array_to_pointer(
    core: EmscriptenApi,
    array: Uint8Array,
    callback: (_: number) => Promise<number>
): Promise<number> {
    const ptr = core._js_alloc(array.byteLength);
    core.HEAPU8.set(array, ptr);
    const msg = await callback(ptr);
    core._js_free(ptr);
    return msg;
}

function convert_pointer_to_u32_array(core: EmscriptenApi, ptr: number) {
    const len = core.HEAPU32[ptr >>> 2];
    return new Uint32Array(core.HEAPU8.buffer, ptr + 4, len * 3);
}

/**
 * Convert a pointer to WASM memory into an `ApiResponse[]`, via a custom
 * encoding.
 *
 * @param core The emscripten API
 * @param ptr A pointer to a fixed-sized struct representing a set of
 * `proto::Resp` payloads, encoded as a length-prefixed array of
 * (char* data, size_t len, size_t client_id) tuples:
 *
 * ```text
 *   N   data    length   client_id   data    length   client_id
 * +-------------------------------------------------------------+
 * | 2 | 0xabc | 9      | 0         | 0xdef | 12     | 0         |
 * +-------------------------------------------------------------+
 *       |                           |
 *       |  +-------------+          |  +----------------+
 *       +--| "Test Data" |          +--| "Hello, World" |
 *          +-------------+             +----------------+
 * ```
 *
 * @param callback A callback to which is passed the responses. THe responses
 * must be fully processed or copied before the callback returns, as it
 * references memory on the wasm stack.
 */
async function decode_api_responses(
    core: EmscriptenApi,
    ptr: number,
    callback: (_: ApiResponse) => Promise<void>
) {
    const responses = convert_pointer_to_u32_array(core, ptr);
    for (let i = 0; i < responses.length / 3; i++) {
        const data_ptr = responses[i * 3];
        const length = responses[i * 3 + 1];
        const client_id = responses[i * 3 + 2];
        const data = new Uint8Array(core.HEAPU8.buffer, data_ptr, length);
        const resp = { client_id, data };
        await callback(resp);
        core._js_free(data_ptr);
    }

    core._js_free(ptr);
}
