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

import { PerspectiveSession, PerspectiveServer } from "./wasm/engine.ts";
import { compile_perspective } from "./wasm/emscripten_api.ts";

let server: PerspectiveServer;
let session: PerspectiveSession;

let PING_PONG_BUFFER: ArrayBuffer | undefined = undefined;

self.addEventListener("message", async (msg) => {
    if (msg.data.cmd === "init") {
        const id = msg.data.id;
        const module = await compile_perspective(msg.data.args[0]);
        server = new PerspectiveServer(module);
        session = server.make_session(async (resp) => {
            if (typeof PING_PONG_BUFFER === "undefined") {
                PING_PONG_BUFFER = new ArrayBuffer(resp.byteLength + 4);
            } else if (PING_PONG_BUFFER.byteLength < resp.byteLength + 4) {
                if (PING_PONG_BUFFER.resizable) {
                    PING_PONG_BUFFER.resize(resp.byteLength + 4);
                } else {
                    PING_PONG_BUFFER = new ArrayBuffer(resp.byteLength + 4);
                }
            }

            // new Uint32Array(PING_PONG_BUFFER)[0] = resp.byteLength;
            const view = new DataView(PING_PONG_BUFFER, 0);
            view.setUint32(0, resp.byteLength, true);
            new Uint8Array(PING_PONG_BUFFER).set(resp, 4);
            // PING_PONG_BUFFER = resp.slice().buffer;
            // const f = resp.slice().buffer;

            self.postMessage(PING_PONG_BUFFER, {
                transfer: [PING_PONG_BUFFER],
            });
            PING_PONG_BUFFER = undefined;
        });
        self.postMessage({ id });
    } else {
        PING_PONG_BUFFER = msg.data as ArrayBuffer;
        const view = new DataView(PING_PONG_BUFFER, 0);
        const len = view.getUint32(0, true);
        const slice = new Uint8Array(PING_PONG_BUFFER, 4, len);
        session.handle_request(slice);
        setTimeout(() => session.poll());
    }
});
