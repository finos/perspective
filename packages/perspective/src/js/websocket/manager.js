/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import { Server } from "../api/server.js";

let CLIENT_ID_GEN = 0;

/**
 * A WebSocket Manager instance to host a Perspective server in NodeJS.
 */
export class WebSocketManager extends Server {
    constructor(...args) {
        super(...args);
        this.requests_id_map = new Map();
        this.requests = {};
        this.websockets = {};

        // Send chunks of this size (in bytes)
        this.chunk_size = 50 * 1000 * 1000;

        // clear invalid connections
        setInterval(() => {
            Object.entries(this.websockets).forEach(([id, ws]) => {
                if (ws.isAlive === false) {
                    delete this.websockets[id];
                    return ws.terminate();
                }
                ws.isAlive = false;
            });
        }, 30000);
    }

    /**
     * Add a new websocket connection to the manager, and define a handler
     * for all incoming messages. If the incoming message has `binary_length`
     * set, handle incoming `ArrayBuffers` correctly.
     *
     * The WebsocketManager manages the websocket connection and processes every
     * message received from each connections. When a websocket connection is
     * `closed`, the websocket manager will clear all subscriptions associated
     * with the connection.
     *
     * @param {WebSocket} ws a websocket connection
     */
    add_connection(ws) {
        ws.isAlive = true;
        ws.binaryType = "arraybuffer";
        ws.id = CLIENT_ID_GEN++;

        // Parse incoming messages
        ws.on("message", (msg) => {
            ws.isAlive = true;

            if (msg === "ping") {
                ws.send("pong");
                return;
            }

            if (this._pending_binary) {
                // Combine ArrayBuffer and previous message so that metadata can
                // be reconstituted for the server, as the server needs the
                // whole message to correctly delegate commands.
                const binary = msg;
                let new_args = [binary];
                msg = this._pending_binary;

                if (msg.args && msg.args.length > 1) {
                    new_args = new_args.concat(msg.args.slice(1));
                }

                msg.args = new_args;

                delete msg.binary_length;
                delete this._pending_binary;
            } else {
                msg = JSON.parse(msg);

                if (msg.binary_length) {
                    this._pending_binary = msg;
                    return;
                }
            }

            try {
                // Send all messages to the handler defined in
                // Perspective.Server
                const compoundId = `${msg.id}/${ws.id}`;
                this.requests_id_map.set(compoundId, msg.id);
                msg.id = compoundId;
                this.requests[msg.id] = {
                    ws,
                    msg,
                };
                this.process(msg, ws.id);
            } catch (e) {
                console.error(e);
            }
        });
        ws.on("close", () => {
            this.clear_views(ws.id);
        });
        ws.on("error", console.error);
    }

    /**
     * Send an asynchronous message to the Perspective client through
     * the websocket.
     *
     * If the `transferable` param is set, pass two messages: the string
     * representation of the message and then the ArrayBuffer data that needs to
     * be transferred. `binary_length` tells the client to expect the next
     * message to be a transferable object.
     *
     * @param {Object} msg a valid JSON-serializable message to pass to the
     * client
     * @param {*} transferable a transferable object to be sent to the client
     */
    post(msg, transferable) {
        const req = this.requests[msg.id];
        const id = msg.id;
        if (req.ws.readyState > 1) {
            delete this.requests[id];
            throw new Error("Connection closed");
        }
        msg.id = this.requests_id_map.get(id);
        if (transferable) {
            const binary_msg = transferable[0];
            msg.binary_length = binary_msg.byteLength;
            req.ws.send(JSON.stringify(msg));
            this._post_chunked(
                req,
                binary_msg,
                0,
                this.chunk_size,
                binary_msg.byteLength
            );
        } else {
            req.ws.send(JSON.stringify(msg));
        }
        if (!req.msg.subscribe) {
            this.requests_id_map.delete(id);
            delete this.requests[id];
        }
    }

    /**
     * Send a binary message (in the transferable param) in chunks.
     *
     * @param {*} request
     * @param {ArrayBuffer} binary
     * @param {Number} start
     * @param {Number} end
     * @param {Number} length
     */
    _post_chunked(request, binary, start, end, length) {
        if (start < length) {
            end = start + this.chunk_size;
            if (end > length) end = length;
            request.ws.send(binary.slice(start, end));
            start = end;
            setTimeout(() => {
                this._post_chunked(request, binary, start, end, length);
            }, 0);
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
}
