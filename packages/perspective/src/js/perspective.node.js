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

const perspective = require("./perspective.js").default;

const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");
const process = require("process");

const path = require("path");

const load_perspective = require("./psp.async.js").default;

// eslint-disable-next-line no-undef
const RESOLVER = typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__.resolve : module.require.resolve;

const LOCAL_PATH = path.join(process.cwd(), "node_modules");

const wasm = require("./psp.async.wasm.js");

const buffer = fs.readFileSync(path.join(__dirname, wasm)).buffer;

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

let CLIENT_ID_GEN = 0;

const DEFAULT_ASSETS = [
    "@finos/perspective/dist/umd",
    "@finos/perspective-bench/dist",
    "@finos/perspective-viewer/dist/umd",
    "@finos/perspective-viewer-highcharts/dist/umd",
    "@finos/perspective-viewer-hypergrid/dist/umd",
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
function create_http_server(assets, host_psp) {
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

/**
 * A WebSocket server instance for a remote perspective, and convenience HTTP
 * file server for easy hosting.
 */
class WebSocketServer extends Server {
    constructor({port, assets, host_psp, on_start}) {
        super(module.exports);
        port = typeof port === "undefined" ? 8080 : port;
        assets = assets || ["./"];

        // Serve Perspective files through HTTP
        this._server = http.createServer(create_http_server(assets, host_psp));

        this.REQS = {};
        this.REQ_ID_MAP = new Map();

        // Serve Worker API through WebSockets
        this._wss = new WebSocket.Server({noServer: true, perMessageDeflate: true});

        // When the server starts, define how to handle messages
        this._wss.on("connection", ws => {
            ws.isAlive = true;
            ws.id = CLIENT_ID_GEN++;

            // Parse incoming messages
            ws.on("message", msg => {
                ws.isAlive = true;
                if (msg === "heartbeat") {
                    ws.send("heartbeat");
                    return;
                }
                msg = JSON.parse(msg);
                const compound_id = `${msg.id}/${ws.id}`;
                this.REQ_ID_MAP.set(compound_id, msg.id);
                msg.id = compound_id;
                this.REQS[msg.id] = {ws, msg};
                try {
                    // Send all messages to the handler defined in
                    // Perspective.Server
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

        // clear invalid connections
        setInterval(() => {
            this._wss.clients.forEach(function each(ws) {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
            });
        }, 30000);

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
                on_start.bind(this)();
            }
        });
    }

    /**
     * Send an asynchronous message to the Perspective web worker.
     *
     * If the `transferable` param is set, pass two messages: the string
     * representation of the message and then the ArrayBuffer data that needs to
     * be transferred. The `is_transferable` flag tells the client to expect the
     * next message to be a transferable object.
     *
     * @param {Object} msg a valid JSON-serializable message to pass to the
     * client
     * @param {*} transferable a transferable object to be sent to the client
     */
    post(msg, transferable) {
        const req = this.REQS[msg.id];
        const id = msg.id;
        if (req.ws.readyState > 1) {
            delete this.REQS[id];
            throw new Error("Connection closed");
        }
        msg.id = this.REQ_ID_MAP.get(id);
        if (transferable) {
            msg.is_transferable = true;
            req.ws.send(JSON.stringify(msg));
            req.ws.send(transferable[0]);
        } else {
            req.ws.send(JSON.stringify(msg));
        }
        if (!req.msg.subscribe) {
            this.REQ_ID_MAP.delete(id);
            delete this.REQS[id];
        }
    }

    _host(cache, name, input) {
        if (cache[name] !== undefined) {
            throw new Error(`"${name}" already exists`);
        }
        input.on_delete(() => {
            delete cache[name];
        });
        cache[name] = input;
    }

    /**
     * Expose a Perspective `table` through the WebSocket, allowing
     * it to be accessed by a unique name from a client.  Hosted objects
     * are automatically `eject`ed when their `delete()` method is called.
     *
     * @param {String} name
     * @param {perspective.table} table `table` to host.
     */
    host_table(name, table) {
        this._host(this._tables, name, table);
    }

    /**
     * Expose a Perspective `view` through the WebSocket, allowing
     * it to be accessed by a unique name from a client.  Hosted objects
     * are automatically `eject`ed when their `delete()` method is called.
     *
     * @param {String} name
     * @param {perspective.view} view `view` to host.
     */
    host_view(name, view) {
        this._host(this._views, name, view);
    }

    /**
     * Cease hosting a `table` on this server.  Hosted objects
     * are automatically `eject`ed when their `delete()` method is called.
     *
     * @param {String} name
     */
    eject_table(name) {
        delete this._tables[name];
    }

    /**
     * Cease hosting a `view` on this server.  Hosted objects
     * are automatically `eject`ed when their `delete()` method is called.
     *
     * @param {String} name
     */
    eject_view(name) {
        delete this._views[name];
    }

    close() {
        this._server.close();
    }
}

module.exports.WebSocketServer = WebSocketServer;
