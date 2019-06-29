/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {table, proxy_table} from "./table_api.js";
import {proxy_view} from "./view_api.js";
import {bindall} from "../utils.js";

/**
 * Perspective's worker API handles and processes asynchronous messages, interfacing with the Perspective host class.
 *
 * Child classes must implement the `send()` interface, which defines how messages are dispatched in different contexts.
 *
 * `handlers` is a dictionary of resolve/reject callbacks for each method the worker receives.
 *
 * @export
 */
export function Client() {
    this._worker = {
        initialized: {value: false},
        transferable: false,
        msg_id: 0,
        handlers: {},
        messages: []
    };
    bindall(this);
}

/**
 * Remove a listener for a Perspective-generated event.
 */
Client.prototype.unsubscribe = function(cmd, handler) {
    for (let key of Object.keys(this._worker.handlers)) {
        if (this._worker.handlers[key].resolve === handler) {
            delete this._worker.handlers[key];
        }
    }
};

/**
 * Process an asynchronous message.
 */
Client.prototype.post = function(msg, resolve, reject, keep_alive = false) {
    if (resolve || reject) {
        this._worker.handlers[++this._worker.msg_id] = {resolve, reject, keep_alive};
    }
    msg.id = this._worker.msg_id;
    if (this._worker.initialized.value) {
        this.send(msg);
    } else {
        this._worker.messages.push(() => this.send(msg));
    }
};

Client.prototype.initialize_profile_thread = function() {
    if (this._worker.initialized.value) {
        this.send({id: -1, cmd: "init_profile_thread"});
    } else {
        this._worker.messages.push(() => this.send({id: -1, cmd: "init_profile_thread"}));
    }
};

/**
 * Must be implemented in order to transport commands to the server.
 */
Client.prototype.send = function() {
    throw new Error("send() not implemented");
};

Client.prototype.open_table = function(name) {
    return new proxy_table(this, name);
};

Client.prototype.open_view = function(name) {
    return new proxy_view(this, name);
};

let _initialized = false;

/**
 * Handle a command from Perspective. If the Client is not initialized, initialize it and dispatch the `perspective-ready` event.
 *
 * Otherwise, reject or resolve the incoming command.
 */
Client.prototype._handle = function(e) {
    if (!this._worker.initialized.value) {
        if (!_initialized && typeof document !== "undefined") {
            var event = document.createEvent("Event");
            event.initEvent("perspective-ready", false, true);
            window.dispatchEvent(event);
            _initialized = true;
        }

        const msgs = this._worker.messages;

        this._worker.initialized.value = true;
        this._worker.messages = [];

        if (msgs) {
            for (const m in msgs) {
                if (msgs.hasOwnProperty(m)) {
                    setTimeout(msgs[m]);
                }
            }
        }
    }
    if (e.data.id) {
        var handler = this._worker.handlers[e.data.id];
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
};

Client.prototype.table = function(data, options) {
    return new table(this, data, options || {});
};

Client.prototype.terminate = function() {
    this._worker.terminate();
    this._worker = undefined;
};
