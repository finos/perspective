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
import perspective_client_wasm from "../../dist/pkg/perspective-js.wasm";

// @ts-ignore
import perspective_server_wasm from "../../dist/pkg/web/perspective-server.wasm";

export type * from "../../dist/pkg/perspective-js.d.ts";
export { PerspectiveServer } from "./engine.js";

import * as perspective_client from "../../dist/pkg/perspective-js.js";
import { load_wasm_stage_0 } from "./decompress.js";
import WebSocket, { WebSocketServer as HttpWebSocketServer } from "ws";
import stoppable from "stoppable";
import { promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import type * as net from "node:net";
import type { TableInitOptions } from "./ts-rs/TableInitOptions.js";
import { PerspectiveServer } from "./engine.js";
import { compile_perspective } from "./emscripten_api.js";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as Crypto;
}

const uncompressed_client_wasm = await load_wasm_stage_0(
    perspective_client_wasm as unknown as ArrayBuffer | Response
);

await perspective_client.default(uncompressed_client_wasm);
perspective_client.init();

const SYNC_MODULE = await compile_perspective(perspective_server_wasm);
let SYNC_CLIENT: perspective_client.Client;
const SYNC_SERVER = new PerspectiveServer(SYNC_MODULE);
const SYNC_SESSION = SYNC_SERVER.make_session(
    async (resp) => await SYNC_CLIENT.handle_response(resp)
);

SYNC_CLIENT = new perspective_client.Client(async (req: Uint8Array) => {
    await SYNC_SESSION.handle_request(req);
    setTimeout(() => SYNC_SESSION.poll());
});

await SYNC_CLIENT.init();

export function make_server() {
    return new PerspectiveServer(SYNC_MODULE);
}

export const make_session = async (
    send_response: (buffer: Uint8Array) => Promise<void>
) => SYNC_SERVER.make_session(send_response);

// Helper function to create client emitter/receiver pairs
export function make_client(
    send_request: (buffer: Uint8Array) => void,
    close?: Function
) {
    return new perspective_client.Client(send_request, close);
}

const CONTENT_TYPES: Record<string, string> = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".arrow": "arraybuffer",
    ".feather": "arraybuffer",
    ".wasm": "application/wasm",
};

/**
 * Host a Perspective server that hosts data, code files, etc.
 * Strip version numbers from the URL so we can handle CDN-like requests
 * of the form @[^~]major.minor.patch when testing local versions of
 * Perspective against Voila.
 */
export async function cwd_static_file_handler(
    request: http.IncomingMessage,
    response: http.ServerResponse<http.IncomingMessage>,
    assets = ["./"]
) {
    let url =
        request.url
            ?.split(/[\?\#]/)[0]
            .replace(/@[\^~]?\d+.[\d\*]*.[\d\*]*/, "") || "/";

    if (url === "/") {
        url = "/index.html";
    }

    let extname = path.extname(url);
    let contentType = CONTENT_TYPES[extname] || "text/html";
    try {
        for (const root of assets) {
            let filePath = root + url;
            try {
                let content = await fs.readFile(filePath);
                if (typeof content !== "undefined") {
                    console.log(`200 ${url}`);
                    response.writeHead(200, { "Content-Type": contentType });
                    if (extname === ".arrow" || extname === ".feather") {
                        response.end(content, "utf-8");
                    } else {
                        response.end(content);
                    }

                    return;
                }
            } catch (e) {}
        }

        console.error(`404 ${url}`);
        response.writeHead(404);
        response.end("", "utf-8");
    } catch (error) {
        console.error(`500 ${url} ${error}`);
        response.writeHead(500);
        response.end("", "utf-8");
    }
}

function buffer_to_arraybuffer(
    buffer: string | Buffer | ArrayBuffer | Buffer[]
): Uint8Array {
    if (typeof buffer === "string") {
        throw new Error("Unknown websocket message: " + buffer);
    } else if (buffer instanceof ArrayBuffer) {
        return new Uint8Array(buffer);
    } else if (buffer instanceof Array) {
        throw new Error("Unknown websocket message: " + buffer);
    } else {
        return new Uint8Array(
            buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.length
            )
        );
    }
}

function invert_promise<T>(): [(t: T) => void, Promise<T>] {
    let sender: ((t: T) => void) | undefined = undefined;
    let receiver: Promise<T> = new Promise((x) => {
        sender = x;
    });

    return [sender!, receiver];
}

export class WebSocketServer {
    _server: http.Server | any; // stoppable has no type ...
    _wss: HttpWebSocketServer;
    constructor({ port = 8080, assets = ["./"], server = undefined } = {}) {
        const perspective_server =
            typeof server === "undefined" ? SYNC_SERVER : server;

        port = typeof port === "undefined" ? 8080 : port;
        this._server = stoppable(
            http.createServer((x, y) => cwd_static_file_handler(x, y, assets))
        );

        this._wss = new HttpWebSocketServer({
            noServer: true,
            perMessageDeflate: true,
        });

        this._wss.on("connection", (ws) => {
            console.log("... Connecting websocket");
            const session = perspective_server.make_session(
                async (proto: Uint8Array) => {
                    ws.send(buffer_to_arraybuffer(proto));
                }
            );

            ws.on("message", (proto) => {
                session.handle_request(buffer_to_arraybuffer(proto));
                setTimeout(() => session.poll());
            });

            ws.on("close", () => {
                session.close();
            });
        });

        this._server.on(
            "upgrade",
            (
                request: http.IncomingMessage,
                socket: net.Socket,
                head: Buffer
            ) => {
                console.log("200 Websocket upgrade");
                this._wss.handleUpgrade(
                    request,
                    socket as net.Socket,
                    head,
                    (sock) => this._wss.emit("connection", sock, request)
                );
            }
        );

        this._server.listen(port, () => {
            console.log(`Listening on ${this._server.address().port}`);
        });
    }

    async close() {
        await new Promise((x) => this._server.stop(x));
    }
}

export function get_hosted_table_names() {
    return SYNC_CLIENT.get_hosted_table_names();
}

export function system_info() {
    return SYNC_CLIENT.system_info();
}

/**
 * Create a table from the global Perspective instance.
 * @param init_data
 * @param options
 * @returns
 */
export function table(
    init_data:
        | string
        | ArrayBuffer
        | Record<string, any>
        | Record<string, unknown>[],
    options?: TableInitOptions
) {
    return SYNC_CLIENT.table(init_data, options);
}

/**
 * Create a new client connected via WebSocket to a server implemnting the
 * Perspective Protocol.
 * @param module
 * @param url
 * @returns
 */
export async function websocket(
    url: string
): Promise<perspective_client.Client> {
    const ws = new WebSocket(url);
    let [sender, receiver] = invert_promise();
    ws.onopen = sender;
    ws.binaryType = "arraybuffer";
    await receiver;
    const client = make_client(
        (proto) => {
            ws.send(proto.slice().buffer);
        },
        () => {
            console.log("Closing websocket");
            ws.close();
        }
    );

    ws.onmessage = (msg) => {
        client.handle_response(msg.data);
    };

    await client.init();
    return client;
}

export default {
    table,
    websocket,
    get_hosted_table_names,
    system_info,
    WebSocketServer,
};
