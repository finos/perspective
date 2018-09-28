/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import buffer from "../../obj/psp.sync.wasm";

const perspective = require("./perspective.js");

const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");

const path = require("path");

const load_perspective = require("../../obj/psp.sync.js").load_perspective;

let Module = load_perspective({
    wasmBinary: buffer,
    wasmJSMethod: "native-wasm",
    ENVIRONMENT: "NODE"
});

module.exports = perspective(Module);
delete module.exports["worker"];

let CLIENT_ID_GEN = 0;

const DEFAULT_ASSETS = [
    "node_modules/@jpmorganchase/perspective/build",
    "node_modules/@jpmorganchase/perspective-viewer/build",
    "node_modules/@jpmorganchase/perspective-viewer-highcharts/build",
    "node_modules/@jpmorganchase/perspective-viewer-hypergrid/build"
];

function read_promise(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, function(error, content) {
            if (error) {
                reject(error);
            } else {
                resolve(content);
            }
        });
    });
}

function create_http_server(assets) {
    return async function(request, response) {
        let url = request.url;
        if (url === "/") {
            url = "/index.html";
        }
        for (let rootDir of assets) {
            try {
                var extname = path.extname(url);
                var contentType =
                    {
                        ".js": "text/javascript",
                        ".css": "text/css",
                        ".json": "application/json",
                        ".arrow": "arraybuffer",
                        ".wasm": "application/wasm"
                    }[extname] || "text/html";
                var filePath = rootDir + url;
                let content = await read_promise(filePath);
                if (typeof content !== "undefined") {
                    console.log(`200 ${url}`);
                    response.writeHead(200, {"Content-Type": contentType});
                    response.end(content, extname === ".arrow" ? "user-defined" : "utf-8");
                    return;
                }
            } catch (error) {
                if (error.code !== "ENOENT") {
                    console.error(`500 ${url}`);
                    response.writeHead(500);
                    response.end();
                }
            }
        }
        console.error(`404 ${url}`);
        response.writeHead(404);
        response.end();
    };
}

/**
 * A WebSocket server instance for a remote perspective, and convenience HTTP
 * file server for easy hosting.
 */
class WebSocketHost extends module.exports.Host {
    constructor({port, assets, host_psp}) {
        super();
        port = port || 8080;
        assets = assets || ["./"];
        if (host_psp || typeof host_psp === "undefined") {
            assets = [...assets, ...DEFAULT_ASSETS];
        }

        const server = http.createServer(create_http_server(assets));

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

        server.on(
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

        server.listen(port);
        console.log(`Listening on port ${port}`);
    }

    post(msg) {
        this.REQS[msg.id].send(JSON.stringify(msg));
        delete this.REQS[msg.id];
    }

    open(name, data, options) {
        this._tables[name] = module.exports.table(data, options);
    }
}

module.exports.WebSocketHost = WebSocketHost;
