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

import { table, proxy_table } from "./table_api.js";
import { bindall } from "../utils.js";

/**
 * Perspective's worker API handles and processes asynchronous messages,
 * interfacing with the Perspective host class.  Child classes must implement
 * the `send()` interface, which defines how messages are dispatched in
 * different contexts.  `handlers` is a dictionary of resolve/reject callbacks
 * for each method the worker receives.
 *
 * @export
 */
export class Client {
    constructor() {
        this._initialized = false;
        this._worker = {
            initialized: { value: false },
            transferable: false,
            msg_id: 0,
            handlers: {},
            messages: [],
        };
        bindall(this);
    }

    /**
     * Remove a listener for a Perspective-generated event.
     */
    unsubscribe(cmd, handler) {
        for (let key of Object.keys(this._worker.handlers)) {
            if (this._worker.handlers[key].resolve === handler) {
                delete this._worker.handlers[key];
            }
        }
    }

    /**
     * Send a message to the server.
     */
    post(msg, resolve, reject, keep_alive = false) {
        ++this._worker.msg_id;
        if (resolve || reject) {
            this._worker.handlers[this._worker.msg_id] = {
                resolve,
                reject,
                keep_alive,
            };
        }
        msg.id = this._worker.msg_id;
        if (this._worker.initialized.value) {
            this.send(msg);
        } else {
            this._worker.messages.push(() => {
                this.send(msg);

                if (
                    (msg.cmd === "table" || msg.cmd === "view") &&
                    !this._features?.wait_for_response &&
                    resolve
                ) {
                    resolve();
                }
            });
        }
    }

    /**
     * Snapshots memory usage from the WebWorker or Node.js process, with the
     * addition of `wasmHeap` Emscripten's linear memory
     * @async
     * @returns {MemoryUsage}
     */
    async memory_usage() {
        return await new Promise((resolve, reject) => {
            this.post({ cmd: "memory_usage" }, resolve, reject);
        });
    }

    async get_hosted_table_names() {
        return await new Promise((resolve, reject) => {
            this.post({ cmd: "get_hosted_table_names" }, resolve, reject);
        });
    }

    initialize_profile_thread() {
        if (this._worker.initialized.value) {
            this.send({ id: -1, cmd: "init_profile_thread" });
        } else {
            this._worker.messages.push(() =>
                this.send({ id: -1, cmd: "init_profile_thread" })
            );
        }
    }

    /**
     * Must be implemented in order to transport commands to the server.
     */
    send() {
        throw new Error("send() not implemented");
    }

    /**
     * Given the name of a table that is hosted on the server (e.g. using
     * `perspective-python` or `perspective` in NodeJS), return a `table`
     * instance that sends all operations and instructions to the `table` on the
     * server.
     *
     * @param {string} name
     */
    async open_table(name) {
        return new proxy_table(this, name);
    }

    /**
     * Receive a message from the server, and resolve/reject the promise that
     * is awaiting the content of the message.
     */
    _handle(e) {
        if (!this._worker.initialized.value) {
            if (!this._initialized) {
                this._initialized = true;
            }

            const msgs = this._worker.messages;
            this._worker.initialized.value = true;
            this._worker.messages = [];

            // If the `data` attribute of the init message is set, then
            // set the `features` dictionary with the flags from the server.
            if (e.data?.data) {
                this._features = {};

                for (const feature of e.data.data) {
                    this._features[feature] = true;
                }
            }

            if (msgs) {
                for (const m in msgs) {
                    if (msgs.hasOwnProperty(m)) {
                        msgs[m]();
                    }
                }
            }
        }

        if (e.data.id) {
            const handler = this._worker.handlers[e.data.id];

            if (handler) {
                if (e.data.error) {
                    handler.reject(e.data.error);
                } else {
                    handler.resolve(e.data.data);
                }

                if (!handler.keep_alive) {
                    delete this._worker.handlers[e.data.id];
                }
            }
        }
    }

    table(data, options) {
        return new table(this, data, options || {});
    }

    terminate() {
        this._worker.terminate();
        this._worker = undefined;
    }
}
