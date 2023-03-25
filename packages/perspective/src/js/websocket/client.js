/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import { Client } from "../api/client.js";

// Initiate a `ping` to the server every 30 seconds
const PING_TIMEOUT = 30000;
export class WebSocketClient extends Client {
    _ping() {
        this._ping_loop && this._ws.send("ping");
        this._ping_loop = setTimeout(this._ping.bind(this), PING_TIMEOUT);
    }

    _close() {
        clearTimeout(this._ping_loop);
        this._ping_loop = undefined;
        this._on_close_callback?.();
    }

    _onmessage(msg) {
        if (msg.data === "pong") {
            return;
        }

        if (this._pending_binary) {
            // Process a binary being sent by the server, which
            // can decide how many chunks to send and the size of each
            // chunk.
            let binary_msg = msg.data;

            this._full_binary.set(
                new Uint8Array(binary_msg),
                this._total_chunk_length
            );
            this._total_chunk_length += binary_msg.byteLength;

            // Use the total length of the binary from the pre-message
            // to decide when to stop waiting for new chunks from the
            // server.
            if (this._total_chunk_length === this._pending_binary_length) {
                // Chunking is complete and the binary has been received
                // in full.
                binary_msg = this._full_binary.buffer;
            } else {
                // Wait for another chunk.
                return;
            }

            let result = {
                data: {
                    id: this._pending_binary,
                    data: binary_msg,
                },
            };

            // make sure on_update callbacks are called with a `port_id`
            // AND the transferred binary.
            if (this._pending_port_id !== undefined) {
                const new_data_with_port_id = {
                    port_id: this._pending_port_id,
                    delta: binary_msg,
                };
                result.data.data = new_data_with_port_id;
            }

            // Send the joined message to the client for handling.
            this._handle(result);

            // Reset flags to end special message flow.
            delete this._pending_binary;
            delete this._pending_binary_length;
            delete this._pending_port_id;

            this._total_chunk_length = 0;
            this._full_binary = null;
        } else {
            msg = JSON.parse(msg.data);

            // If the message has `binary_length` set,the worker expects the
            // next message to be a binary message. This sets the
            // `_pending_binary` flag, which triggers a special handler for
            // the ArrayBuffer containing binary data.
            if (msg.binary_length) {
                this._pending_binary = msg.id;
                this._pending_binary_length = msg.binary_length;

                // Check whether the message also contains a `port_id`,
                // indicating that we are in an `on_update` callback and
                // the pending binary needs to be joined with the port_id
                // for on_update handlers to work properly.
                if (msg.data && msg.data.port_id !== undefined) {
                    this._pending_port_id = msg.data.port_id;
                }

                // Create an empty ArrayBuffer to hold the binary, as it
                // will be sent in n >= 1 chunks.
                this._full_binary = new Uint8Array(this._pending_binary_length);
            } else {
                this._handle({
                    data: msg,
                });
            }
        }
    }

    constructor(ws) {
        super();
        this._ws = ws;
        this._ws.binaryType = "arraybuffer";
        this._full_binary;
        this._total_chunk_length = 0;
        this._pending_binary_length = 0;

        this._ws.onopen = () => {
            this.send({
                id: -1,
                cmd: "init",
            });
        };

        this._ping();
        this._ws.onclose = this._close.bind(this);
        this._ws.onmessage = this._onmessage.bind(this);
    }

    /**
     * Send a message to the server, checking whether the arguments contain an
     * ArrayBuffer.
     *
     * @param {Object} msg a message to send to the remote. If the `args`
     * param contains an ArrayBuffer, two messages will be sent - a pre-message
     * with the `binary_length` flag set to true, and a second message
     * containing the ArrayBuffer. This allows for transport of metadata
     * alongside an ArrayBuffer, and the pattern should be implemented by the
     * receiver.
     */
    send(msg) {
        if (this._ws.readyState === WebSocket.CLOSED) {
            console.warn("Websocket connection is already closed.");
            return;
        }

        if (
            msg.args &&
            msg.args.length > 0 &&
            msg.args[0] instanceof ArrayBuffer &&
            msg.args[0].byteLength !== undefined
        ) {
            const pre_msg = msg;
            msg.binary_length = msg.args[0].byteLength;
            this._ws.send(JSON.stringify(pre_msg));
            this._ws.send(msg.args[0]);
            return;
        }
        this._ws.send(JSON.stringify(msg));
    }

    terminate() {
        return new Promise((resolve) => {
            this._on_close_callback = resolve;
            this._ws.close();
        });
    }
}
