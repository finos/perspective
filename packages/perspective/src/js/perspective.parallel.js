/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as defaults from "./defaults.js";

import {worker} from "./API/worker.js";

import asmjs_worker from "./perspective.asmjs.js";
import wasm_worker from "./perspective.wasm.js";

import wasm from "./psp.async.wasm.js";

import {detect_iphone} from "./utils.js";

const HEARTBEAT_TIMEOUT = 15000;

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

/**
 * WebWorker extends Perspective's `worker` class and defines interactions using the WebWorker API.
 *
 * This class serves as the client API for transporting messages to/from Web Workers.
 */
class WebWorker extends worker {
    constructor() {
        super();
        this.register();
    }

    /**
     * When the worker is created, load either the ASM or WASM bundle depending on WebAssembly compatibility.
     */
    async register() {
        let _worker;
        const msg = {cmd: "init"};
        if (typeof WebAssembly === "undefined" || detect_iphone()) {
            _worker = await asmjs_worker();
        } else {
            [_worker, msg.buffer] = await Promise.all([override.worker(), override.wasm()]);
        }
        for (var key in this._worker) {
            _worker[key] = this._worker[key];
        }
        this._worker = _worker;
        this._worker.addEventListener("message", this._handle.bind(this));
        this._worker.postMessage(msg, [msg.buffer]);
        this._detect_transferable();
    }

    /**
     * Send a message from the worker, using transferables if necessary.
     *
     * @param {*} msg
     */
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

/**
 * Given a WebSocket URL, connect to the socket located at `url`.
 *
 * The `onmessage` handler receives incoming messages and sends it to the WebWorker through `this._handle`.
 *
 * If the message has a transferable asset, set the `pending_arrow` flag to tell the worker the next message is an ArrayBuffer.
 */
class WebSocketWorker extends worker {
    constructor(url) {
        super();
        this._ws = new WebSocket(url);
        this._ws.binaryType = "arraybuffer";
        this._ws.onopen = () => {
            this.send({id: -1, cmd: "init"});
        };
        const heartbeat = () => {
            this._ws.send("heartbeat");
            setTimeout(heartbeat, HEARTBEAT_TIMEOUT);
        };
        setTimeout(heartbeat, 15000);
        this._ws.onmessage = msg => {
            if (msg.data === "heartbeat") {
                return;
            }
            if (this._pending_arrow) {
                this._handle({data: {id: this._pending_arrow, data: msg.data}});
                delete this._pending_arrow;
            } else {
                msg = JSON.parse(msg.data);

                // If the `is_transferable` flag is set, the worker expects the
                // next message to be a transferable object.
                // This sets the `_pending_arrow` flag, which triggers a special
                // handler for the ArrayBuffer containing arrow data.
                if (msg.is_transferable) {
                    this._pending_arrow = msg.id;
                } else {
                    this._handle({data: msg});
                }
            }
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

/**
 * If Perspective is loaded with the `preload` attribute, pre-initialize
 * the worker so it is available at page render.
 */
if (document.currentScript && document.currentScript.hasAttribute("preload")) {
    WORKER_SINGLETON.getInstance();
}

const mod = {
    override: x => override.set(x),

    /**
     * Create a new WebWorker instance. If the `url` parameter is provided, load the worker
     * at `url` using a WebSocket.
     *s
     * @param {*} url
     */
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
