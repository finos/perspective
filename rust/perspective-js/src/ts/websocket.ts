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

import type * as perspective_client from "../../dist/wasm/perspective-js.js";

function invert_promise<T>(): [(t: T) => void, Promise<T>, (t: any) => void] {
    let sender: ((t: T) => void) | undefined = undefined,
        reject: ((t: any) => void) | undefined = undefined;
    let receiver: Promise<T> = new Promise((x, u) => {
        sender = x;
        reject = u;
    });

    return [sender!, receiver, reject!];
}

/**
 * Create a new client connected via WebSocket to a server implemnting the
 * Perspective Protocol.
 * @param module
 * @param url
 * @returns
 */
export async function websocket(
    WebSocket: typeof window.WebSocket,
    Client: typeof perspective_client.Client,
    url: string | URL
): Promise<perspective_client.Client> {
    let client: perspective_client.Client, ws: WebSocket;

    async function connect() {
        if (
            ws?.readyState === WebSocket.CONNECTING ||
            ws?.readyState === WebSocket.OPEN
        ) {
            console.warn(`Already connected ${ws.readyState}`);
            return;
        }

        let [sender, receiver, reject] = invert_promise();
        ws = new WebSocket(url);
        ws.onopen = sender;
        ws.binaryType = "arraybuffer";
        ws.onerror = (event) => {
            // @ts-expect-error
            const msg = event.message || "Generic Websocket Error";
            client.handle_error(msg, connect);
            reject(msg);
        };

        ws.onclose = (event) => {
            // https://www.rfc-editor.org/rfc/rfc6455#section-7.4.1
            const msg = `WebSocket closed ${event.code}`;
            client.handle_error(msg, connect);
            reject(msg);
        };

        ws.onmessage = (event) => {
            client.handle_response(event.data);
        };

        await receiver;
    }

    async function send_message(proto: Uint8Array) {
        if (
            ws.readyState === WebSocket.CLOSING ||
            ws.readyState === WebSocket.CLOSED
        ) {
            const msg = `WebSocket transport error (${ws.readyState})`;
            client.handle_error(msg, connect);
            throw new Error(msg);
        } else if (ws.readyState === WebSocket.CONNECTING) {
            const msg = `WebSocket message dropped (${ws.readyState})`;
            throw new Error(msg);
        } else {
            const buffer = proto.slice().buffer;
            ws.send(buffer);
        }
    }

    async function on_close() {
        console.debug("Closing WebSocket");
        ws.close();
    }

    client = new Client(send_message, on_close);
    await connect();
    await client.init();
    return client;
}
