/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {detectIE, ScriptPath} from "@jpmorganchase/perspective-common";

import {TYPE_AGGREGATES, AGGREGATE_DEFAULTS} from "./defaults.js";

/******************************************************************************
 *
 * Utilities
 *
 */

var __SCRIPT_PATH__ = new ScriptPath();

// IE bug
if (detectIE() && window.location.href.indexOf(__SCRIPT_PATH__.host()) === -1) {
    console.warn("Perspective does not support parallel mode in IE when loading cross-origin.  Falling back to single-process mode ...");
    (function(d, script) {
        script = d.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = __SCRIPT_PATH__.path() + 'asmjs/perspective.js';
        d.getElementsByTagName('head')[0].appendChild(script);
    }(document));
}

/******************************************************************************
 *
 * API
 *
 */

function subscribe(method, cmd) {
    return function() {
        var handler = arguments[arguments.length - 1];
        var args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
        handler.keep_alive = true;
        this._worker.handlers[++this._worker.msg_id] = handler;
        var msg = {
            id: this._worker.msg_id,
            cmd: cmd || 'view_method',
            name: this._name,
            method: method,
            args: args,
            subscribe: true
        };
        if (this._worker.initialized.value) {
            this._worker.postMessage(msg);
        } else {
            this._worker.messages.push(msg);
        }
    }
}

function async_queue(method, cmd) {
    return function() {
        var args = Array.prototype.slice.call(arguments, 0, arguments.length);
        return new Promise(function(resolve) {
            this._worker.handlers[++this._worker.msg_id] = resolve;
            var msg = {
                id: this._worker.msg_id,
                cmd: cmd || 'view_method',
                name: this._name,
                method: method,
                args: args,
                subscribe: false
            };
            if (this._worker.initialized.value) {
                this._worker.postMessage(msg);
            } else {
                this._worker.messages.push(msg);
            }
        }.bind(this));
    };
}

function view(table_name, worker, config) {
    this._worker = worker;
    this._config = config;
    this._name = Math.random() + "";
    var msg = {
        cmd: 'view',
        view_name: this._name,
        table_name: table_name,
        config: config
    }
    if (this._worker.initialized.value) {
        this._worker.postMessage(msg);
    } else {
        this._worker.messages.push(msg);
    }
}

view.prototype.to_json = async_queue('to_json');

view.prototype.schema = async_queue('schema');

view.prototype.num_columns = async_queue('num_columns');

view.prototype.num_rows = async_queue('num_rows');

view.prototype.delete = async_queue('delete');

view.prototype.on_update = subscribe('on_update', 'view_method', true);

function table(worker, data, options) {
    this._name = Math.random() + "";
    this._worker = worker;
    var msg = {
        cmd: 'table',
        name: this._name,
        data: data,
        options: options
    }
    if (this._worker.initialized.value) {
        this._worker.postMessage(msg);
    } else {
        this._worker.messages.push(msg);
    }
}

table.prototype.view = function(config) {
    return new view(this._name, this._worker, config);
}

table.prototype.schema = async_queue('schema', 'table_method');

table.prototype.size = async_queue('size', 'table_method');

table.prototype.update = async_queue('update', 'table_method');

table.prototype.columns = async_queue('columns', 'table_method');

table.prototype.execute = function (f) {
    var msg = {
        cmd: 'table_execute',
        name: this._name,
        f: f.toString()
    }
    if (this._worker.initialized.value) {
        this._worker.postMessage(msg);
    } else {
        this._worker.messages.push(msg);
    }
}

function XHRWorker(url, ready, scope) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function() {
        var blob = new Blob([this.responseText]);
        var obj = window.URL.createObjectURL(blob);
        var worker = new Worker(obj);
        if (ready) {
            ready.call(scope, worker);
        }
    }, oReq);
    oReq.open("get", url, true);
    oReq.send();
}

function worker() {
    this._worker = {
        initialized: {value: false},
        msg_id: 0,
        handlers: {},
        messages: []
    };
    if (window.location.href.indexOf(__SCRIPT_PATH__.host()) > -1) {
        this._start_same_origin();
    } else {
        this._start_cross_origin();
    }
}

worker.prototype._start_cross_origin = function() {
    var dir = (typeof WebAssembly === "undefined" ? 'asmjs' : 'wasm_async');
    XHRWorker(__SCRIPT_PATH__.path() + dir + '/perspective.js', function(worker) {
        for (var key in this._worker) {
            worker[key] = this._worker[key];
        }
        this._worker.postMessage = worker.postMessage.bind(worker);
        this._worker.terminate = worker.terminate.bind(worker);
        this._worker = worker;
        this._worker.addEventListener('message', this._handle.bind(this));
        if (typeof WebAssembly === 'undefined') {
            this._start_cross_origin_asmjs();
        } else {
            this._start_cross_origin_wasm();
        }
    }, this);
};

worker.prototype._start_cross_origin_asmjs = function() {
    this._worker.postMessage({
        cmd: 'init',
        path: __SCRIPT_PATH__.path()
    });
}

worker.prototype._start_cross_origin_wasm = function() {
    var wasmXHR = new XMLHttpRequest();
    wasmXHR.open('GET', __SCRIPT_PATH__.path() + 'wasm_async/psp.wasm', true);
    wasmXHR.responseType = 'arraybuffer';
    wasmXHR.onload = function() {
        this._worker.postMessage({
            cmd: 'init',
            data: wasmXHR.response,
            path: __SCRIPT_PATH__.path()
        });
    }.bind(this);
    wasmXHR.send(null);
}

worker.prototype._start_same_origin = function() {
    var dir = (typeof WebAssembly === "undefined" ? 'asmjs' : 'wasm_async');
    var w =  new Worker(__SCRIPT_PATH__.path() + dir + '/perspective.js');
    for (var key in this._worker) {
        w[key] = this._worker[key];
    }
    this._worker = w;
    this._worker.addEventListener('message', this._handle.bind(this));
    this._worker.postMessage({cmd: 'init', path: __SCRIPT_PATH__.path()});
};

let _initialized = false;

worker.prototype._handle = function(e) {
    if (!this._worker.initialized.value) {
        if (_initialized) {
            var event = document.createEvent("Event");
            event.initEvent("perspective-ready", false, true);
            window.dispatchEvent(event);
            _initialized = true;
        }
        for (var m in this._worker.messages) {
            if (this._worker.messages.hasOwnProperty(m)) {
                this._worker.postMessage(this._worker.messages[m]);
            }
        }
        this._worker.initialized.value = true;
        this._worker.messages = [];
    }
    if (e.data.id) {
        var handler = this._worker.handlers[e.data.id];
        if (handler) {
            handler(e.data.data);
            if (!handler.keep_alive) {
                delete this._worker.handlers[e.data.id];
            }
        }
    }
};

worker.prototype.table = function(data, options) {
    return new table(this._worker, data, options);
};

worker.prototype.terminate = function() {
    this._worker.terminate();
    this._worker = undefined;
};

export default {
    worker: function() {
        if (window.location.href.indexOf(__SCRIPT_PATH__.host()) === -1 && detectIE()) {
            return perspective;
        }
        return new worker();
    },

    TYPE_AGGREGATES: TYPE_AGGREGATES,

    AGGREGATE_DEFAULTS: AGGREGATE_DEFAULTS
};