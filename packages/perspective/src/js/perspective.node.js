/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {Client} = require("./api/client.js");
const {Server} = require("./api/server.js");
const {WebSocketManager} = require("./websocket/manager");
const {WebSocketClient} = require("./websocket/client");

const perspective = require("./perspective.js").default;

const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");
const process = require("process");

const path = require("path");

const load_perspective = require("./psp.async.js").default;

// eslint-disable-next-line no-undef

const LOCAL_PATH = path.join(process.cwd(), "node_modules");
const buffer = require("./psp.async.wasm.js").default;

const SYNC_SERVER = new (class extends Server {
    init(msg) {
        load_perspective({
            wasmBinary: buffer,
            wasmJSMethod: "native-wasm"
        }).then(core => {
            this.perspective = perspective(core);
            super.init(msg);
        });
    }

    post(msg) {
        SYNC_CLIENT._handle({data: msg});
    }
})();

const SYNC_CLIENT = new (class extends Client {
    send(msg) {
        SYNC_SERVER.process(msg);
    }
})();

SYNC_CLIENT.send({id: -1, cmd: "init"});

module.exports = SYNC_CLIENT;
module.exports.sync_module = () => SYNC_SERVER.perspective;

const DEFAULT_ASSETS = [
    "@finos/perspective/dist/umd",
    "@finos/perspective-bench/dist",
    "@finos/perspective-viewer/dist/umd",
    "@finos/perspective-viewer-datagrid/dist/umd",
    "@finos/perspective-viewer-d3fc/dist/umd",
    "@finos/perspective-workspace/dist/umd"
];

const CONTENT_TYPES = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".arrow": "arraybuffer",
    ".wasm": "application/wasm"
};

function read_promise(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, function(error, content) {
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
    return async function(request, response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Request-Method", "*");
        response.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
        response.setHeader("Access-Control-Allow-Headers", "*");
        let url = request.url.split(/[\?\#]/)[0];
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
                    response.writeHead(200, {"Content-Type": contentType});
                    response.end(content, extname === ".arrow" ? "user-defined" : "utf-8");
                    return;
                }
            }
            if (host_psp || typeof host_psp === "undefined") {
                for (let rootDir of DEFAULT_ASSETS) {
                    try {
                        let paths = require.resolve.paths(rootDir + url);
                        paths = [...paths, ...assets.map(x => path.join(x, "node_modules")), LOCAL_PATH];
                        let filePath = require.resolve(rootDir + url, {paths});
                        let content = await read_promise(filePath);
                        if (typeof content !== "undefined") {
                            console.log(`200 ${url}`);
                            response.writeHead(200, {"Content-Type": contentType});
                            response.end(content, extname === ".arrow" ? "user-defined" : "utf-8");
                            return;
                        }
                    } catch (e) {}
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
    constructor({assets, host_psp, port, on_start} = {}) {
        super();
        port = typeof port === "undefined" ? 8080 : port;
        assets = assets || ["./"];

        // Serve Perspective files through HTTP
        this._server = http.createServer(perspective_assets(assets, host_psp));

        // Serve Worker API through WebSockets
        this._wss = new WebSocket.Server({noServer: true, perMessageDeflate: true});

        // When the server starts, define how to handle messages
        this._wss.on("connection", ws => this.add_connection(ws));

        this._server.on("upgrade", (request, socket, head) => {
            console.log("200    *** websocket upgrade ***");
            this._wss.handleUpgrade(request, socket, head, sock => this._wss.emit("connection", sock, request));
        });

        this._server.listen(port, () => {
            console.log(`Listening on port ${this._server.address().port}`);
            if (on_start) {
                on_start();
            }
        });
    }

    close() {
        this._server.close();
    }
}

/**
 * Create a new Websocket connection to `url`, setting up the protocol for
 * a Perspective server and Perspective client to communicate.
 * @param {*} url
 */
const websocket = url => {
    return new WebSocketClient(new WebSocket(url));
};

module.exports.worker = () => module.exports;
module.exports.websocket = websocket;
module.exports.perspective_assets = perspective_assets;
module.exports.WebSocketServer = WebSocketServer;
module.exports.WebSocketManager = WebSocketManager;
module.exports.get_type_config = require("./config").get_type_config;
module.exports.get_types = require("./config").get_types;
