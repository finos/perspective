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

/**
 * A WebSocket server instance for a remote perspective, and convenience HTTP
 * file server for easy hosting.
 */
class WebSocketHost extends module.exports.Host {
    constructor({port, rootDir}) {
        port = port || 8080;
        rootDir = rootDir || "./";
        super();

        const server = http.createServer(function(request, response) {
            var filePath = rootDir + request.url;
            var extname = path.extname(filePath);
            var contentType =
                {
                    ".js": "text/javascript",
                    ".css": "text/css",
                    ".json": "application/json",
                    ".arrow": "arraybuffer",
                    ".wasm": "application/wasm"
                }[extname] || "text/html";

            fs.readFile(filePath, function(error, content) {
                if (error) {
                    if (error.code == "ENOENT") {
                        console.error(`404 ${request.url}`);
                        response.writeHead(404);
                        response.end(content, "utf-8");
                    } else {
                        console.error(`500 ${request.url}`);
                        response.writeHead(500);
                        response.end();
                    }
                } else {
                    console.log(`200 ${request.url}`);
                    response.writeHead(200, {"Content-Type": contentType});
                    response.end(content, extname === ".arrow" ? "user-defined" : "utf-8");
                }
            });
        });

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
