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

import { EmscriptenApi, EmscriptenServer, PspPtr } from "./emscripten_api.ts";

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
        this.server = module._psp_new_server();
    }

    /**
     * Helper function to create server emitter/receiver pairs
     */
    make_session(
        callback: (buffer: Uint8Array) => Promise<void>
    ): PerspectiveSession {
        const client_id = this.module._psp_new_session(this.server);
        this.clients.set(client_id, callback);
        return new PerspectiveSession(
            this.module,
            this.server,
            client_id,
            this.clients
        );
    }

    delete() {
        this.module._psp_delete_server(this.server);
    }
}

export class PerspectiveSession {
    constructor(
        private mod: EmscriptenApi,
        private server: EmscriptenServer,
        private client_id: number,
        private client_map: Map<number, (buffer: Uint8Array) => Promise<void>>
    ) {}

    async handle_request(view: Uint8Array) {
        const ptr = await convert_typed_array_to_pointer(
            this.mod,
            view,
            async (viewPtr) => {
                return this.mod._psp_handle_request(
                    this.server,
                    this.client_id,
                    viewPtr,
                    this.mod._psp_is_memory64()
                        ? BigInt(view.byteLength)
                        : view.byteLength
                );
            }
        );

        await decode_api_responses(this.mod, ptr, async (msg: ApiResponse) => {
            await this.client_map.get(msg.client_id)!(msg.data);
        });
    }

    poll() {
        const polled = this.mod._psp_poll(this.server);
        decode_api_responses(this.mod, polled, async (msg: ApiResponse) => {
            await this.client_map.get(msg.client_id)!(msg.data);
        });
    }

    close() {
        this.mod._psp_close_session(this.server, this.client_id);
    }
}

async function convert_typed_array_to_pointer(
    core: EmscriptenApi,
    array: Uint8Array,
    callback: (_: PspPtr) => Promise<PspPtr>
): Promise<PspPtr> {
    const ptr = core._psp_alloc(
        core._psp_is_memory64() ? BigInt(array.byteLength) : array.byteLength
    );

    core.HEAPU8.set(array, Number(ptr));
    const msg = await callback(ptr);
    core._psp_free(ptr);
    return msg;
}

/**
 * Convert a pointer to WASM memory into an `ApiResponse[]`, via a custom
 * encoding.
 *
 * @param core The emscripten API
 * @param ptr A pointer to a fixed-sized struct representing a set of
 * `proto::Resp` payloads, encoded as a length-prefixed array of
 * (char* data, u32_t len, u32_t client_id) tuples:
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
    ptr: PspPtr,
    callback: (_: ApiResponse) => Promise<void>
) {
    const is_64 = core._psp_is_memory64();
    const response = new DataView(
        core.HEAPU8.buffer,
        Number(ptr),
        is_64 ? 12 : 8
    );

    const num_msgs = response.getUint32(0, true);
    const msgs_ptr = is_64
        ? response.getBigInt64(4, true)
        : response.getUint32(4, true);

    const messages = new DataView(
        core.HEAPU8.buffer,
        Number(msgs_ptr),
        num_msgs * (is_64 ? 16 : 12)
    );

    try {
        for (let i = 0; i < num_msgs; i++) {
            const [data_ptr, data_len, client_id] = is_64
                ? [
                      messages.getBigInt64(i * 16, true),
                      messages.getInt32(i * 16 + 8, true),
                      messages.getInt32(i * 16 + 12, true),
                  ]
                : [
                      messages.getInt32(i * 12, true),
                      messages.getInt32(i * 12 + 4, true),
                      messages.getInt32(i * 12 + 8, true),
                  ];

            const data = new Uint8Array(
                core.HEAPU8.buffer,
                Number(data_ptr),
                data_len
            );

            const resp = { client_id, data };
            await callback(resp);
        }
    } finally {
        for (let i = 0; i < num_msgs; i++) {
            const data_ptr = is_64
                ? messages.getBigInt64(i * 16, true)
                : messages.getInt32(i * 12, true);

            core._psp_free(data_ptr);
        }

        core._psp_free(
            is_64 ? BigInt(messages.byteOffset) : messages.byteOffset
        );
        core._psp_free(
            is_64 ? BigInt(response.byteOffset) : response.byteOffset
        );
    }
}
