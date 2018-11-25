/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require("./perspective.js").default;

const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");
const process = require("process");

const path = require("path");

const load_perspective = require("../../obj/psp.sync.js").load_perspective;

// eslint-disable-next-line no-undef
const RESOLVER = typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__.resolve : module.require.resolve;

const LOCAL_PATH = path.join(process.cwd(), "node_modules");

const wasm = require("./psp.sync.wasm.js");

const buffer = fs.readFileSync(path.join(__dirname, wasm)).buffer;

module.exports = perspective(
    load_perspective({
        wasmBinary: buffer,
        wasmJSMethod: "native-wasm"
    })
);

let CLIENT_ID_GEN = 0;

const DEFAULT_ASSETS = [
    "@jpmorganchase/perspective/build",
    "@jpmorganchase/perspective-viewer/build",
    "@jpmorganchase/perspective-viewer-highcharts/build",
    "@jpmorganchase/perspective-viewer-hypergrid/build"
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

function create_http_server(assets, host_psp) {
    return async function(request, response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Request-Method", "*");
        response.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
        response.setHeader("Access-Control-Allow-Headers", "*");
        let url = request.url;
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
                        let paths = RESOLVER.paths(rootDir + url);
                        paths = [...paths, ...assets.map(x => path.join(x, "node_modules")), LOCAL_PATH];
                        let filePath = RESOLVER(rootDir + url, {paths});
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
            console.error(`404 ${url}`);
            response.writeHead(404);
            response.end("", "utf-8");
        } catch (error) {
            if (error.code !== "ENOENT") {
                console.error(`500 ${url}`);
                response.writeHead(500);
                response.end("", "utf-8");
            }
        }
    };
}

/**
 * A WebSocket server instance for a remote perspective, and convenience HTTP
 * file server for easy hosting.
 */
class WebSocketHost extends module.exports.Host {
    constructor({port, assets, host_psp, on_start}) {
        super();
        port = typeof port === "undefined" ? 8080 : port;
        assets = assets || ["./"];

        this._server = http.createServer(create_http_server(assets, host_psp));

        this.REQS = {};
        this._wss = new WebSocket.Server({noServer: true, perMessageDeflate: true});
        this._wss.on("connection", ws => {
            ws.id = CLIENT_ID_GEN++;
            ws.on("message", msg => {
                msg = JSON.parse(msg);
                this.REQS[msg.id] = ws;
                try {
                    this.process(msg, ws.id);
                } catch (e) {
                    console.error(e);
                }
            });
            ws.on("close", () => {
                this.clear_views(ws.id);
            });
            ws.on("error", console.error);
        });

        this._server.on(
            "upgrade",
            function upgrade(request, socket, head) {
                console.log("200    *** websocket upgrade ***");
                this._wss.handleUpgrade(
                    request,
                    socket,
                    head,
                    function done(sock) {
                        this._wss.emit("connection", sock, request);
                    }.bind(this)
                );
            }.bind(this)
        );

        this._server.listen(port, () => {
            console.log(`Listening on port ${port}`);
            if (on_start) {
                on_start();
            }
        });
    }

    post(msg) {
        this.REQS[msg.id].send(JSON.stringify(msg));
        delete this.REQS[msg.id];
    }

    open(name, data, options) {
        this._tables[name] = module.exports.table(data, options);
    }

    close() {
        this._server.close();
    }
}

module.exports.WebSocketHost = WebSocketHost;
