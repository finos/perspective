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
import perspective_server_wasm from "../../dist/pkg/node/perspective-server.wasm";

// @ts-ignore
import perspective_client_wasm from "../../dist/pkg/perspective-js.wasm";

import perspective_server from "../../dist/pkg/node/perspective-server.js";
import * as perspective_client from "../../dist/pkg/perspective-js.js";
import { load_wasm_stage_0 } from "./decompress.js";
import WebSocket from "ws";
import fs from "fs";
import stoppable from "stoppable";
import http from "http";
import path from "path";
import url from "node:url";
import { webcrypto } from "node:crypto";

import type * as net from "node:net";
import type { TableInitOptions } from "./ts-rs/TableInitOptions.js";

export type * from "../../dist/pkg/perspective-js.d.ts";

if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as Crypto;
}

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProtoServer {
    handle_message(
        client_id: number,
        req: Uint8Array,
        callback: (client_id: number, resp: Uint8Array) => void
    ): void;

    poll(callback: (client_id: number, resp: Uint8Array) => void): void;
}

type PerspectiveModule = {
    init(): void;
    ProtoServer: { new (): ProtoServer };
};

declare module "../../dist/pkg/node/perspective-server.js" {
    export default function __init(options: any): PerspectiveModule;
}

const wasmBinary = await load_wasm_stage_0(perspective_server_wasm);
const core = await perspective_server({ wasmBinary });
await core.init();

const uncompressed_client_wasm = await load_wasm_stage_0(
    perspective_client_wasm as unknown as ArrayBuffer | Response
);

await perspective_client.default(uncompressed_client_wasm);
await perspective_client.init();

// Helper function to create client emitter/receiver pairs
export function make_client(
    callback: (buffer: Uint8Array) => void,
    close?: Function
) {
    return new perspective_client.JsClient(callback, close);
}

function invert_promise<T>(): [(t: T) => void, Promise<T>] {
    let sender: ((t: T) => void) | undefined = undefined;
    let receiver: Promise<T> = new Promise((x) => {
        sender = x;
    });

    return [sender!, receiver];
}

const PROTO_SERVER = new core.ProtoServer();
const CLIENTS: Map<number, (buffer: Uint8Array) => void> = new Map();
const ID_GEN = { id: 0 };

interface PerspectiveServer {
    handle_message(buffer: Uint8Array): void;
}

// Helper function to create server emitter/receiver pairs
export function make_server(
    callback: (buffer: Uint8Array) => void
): PerspectiveServer {
    const client_id = ID_GEN.id++;
    CLIENTS.set(client_id, callback);
    return {
        handle_message(req: Uint8Array) {
            PROTO_SERVER.handle_message(
                client_id,
                req,
                (client_id: number, resp: Uint8Array) => {
                    CLIENTS.get(client_id)!(resp);
                }
            );

            setTimeout(() =>
                PROTO_SERVER.poll((client_id: number, resp: Uint8Array) => {
                    CLIENTS.get(client_id)!(resp);
                })
            );
        },
    };
}

const LOCAL_PATH = path.join(process.cwd(), "node_modules");

const DEFAULT_ASSETS = [
    "@finos/perspective-test",
    "@finos/perspective/dist/cdn",
    "@finos/perspective-workspace/dist/cdn",
    "@finos/perspective-workspace/dist/css",
    "@finos/perspective-viewer/dist/cdn",
    "@finos/perspective-viewer/dist/css",
    "@finos/perspective-viewer-openlayers/dist/cdn",
    "@finos/perspective-viewer-datagrid/dist/cdn",
    "@finos/perspective-viewer-d3fc/dist/cdn",
    "@finos/perspective-jupyterlab/dist/cdn",
];

const CONTENT_TYPES: Record<string, string> = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".arrow": "arraybuffer",
    ".feather": "arraybuffer",
    ".wasm": "application/wasm",
};

function read_promise(filePath: string) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, function (error, content) {
            if (error && error.code !== "ENOENT") {
                reject(error);
            } else {
                resolve(content);
            }
        });
    });
}

/**
 * Host a Perspective server that hosts data, code files, etc.
 * Strip version numbers from the URL so we can handle CDN-like requests
 * of the form @[^~]major.minor.patch when testing local versions of
 * Perspective against Voila.
 */
export async function cwd_static_file_handler(
    request: http.IncomingMessage,
    response: http.ServerResponse<http.IncomingMessage>,
    assets = ["./"],
    hostPsp = false
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
            let content = await read_promise(filePath);
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
        }

        if (hostPsp) {
            for (let rootDir of DEFAULT_ASSETS) {
                try {
                    let filePath;
                    if (url.startsWith("/" + rootDir)) {
                        filePath = require.resolve(url.slice(1));
                    } else {
                        let paths = require.resolve.paths(rootDir + url);
                        paths = [
                            ...(paths || []),
                            ...assets.map((x) => path.join(x, "node_modules")),
                            LOCAL_PATH,
                        ];
                        filePath = require.resolve(rootDir + url, {
                            paths,
                        });
                    }
                    let content = await read_promise(filePath);
                    if (typeof content !== "undefined") {
                        console.log(`200 ${url}`);
                        response.writeHead(200, {
                            "Content-Type": contentType,
                        });

                        if (extname === ".arrow" || extname === ".feather") {
                            response.end(content, "utf-8");
                        } else {
                            response.end(content);
                        }

                        return;
                    }
                } catch (e) {
                    // console.log(e);
                }
            }
        }

        console.error(`404 ${url}`);
        response.writeHead(404);
        response.end("", "utf-8");
    } catch (error) {
        console.error(`500 ${url}`);
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

export class WebSocketServer {
    _server: http.Server | any; // stoppable has no type ...
    _wss: WebSocket.Server;
    constructor({ port = 8080, assets = ["./"], hostPsp = false } = {}) {
        port = typeof port === "undefined" ? 8080 : port;
        this._server = stoppable(
            http.createServer((x, y) =>
                cwd_static_file_handler(x, y, assets, hostPsp)
            )
        );

        this._wss = new WebSocket.Server({
            noServer: true,
            perMessageDeflate: true,
        });

        this._wss.on("connection", (ws) => {
            console.log("... Connecting websocket");
            const server = make_server((proto: Uint8Array) => {
                ws.send(buffer_to_arraybuffer(proto));
            });

            ws.on("message", (proto) =>
                server.handle_message(buffer_to_arraybuffer(proto))
            );
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

// The sync client/server, e.g. the global Perspective instance in Node.
let SYNC_CLIENT: perspective_client.JsClient;
let SYNC_SERVER;

SYNC_SERVER = make_server((resp) => {
    SYNC_CLIENT.handle_message(resp);
});

SYNC_CLIENT = make_client((req) => {
    SYNC_SERVER.handle_message(req);
});

await SYNC_CLIENT.init();

export function get_hosted_table_names() {
    return SYNC_CLIENT.get_hosted_table_names();
}

export function system_info() {
    return SYNC_CLIENT.system_info();
}

/**
 * Create a table from the synchronous global Perspective instance.
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
): Promise<perspective_client.JsClient> {
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
        client.handle_message(msg.data);
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
