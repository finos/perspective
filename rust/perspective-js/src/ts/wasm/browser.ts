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

import type * as psp from "../../../dist/wasm/perspective-js.d.ts";

import * as psp_websocket from "../websocket.ts";

function invert_promise<T>(): [
    (t: T) => void,
    Promise<T>,
    (e: string) => void
] {
    let sender, reject;
    let receiver: Promise<T> = new Promise((x, y) => {
        sender = x;
        reject = y;
    });

    return [
        sender as unknown as (t: T) => void,
        receiver,
        reject as unknown as (e: string) => void,
    ];
}

async function _init(ws: MessagePort | Worker, wasm: WebAssembly.Module) {
    const [sender, receiver] = invert_promise();
    ws.addEventListener("message", function listener(resp) {
        ws.removeEventListener("message", listener);
        sender(null);
    });

    ws.onmessage = function listener(resp) {
        ws.onmessage = function () {};
        sender(null);
    };

    ws.onmessageerror = console.error;
    ws.postMessage(
        { cmd: "init", args: [wasm] },
        { transfer: wasm instanceof WebAssembly.Module ? [] : [wasm] }
    );

    await receiver;
}

/**
 * Create a new client connected exclusively to a new Web Worker instance of
 * the Perspective engine.
 * @param module
 * @returns
 */
export async function worker(
    module: Promise<typeof psp>,
    server_wasm: Promise<WebAssembly.Module>,
    perspective_wasm_worker: Promise<SharedWorker | ServiceWorker | Worker>
) {
    let [wasm, webworker]: [
        WebAssembly.Module,
        SharedWorker | ServiceWorker | Worker | MessagePort
    ] = await Promise.all([server_wasm, perspective_wasm_worker]);

    const { Client } = await module;
    let port: MessagePort;
    if (
        typeof SharedWorker !== "undefined" &&
        webworker instanceof SharedWorker
    ) {
        port = webworker.port;
    } else {
        webworker = webworker as ServiceWorker | Worker | MessagePort;
        const messageChannel = new MessageChannel();
        webworker.postMessage(null, [messageChannel.port2]);
        port = messageChannel.port1;
    }

    const client = new Client(
        async (proto: Uint8Array) => {
            const f = proto.slice().buffer;
            port.postMessage(f, { transfer: [f] });
        },
        async () => {
            console.debug("Closing WebWorker");
            port.close();
        }
    );

    await _init(port, wasm);
    port.addEventListener("message", (json: MessageEvent<Uint8Array>) => {
        client.handle_response(json.data);
    });

    await client.init();
    return client;
}

/**
 * Create a new client connected via WebSocket to a server implemnting the
 * Perspective Protocol.
 * @param module
 * @param url
 * @returns
 */
export async function websocket(
    module: Promise<typeof psp>,
    url: string | URL
) {
    const { Client } = await module;
    return await psp_websocket.websocket(WebSocket, Client, url);
}

export default { websocket, worker };
