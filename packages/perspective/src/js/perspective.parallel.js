/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {ScriptPath} from "./utils.js";

import {TYPE_AGGREGATES, AGGREGATE_DEFAULTS, TYPE_FILTERS, FILTER_DEFAULTS, SORT_ORDERS} from "./defaults.js";

import {worker} from "./api.js";

/******************************************************************************
 *
 * Utilities
 *
 */

var __SCRIPT_PATH__ = new ScriptPath();

// https://github.com/kripken/emscripten/issues/6042
function detect_iphone() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function XHRWorker(url, ready, scope) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener(
        "load",
        function() {
            var blob = new Blob([this.responseText]);
            var obj = window.URL.createObjectURL(blob);
            var worker = new Worker(obj);
            if (ready) {
                ready.call(scope, worker);
            }
        },
        oReq
    );
    oReq.open("get", url, true);
    oReq.send();
}

class WebWorker extends worker {
    constructor() {
        super();
        if (window.__PSP_WORKER__) {
            this._start_embedded();
        } else if (window.location.origin === __SCRIPT_PATH__.host().slice(0, window.location.origin.length)) {
            this._start_same_origin();
        } else {
            this._start_cross_origin();
        }
    }

    send(msg) {
        if (this._worker.transferable && msg.args && msg.args[0] instanceof ArrayBuffer) {
            this._worker.postMessage(msg, msg.args);
        } else {
            this._worker.postMessage(msg);
        }
    }

    terminate() {
        this._worker.terminate();
        this._worker = undefined;
    }

    _detect_transferable() {
        var ab = new ArrayBuffer(1);
        this._worker.postMessage(ab, [ab]);
        this._worker.transferable = ab.byteLength === 0;
        if (!this._worker.transferable) {
            console.warn("Transferable support not detected");
        } else {
            console.log("Transferable support detected");
        }
    }

    _start_embedded() {
        console.log("Running PSP in embedded mode");
        var w = new window.__PSP_WORKER__();
        for (var key in this._worker) {
            w[key] = this._worker[key];
        }
        this._worker = w;
        this._worker.addEventListener("message", this._handle.bind(this));
        this._worker.postMessage({cmd: "init", data: window.__PSP_WASM__, path: __SCRIPT_PATH__.path()});
        this._detect_transferable();
    }

    _start_cross_origin() {
        var dir = typeof WebAssembly === "undefined" ? "asmjs" : "async";
        XHRWorker(
            __SCRIPT_PATH__.path() + "perspective.worker." + dir + ".js",
            function(worker) {
                for (var key in this._worker) {
                    worker[key] = this._worker[key];
                }
                this._worker.postMessage = worker.postMessage.bind(worker);
                this._worker.terminate = worker.terminate.bind(worker);
                this._worker = worker;
                this._detect_transferable();
                this._worker.addEventListener("message", this._handle.bind(this));
                if (typeof WebAssembly === "undefined") {
                    this._start_cross_origin_asmjs();
                } else {
                    this._start_cross_origin_wasm();
                }
            },
            this
        );
    }

    _start_cross_origin_asmjs() {
        this._worker.postMessage({
            cmd: "init",
            path: __SCRIPT_PATH__.path()
        });
    }

    _start_cross_origin_wasm() {
        var wasmXHR = new XMLHttpRequest();
        wasmXHR.open("GET", __SCRIPT_PATH__.path() + "psp.async.wasm", true);
        wasmXHR.responseType = "arraybuffer";
        wasmXHR.onload = () => {
            let msg = {
                cmd: "init",
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

    _start_same_origin() {
        var dir = typeof WebAssembly === "undefined" || detect_iphone() ? "asmjs" : "async";
        var w = new Worker(__SCRIPT_PATH__.path() + "perspective.worker." + dir + ".js");
        for (var key in this._worker) {
            w[key] = this._worker[key];
        }
        this._worker = w;
        this._worker.addEventListener("message", this._handle.bind(this));
        this._worker.postMessage({cmd: "init", path: __SCRIPT_PATH__.path()});
        this._detect_transferable();
    }
}

class WebSocketWorker extends worker {
    constructor(url) {
        super();
        this._ws = new WebSocket(url);
        this._ws.onopen = () => {
            this.send({id: -1, cmd: "init"});
        };
        this._ws.onmessage = msg => {
            this._handle({data: JSON.parse(msg.data)});
        };
    }

    send(msg) {
        this._ws.send(JSON.stringify(msg));
    }

    terminate() {
        this._ws.close();
    }
}

export default {
    worker: function(url) {
        if (url) {
            return new WebSocketWorker(url);
        } else {
            return new WebWorker();
        }
    },

    TYPE_AGGREGATES: TYPE_AGGREGATES,

    TYPE_FILTERS: TYPE_FILTERS,

    AGGREGATE_DEFAULTS: AGGREGATE_DEFAULTS,

    FILTER_DEFAULTS: FILTER_DEFAULTS,

    SORT_ORDERS: SORT_ORDERS
};
