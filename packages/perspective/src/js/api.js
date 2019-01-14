/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {bindall} from "./utils.js";

function unsubscribe(method, cmd) {
    return function() {
        let resolve = arguments[arguments.length - 1];
        let reject = () => {};
        let args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
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

function subscribe(method, cmd) {
    return function() {
        let resolve = arguments[arguments.length - 1];
        let reject = () => {};
        let args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
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

function async_queue(method, cmd) {
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

function view(worker, table_name, config) {
    this._worker = worker;
    this._config = config;
    this._name = Math.random() + "";
    var msg = {
        cmd: "view",
        view_name: this._name,
        table_name: table_name,
        config: config
    };
    this._worker.post(msg);
    bindall(this);
}

view.prototype.to_json = async_queue("to_json");

view.prototype.to_columns = async_queue("to_columns");

view.prototype.to_csv = async_queue("to_csv");

view.prototype.schema = async_queue("schema");

view.prototype.num_columns = async_queue("num_columns");

view.prototype.num_rows = async_queue("num_rows");

view.prototype.set_depth = async_queue("set_depth");

view.prototype.get_row_expanded = async_queue("get_row_expanded");

view.prototype.expand = async_queue("expand");

view.prototype.collapse = async_queue("collapse");

view.prototype.delete = async_queue("delete");

view.prototype.col_to_js_typed_array = async_queue("col_to_js_typed_array");

view.prototype.on_update = subscribe("on_update", "view_method", true);

view.prototype.remove_update = unsubscribe("remove_update", "view_method", true);

view.prototype.on_delete = subscribe("on_delete", "view_method", true);

view.prototype.remove_delete = unsubscribe("remove_delete", "view_method", true);

function table(worker, data, options) {
    this._worker = worker;
    // Set up msg
    name = options.name || Math.random() + "";
    var msg = {
        cmd: "table",
        name: name,
        args: [data],
        options: options || {}
    };
    this._worker.post(msg);
    this._name = name;

    bindall(this);
}

function computed_table(worker, computed, name) {
    this._worker = worker;
    this._name = Math.random() + "";
    let original = name;
    // serialize functions
    for (let i = 0; i < computed.length; ++i) {
        let column = computed[i];
        let func = column["func"];
        if (typeof func == "function") {
            column["func"] = func.toString();
        }
    }
    var msg = {
        cmd: "add_computed",
        original: original,
        name: this._name,
        computed: computed
    };
    this._worker.post(msg);
}

function proxy_table(worker, name) {
    this._worker = worker;
    this._name = name;
}

computed_table.prototype = table.prototype;
proxy_table.prototype = table.prototype;

table.prototype.add_computed = function(computed) {
    return new computed_table(this._worker, computed, this._name);
};

table.prototype.view = function(config) {
    return new view(this._worker, this._name, config);
};

table.prototype.schema = async_queue("schema", "table_method");

table.prototype.column_metadata = async_queue("column_metadata", "table_method");

table.prototype.computed_schema = async_queue("computed_schema", "table_method");

table.prototype.is_valid_filter = async_queue("is_valid_filter", "table_method");

table.prototype.size = async_queue("size", "table_method");

table.prototype.columns = async_queue("columns", "table_method");

table.prototype.delete = async_queue("delete", "table_method");

table.prototype.on_delete = subscribe("on_delete", "table_method", true);

table.prototype.remove = async_queue("remove", "table_method");

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
    throw new Error("post() not implemented");
};

worker.prototype.open = function(name) {
    return new proxy_table(this, name);
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
