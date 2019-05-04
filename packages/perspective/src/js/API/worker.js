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
 * Perspective's worker API handles and processes asynchronous messages, interfacing with the WASM engine.
 *
 * Child classes must implement the `send()` interface, which defines how messages are dispatched in different contexts.
 */
export function worker() {
    this._worker = {
        initialized: {value: false},
        transferable: false,
        msg_id: 0,
        handlers: {},
        messages: []
    };
    bindall(this);
}

worker.prototype.unsubscribe = function(cmd, handler) {
    for (let key of Object.keys(this._worker.handlers)) {
        if (this._worker.handlers[key].resolve === handler) {
            delete this._worker.handlers[key];
        }
    }
};

worker.prototype.post = function(msg, resolve, reject, keep_alive = false) {
    if (resolve) {
        this._worker.handlers[++this._worker.msg_id] = {resolve, reject, keep_alive};
    }
    msg.id = this._worker.msg_id;
    if (this._worker.initialized.value) {
        this.send(msg);
    } else {
        this._worker.messages.push(() => this.send(msg));
    }
};

worker.prototype.send = function() {
    throw new Error("send() not implemented");
};

worker.prototype.open_table = function(name) {
    return new proxy_table(this, name);
};

worker.prototype.open_view = function(name) {
    return new proxy_view(this, name);
};

let _initialized = false;

worker.prototype._handle = function(e) {
    if (!this._worker.initialized.value) {
        if (!_initialized) {
            var event = document.createEvent("Event");
            event.initEvent("perspective-ready", false, true);
            window.dispatchEvent(event);
            _initialized = true;
        }
        for (var m in this._worker.messages) {
            if (this._worker.messages.hasOwnProperty(m)) {
                this._worker.messages[m]();
            }
        }
        this._worker.initialized.value = true;
        this._worker.messages = [];
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

worker.prototype.table = function(data, options) {
    return new table(this, data, options || {});
};

worker.prototype.terminate = function() {
    this._worker.terminate();
    this._worker = undefined;
};
