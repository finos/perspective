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

import {
    PerspectiveSession,
    PerspectiveServer,
    PerspectivePollThread,
} from "./wasm/engine.ts";
import { compile_perspective } from "./wasm/emscripten_api.ts";

let GLOBAL_SERVER: PerspectiveServer;
let POLL_THREAD: PerspectivePollThread;

function bindPort(e: MessageEvent) {
    const port = e.ports[0];
    let session: PerspectiveSession;
    port.addEventListener("message", async (msg) => {
        if (msg.data.cmd === "init") {
            const id = msg.data.id;
            if (!GLOBAL_SERVER) {
                const module = await compile_perspective(msg.data.args[0]);
                GLOBAL_SERVER = new PerspectiveServer(module, {
                    on_poll_request: () => POLL_THREAD.on_poll_request(),
                });

                POLL_THREAD = new PerspectivePollThread(GLOBAL_SERVER);
            }

            session = GLOBAL_SERVER.make_session(async (resp) => {
                const f = resp.slice().buffer;
                port.postMessage(f, { transfer: [f] });
            });

            port.postMessage({ id });
        } else {
            await session.handle_request(new Uint8Array(msg.data));
        }
    });

    port.start();
}

// @ts-expect-error wrong scope
self.addEventListener("connect", bindPort);
self.addEventListener("message", bindPort);
