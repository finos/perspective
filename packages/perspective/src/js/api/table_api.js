/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {unsubscribe, subscribe, async_queue} from "./dispatch.js";
import {view} from "./view_api.js";
import {bindall} from "../utils.js";

/**
 * Construct a proxy for the table object by creating a "table" message and
 * sending it through the worker.
 *
 * @param {*} worker
 * @param {*} data
 * @param {*} options
 */
export function table(worker, data, options) {
    this._worker = worker;
    let name = options.name || Math.random() + "";
    this._name = name;
    bindall(this);
    if (data.to_arrow) {
        var msg = {
            cmd: "table",
            name: name,
            args: [],
            options: options || {}
        };
        this._worker.post(msg);
        data.to_arrow().then(arrow => {
            var msg = {
                cmd: "table",
                name: name,
                args: [arrow],
                options: options || {}
            };
            this._worker.post(msg);
            data.on_update(this.update, {mode: "row"});
        });
    } else {
        var msg = {
            cmd: "table",
            name: name,
            args: [data],
            options: options || {}
        };
        this._worker.post(msg);
    }
}

table.prototype.type = "table";

/**
 * Create a new computed table.
 *
 * @param {*} worker
 * @param {*} computed
 * @param {*} name
 */
function computed_table(worker, computed, name) {
    this._worker = worker;
    this._name = Math.random() + "";
    const original = name;
    const msg = {
        cmd: "add_computed",
        original: original,
        name: this._name,
        computed: computed
    };
    this._worker.post(msg);
}

/**
 * Create a reference to a Perspective table at `worker` for use by remote
 * clients.
 *
 * @param {worker} worker the Web Worker at which the table is located.
 * @param {String} name a unique name for the table.
 */
export function proxy_table(worker, name) {
    this._worker = worker;
    this._name = name;
}

computed_table.prototype = table.prototype;
proxy_table.prototype = table.prototype;

// Dispatch table methods that create new objects to the worker
table.prototype.add_computed = function(computed) {
    return new computed_table(this._worker, computed, this._name);
};

table.prototype.view = function(config) {
    return new view(this._worker, this._name, config);
};

// Dispatch table methods that do not create new objects (getters, setters etc.)
// to the queue for processing.

table.prototype.compute = async_queue("compute", "table_method");

table.prototype.schema = async_queue("schema", "table_method");

table.prototype.computed_schema = async_queue("computed_schema", "table_method");

table.prototype.get_computed_functions = async_queue("get_computed_functions", "table_method");

table.prototype.is_valid_filter = async_queue("is_valid_filter", "table_method");

table.prototype.size = async_queue("size", "table_method");

table.prototype.columns = async_queue("columns", "table_method");

table.prototype.clear = async_queue("clear", "table_method");

table.prototype.replace = async_queue("replace", "table_method");

table.prototype.delete = async_queue("delete", "table_method");

table.prototype.on_delete = subscribe("on_delete", "table_method", true);

table.prototype.remove = async_queue("remove", "table_method");

table.prototype.remove_delete = unsubscribe("remove_delete", "table_method", true);

table.prototype.update = function(data) {
    return new Promise((resolve, reject) => {
        var msg = {
            name: this._name,
            cmd: "table_method",
            method: "update",
            args: [data]
        };
        this._worker.post(msg, resolve, reject, false);
    });
};

table.prototype.execute = function(f) {
    var msg = {
        cmd: "table_execute",
        name: this._name,
        f: f.toString()
    };
    this._worker.post(msg);
};
