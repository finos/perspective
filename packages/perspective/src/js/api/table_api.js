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
    return new Promise((resolve, reject) => {
        this._worker = worker;
        this._name = options.name || Math.random() + "";

        bindall(this);

        if (data.to_arrow) {
            this._worker.post({
                cmd: "table",
                name: this._name,
                args: [],
                options: options || {}
            });
            data.to_arrow().then(arrow => {
                this._worker.post(
                    {
                        cmd: "table",
                        name: this._name,
                        args: [arrow],
                        options: options || {}
                    },
                    () => {
                        data.on_update(
                            updated => {
                                this.update(updated.delta);
                            },
                            {mode: "row"}
                        );
                        resolve(this);
                    },
                    reject
                );
            });
        } else {
            this._worker.post(
                {
                    cmd: "table",
                    name: this._name,
                    args: [data],
                    options: options || {}
                },
                () => {
                    resolve(this);
                },
                reject
            );
        }
    });
}

table.prototype.type = "table";

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

proxy_table.prototype = table.prototype;

// Dispatch table methods that create new objects to the worker
table.prototype.view = function(config) {
    return new view(this._worker, this._name, config);
};

// Dispatch table methods that do not create new objects (getters, setters etc.)
// to the queue for processing.
table.prototype.get_index = async_queue("get_index", "table_method");

table.prototype.get_limit = async_queue("get_limit", "table_method");

table.prototype.make_port = async_queue("make_port", "table_method");

table.prototype.remove_port = async_queue("remove_port", "table_method");

table.prototype.compute = async_queue("compute", "table_method");

table.prototype.schema = async_queue("schema", "table_method");

table.prototype.computed_schema = async_queue("computed_schema", "table_method");

table.prototype.get_computation_input_types = async_queue("get_computation_input_types", "table_method");

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

table.prototype.update = function(data, options) {
    return new Promise((resolve, reject) => {
        this._worker.post(
            {
                name: this._name,
                cmd: "table_method",
                method: "update",
                args: [data, options || {}]
            },
            resolve,
            reject,
            false
        );
    });
};

table.prototype.execute = function(f) {
    this._worker.post({
        cmd: "table_execute",
        name: this._name,
        f: f.toString()
    });
};
