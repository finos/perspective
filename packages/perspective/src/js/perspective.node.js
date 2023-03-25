/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { Client } = require("./api/client.js");
const { Server } = require("./api/server.js");
const { WebSocketManager } = require("./websocket/manager");
const { WebSocketClient } = require("./websocket/client");
const { get_config, get_type_config } = require("./config/index.js");
const stoppable = require("stoppable");

const perspective = require("./perspective.js").default;

const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");
const process = require("process");
const path = require("path");
const { Decompress } = require("fflate");

const load_perspective =
    require("../../dist/pkg/esm/perspective.cpp.js").default;

const LOCAL_PATH = path.join(process.cwd(), "node_modules");
const buffer = require("../../dist/pkg/esm/perspective.cpp.wasm").default;

function deflate(buffer) {
    let parts = [];
    let length = 0;
    const decompressor = new Decompress((chunk) => {
        if (chunk) {
            length += chunk.byteLength;
            parts.push(chunk);
        }
    });

    decompressor.push(buffer, true);
    let offset = 0;
    const buffer2 = new Uint8Array(length);
    for (const part of parts) {
        buffer2.set(part, offset);
        offset += part.byteLength;
    }

    return buffer2.buffer;
}
const SYNC_SERVER = new (class extends Server {
    init(msg) {
        buffer
            .then((buffer) => {
                return load_perspective({
                    wasmBinary: deflate(buffer),
                    wasmJSMethod: "native-wasm",
                });
            })
            .then((core) => {
                core.init();
                this.perspective = perspective(core);
                super.init(msg);
            });
    }

    post(msg) {
        SYNC_CLIENT._handle({ data: msg });
    }
})();

const SYNC_CLIENT = new (class extends Client {
    send(msg) {
        SYNC_SERVER.process(msg);
    }
})();

SYNC_CLIENT.send({ id: -1, cmd: "init" });

module.exports = SYNC_CLIENT;
module.exports.sync_module = () => SYNC_SERVER.perspective;

const DEFAULT_ASSETS = [
    "@finos/perspective/dist/cdn",
    "@finos/perspective-bench/dist",
    "@finos/perspective-workspace/dist/cdn",
    "@finos/perspective-workspace/dist/css",
    "@finos/perspective-viewer/dist/cdn",
    "@finos/perspective-viewer/dist/css",
    "@finos/perspective-viewer-openlayers/dist/cdn",
    "@finos/perspective-viewer-datagrid/dist/cdn",
    "@finos/perspective-viewer-d3fc/dist/cdn",
    "@finos/perspective-jupyterlab/dist/cdn",
];

const CONTENT_TYPES = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".arrow": "arraybuffer",
    ".wasm": "application/wasm",
};

function read_promise(filePath) {
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
 */
function perspective_assets(assets, host_psp) {
    return async function (request, response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Request-Method", "*");
        response.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
        response.setHeader("Access-Control-Allow-Headers", "*");

        let url = request.url.split(/[\?\#]/)[0];

        // Strip version numbers from the URL so we can handle CDN-like requests
        // of the form @[^~]major.minor.patch when testing local versions of
        // Perspective against Voila.
        url = url.replace(/@[\^~]?\d+.[\d\*]*.[\d\*]*/, "");

        if (url === "/") {
            url = "/index.html";
        }

        let extname = path.extname(url);
        let contentType = CONTENT_TYPES[extname] || "text/html";
        try {
            for (let rootDir of assets) {
                let filePath = rootDir + url;
                let content = await read_promise(filePath);
                if (typeof content !== "undefined") {
                    console.log(`200 ${url}`);
                    response.writeHead(200, { "Content-Type": contentType });
                    response.end(
                        content,
                        extname === ".arrow" ? undefined : "utf-8"
                    );
                    return;
                }
            }
            if (host_psp || typeof host_psp === "undefined") {
                for (let rootDir of DEFAULT_ASSETS) {
                    try {
                        let paths = require.resolve.paths(rootDir + url);
                        paths = [
                            ...paths,
                            ...assets.map((x) => path.join(x, "node_modules")),
                            LOCAL_PATH,
                        ];
                        let filePath = require.resolve(rootDir + url, {
                            paths,
                        });
                        let content = await read_promise(filePath);
                        if (typeof content !== "undefined") {
                            console.log(`200 ${url}`);
                            response.writeHead(200, {
                                "Content-Type": contentType,
                            });
                            response.end(
                                content,
                                extname === ".arrow" ? undefined : "utf-8"
                            );
                            return;
                        }
                    } catch (e) {
                        // console.log(e);
                    }
                }
            }
            if (url.indexOf("favicon.ico") > -1) {
                response.writeHead(200);
                response.end("", "utf-8");
            } else {
                console.error(`404 ${url}`);
                response.writeHead(404);
                response.end("", "utf-8");
            }
        } catch (error) {
            if (error.code !== "ENOENT") {
                console.error(`500 ${url}`);
                response.writeHead(500);
                response.end("", "utf-8");
            }
        }
    };
}

class WebSocketServer extends WebSocketManager {
    constructor({ assets, host_psp, port, on_start } = {}) {
        super();
        port = typeof port === "undefined" ? 8080 : port;
        assets = assets || ["./"];

        // Serve Perspective files through HTTP
        this._server = stoppable(
            http.createServer(perspective_assets(assets, host_psp))
        );

        // Serve Worker API through WebSockets
        this._wss = new WebSocket.Server({
            noServer: true,
            perMessageDeflate: true,
        });

        // When the server starts, define how to handle messages
        this._wss.on("connection", (ws) => this.add_connection(ws));

        this._server.on("upgrade", (request, socket, head) => {
            console.log("200    *** websocket upgrade ***");
            this._wss.handleUpgrade(request, socket, head, (sock) =>
                this._wss.emit("connection", sock, request)
            );
        });

        this._server.listen(port, () => {
            console.log(`Listening on port ${this._server.address().port}`);
            if (on_start) {
                on_start();
            }
        });
    }

    async close() {
        super.clear();
        await new Promise((x) => this._server.stop(x));
    }
}

/**
 * Create a new Websocket connection to `url`, setting up the protocol for
 * a Perspective server and Perspective client to communicate.
 * @param {*} url
 */
const websocket = (url) => {
    return new WebSocketClient(new WebSocket(url));
};

module.exports.get_type_config = get_type_config;
module.exports.get_config = get_config;
module.exports.worker = () => module.exports;
module.exports.shared_worker = () => module.exports;
module.exports.websocket = websocket;
module.exports.perspective_assets = perspective_assets;
module.exports.WebSocketServer = WebSocketServer;
module.exports.WebSocketManager = WebSocketManager;
