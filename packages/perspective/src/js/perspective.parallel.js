/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as defaults from "./defaults.js";

import {worker} from "./api.js";

import asmjs_worker from "./perspective.asmjs.js";
import wasm_worker from "./perspective.wasm.js";

import wasm from "./psp.async.wasm.js";

/******************************************************************************
 *
 * Utilities
 *
 */

// https://github.com/kripken/emscripten/issues/6042
function detect_iphone() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Singleton WASM file download cache.
 */
const override = new class {
    _fetch(url) {
        return new Promise(resolve => {
            let wasmXHR = new XMLHttpRequest();
            wasmXHR.open("GET", url, true);
            wasmXHR.responseType = "arraybuffer";
            wasmXHR.onload = () => {
                resolve(wasmXHR.response);
            };
            wasmXHR.send(null);
        });
    }

    set({wasm, worker}) {
        this._wasm = wasm || this._wasm;
        this._worker = worker || this._worker;
    }

    worker() {
        return (this._worker || wasm_worker)();
    }

    async wasm() {
        if (!this._wasm) {
            this._wasm = await this._fetch(wasm);
        }
        return this._wasm;
    }
}();

class WebWorker extends worker {
    constructor() {
        super();
        this.register();
    }

    async register() {
        let worker;
        const msg = {cmd: "init"};
        if (typeof WebAssembly === "undefined" || detect_iphone()) {
            worker = await asmjs_worker();
        } else {
            [worker, msg.buffer] = await Promise.all([override.worker(), override.wasm()]);
        }
        for (var key in this._worker) {
            worker[key] = this._worker[key];
        }
        this._worker = worker;
        this._worker.addEventListener("message", this._handle.bind(this));
        this._worker.postMessage(msg, [msg.buffer]);
        this._detect_transferable();
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

/******************************************************************************
 *
 * Web Worker Singleton
 *
 */

const WORKER_SINGLETON = (function() {
    let __WORKER__;
    return {
        getInstance: function() {
            if (__WORKER__ === undefined) {
                __WORKER__ = new WebWorker();
            }
            return __WORKER__;
        }
    };
})();

if (document.currentScript && document.currentScript.hasAttribute("preload")) {
    WORKER_SINGLETON.getInstance();
}

const mod = {
    override: x => override.set(x),

    worker(url) {
        if (url) {
            return new WebSocketWorker(url);
        } else {
            return new WebWorker();
        }
    },

    shared_worker() {
        return WORKER_SINGLETON.getInstance();
    }
};

for (let prop of Object.keys(defaults)) {
    mod[prop] = defaults[prop];
}

export default mod;
