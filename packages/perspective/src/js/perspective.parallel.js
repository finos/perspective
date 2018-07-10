/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {detectIE, ScriptPath} from "./utils.js";

import {TYPE_AGGREGATES, AGGREGATE_DEFAULTS, TYPE_FILTERS, FILTER_DEFAULTS, SORT_ORDERS} from "./defaults.js";

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
        var resolve = arguments[arguments.length - 1];
        var args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
        this._worker.handlers[++this._worker.msg_id] = {resolve, reject: () => {}, keep_alive: true};
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
            this._worker.messages.push(() => this._worker.postMessage(msg));
        }
    }
}

function async_queue(method, cmd) {
    return function() {
        var args = Array.prototype.slice.call(arguments, 0, arguments.length);
        return new Promise(function(resolve, reject) {
            this._worker.handlers[++this._worker.msg_id] = {resolve, reject};
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
                this._worker.messages.push(() => this._worker.postMessage(msg));
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
        this._worker.messages.push(() => this._worker.postMessage(msg));
    }
}

view.prototype.to_json = async_queue('to_json');

view.prototype.to_csv = async_queue('to_csv');

view.prototype.schema = async_queue('schema');

view.prototype.num_columns = async_queue('num_columns');

view.prototype.num_rows = async_queue('num_rows');

view.prototype.expand_to_depth = async_queue('expand_to_depth');

view.prototype.collapse_to_depth = async_queue('collapse_to_depth');

view.prototype.get_row_expanded = async_queue('get_row_expanded');

view.prototype.open = async_queue('open');

view.prototype.close = async_queue('close');

view.prototype.delete = async_queue('delete');

view.prototype.on_update = subscribe('on_update', 'view_method', true);

view.prototype.on_delete = subscribe('on_delete', 'view_method', true);


function table(worker, name) {
    this._name = name;
    this._worker = worker;
}

table.prototype.add_computed = function(computed) {
    let name = Math.random() + "";
    let original = this._name;
    // serialize functions
    for (let i = 0; i < computed.length; ++i) {
        let column = computed[i];
        let func = column['func'];
        if (typeof func == "function") {
            column['func'] = func.toString();
        }
    }
    var msg = {
        cmd: 'add_computed',
        original: original,
        name: name,
        computed: computed
    };
    if (this._worker.initialized.value) {
        this._worker.postMessage(msg);
    } else {
        this._worker.messages.push(() => this._worker.postMessage(msg));
    }
    return new table(this._worker, name);
}

table.prototype.worker = function () {
    return this._worker;
}

table.prototype.view = function (config) {
    return new view(this._name, this._worker, config);
}

table.prototype.schema = async_queue('schema', 'table_method');

table.prototype.size = async_queue('size', 'table_method');

table.prototype.columns = async_queue('columns', 'table_method');

table.prototype.delete = async_queue('delete', "table_method");

table.prototype.on_delete = subscribe('on_delete', 'table_method', true);

table.prototype.remove = async_queue('remove', "table_method");

table.prototype.update = function(data) {
    return new Promise( (resolve, reject) => {
        this._worker.handlers[++this._worker.msg_id] = {resolve, reject};
        var msg = {
            id: this._worker.msg_id,
            name: this._name,
            cmd: 'table_method',
            method: 'update',
            args: [data],
        };
        let post = () => {
            if (this._worker.transferable && data instanceof ArrayBuffer) {
                this._worker.postMessage(msg, [data]);
            } else {
                this._worker.postMessage(msg);
            }
        };
        if (this._worker.initialized.value) {
            post();
        } else {
            this._worker.messages.push(post);
        }
    });
}


table.prototype.execute = function (f) {
    var msg = {
        cmd: 'table_execute',
        name: this._name,
        f: f.toString()
    }
    if (this._worker.initialized.value) {
        this._worker.postMessage(msg);
    } else {
        this._worker.messages.push(() => this._worker.postMessage(msg));
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
        transferable: false,
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

worker.prototype._detect_transferable = function() {
    var ab = new ArrayBuffer(1);
    this._worker.postMessage(ab, [ab]);
    this._worker.transferable = (ab.byteLength === 0);
    if (!this._worker.transferable) {
        console.warn('Transferables are not supported in your browser!');
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
        this._detect_transferable();
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
    wasmXHR.onload = () => {
        let msg = {
            cmd: 'init',
            data: wasmXHR.response,
            path: __SCRIPT_PATH__.path()
        };
        if (this._worker.transferable) {
            this._worker.postMessage(msg, [wasmXHR.response]);
        } else {
            this._worker.postMessage(msg);
        }
    };
    wasmXHR.send(null);
}

// https://github.com/kripken/emscripten/issues/6042
function detect_iphone() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

worker.prototype._start_same_origin = function() {
    var dir = (typeof WebAssembly === "undefined" || detect_iphone() ? 'asmjs' : 'wasm_async');
    var w =  new Worker(__SCRIPT_PATH__.path() + dir + '/perspective.js');
    for (var key in this._worker) {
        w[key] = this._worker[key];
    }
    this._worker = w;
    this._worker.addEventListener('message', this._handle.bind(this));
    this._worker.postMessage({cmd: 'init', path: __SCRIPT_PATH__.path()});
    this._detect_transferable();
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
    // Set up msg
    name = Math.random() + "";
    var msg = {
        cmd: 'table',
        name: name,
        data: data,
        options: options || {}
    };
    let post = () => {
        if (this._worker.transferable && data instanceof ArrayBuffer) {
            this._worker.postMessage(msg, [data]);
        } else {
            this._worker.postMessage(msg);
        }
    };
    if (this._worker.initialized.value) {
        post();
    } else {
        this._worker.messages.push(post);
    }
    return new table(this._worker, name);
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

    TYPE_FILTERS: TYPE_FILTERS,

    AGGREGATE_DEFAULTS: AGGREGATE_DEFAULTS,

    FILTER_DEFAULTS: FILTER_DEFAULTS,

    SORT_ORDERS: SORT_ORDERS
};
