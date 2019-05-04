/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * Unbind a listener to an event.
 *
 * @param {*} method
 * @param {*} cmd
 */
export function unsubscribe(method, cmd) {
    return function() {
        let resolve;
        let reject = () => {};
        let args = Array.prototype.slice.call(arguments, 0, arguments.length);
        for (let i = args.length - 1; i >= 0; i--) {
            if (typeof args[i] === "function") {
                resolve = args.splice(i, 1)[0];
            }
        }
        let msg = {
            cmd: cmd || "view_method",
            name: this._name,
            method: method,
            args: args,
            subscribe: true
        };
        this._worker.post(msg, resolve, reject);
        this._worker.unsubscribe(cmd, resolve);
    };
}

/**
 * Bind a listener to an event.
 *
 * @param {*} method
 * @param {*} cmd
 */
export function subscribe(method, cmd) {
    return function() {
        let resolve;
        let reject = () => {};
        let args = Array.prototype.slice.call(arguments, 0, arguments.length);
        for (let i = args.length - 1; i >= 0; i--) {
            if (typeof args[i] === "function") {
                resolve = args.splice(i, 1)[0];
            }
        }
        let msg = {
            cmd: cmd || "view_method",
            name: this._name,
            method: method,
            args: args,
            subscribe: true
        };
        this._worker.post(msg, resolve, reject, true);
    };
}

/**
 * Add a method call to the queue, preparing it for execution.
 *
 * @param {*} method
 * @param {*} cmd
 */
export function async_queue(method, cmd) {
    return function() {
        var args = Array.prototype.slice.call(arguments, 0, arguments.length);
        return new Promise(
            function(resolve, reject) {
                var msg = {
                    cmd: cmd || "view_method",
                    name: this._name,
                    method: method,
                    args: args,
                    subscribe: false
                };
                this._worker.post(msg, resolve, reject);
            }.bind(this)
        );
    };
}
