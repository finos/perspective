/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as defaults from "./config/constants.js";
import {get_config, get_type_config as _get_type_config} from "./config";
import {Client} from "./api/client.js";
import {WebSocketClient} from "./websocket/client";

import {override_config} from "./config/index.js";

import wasm_worker from "@finos/perspective/src/js/perspective.worker.js";
import wasm from "@finos/perspective/dist/pkg/esm/perspective.cpp.wasm";

// eslint-disable-next-line max-len
const INLINE_WARNING = `Perspective has been compiled in INLINE mode.  While \
Perspective's runtime performance is not affected, you may see smaller assets \
size and faster engine initial load time using "file-loader" to build your
application.
https://perspective.finos.org/docs/md/js.html`;

/**
 * Singleton WASM file download cache.
 */
const _override = /* @__PURE__ */ (function () {
    let _instance;
    return function () {
        if (!_instance) {
            _instance = new (class {
                worker() {
                    return wasm_worker();
                }

                async wasm() {
                    const _wasm = wasm;
                    if (_wasm.buffer && _wasm.buffer instanceof ArrayBuffer) {
                        console.warn(INLINE_WARNING);
                        this._wasm = _wasm;
                    } else {
                        const req = await fetch(_wasm);
                        this._wasm = await req.arrayBuffer();
                    }
                    return this._wasm;
                }
            })();
        }

        return _instance;
    };
})();

/**
 * WebWorker extends Perspective's `worker` class and defines interactions using
 * the WebWorker API.
 *
 * This class serves as the client API for transporting messages to/from Web
 * Workers.
 */
class WebWorkerClient extends Client {
    constructor(config) {
        if (config) {
            override_config(config);
        }
        super();
        this.register();
    }

    /**
     * When the worker is created, load either the ASM or WASM bundle depending
     * on WebAssembly compatibility.  Don't use transferrable so multiple
     * workers can be instantiated.
     */
    async register() {
        let _worker;
        const msg = {cmd: "init", config: get_config()};
        if (typeof WebAssembly === "undefined") {
            throw new Error(
                "WebAssembly not supported. Support for ASM.JS has been removed as of 0.3.1."
            );
        } else {
            [_worker, msg.buffer] = await Promise.all([
                _override().worker(),
                _override().wasm(),
            ]);
        }
        for (var key in this._worker) {
            _worker[key] = this._worker[key];
        }
        this._worker = _worker;
        this._worker.addEventListener("message", this._handle.bind(this));
        this._worker.postMessage(msg);
        this._detect_transferable();
    }

    /**
     * Send a message from the worker, using transferables if necessary.
     *
     * @param {*} msg
     */
    send(msg) {
        if (
            this._worker.transferable &&
            msg.args &&
            msg.args[0] instanceof ArrayBuffer
        ) {
            this._worker.postMessage(msg, [msg.args[0]]);
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
            console.debug("Transferable support detected");
        }
    }
}

/******************************************************************************
 *
 * Web Worker Singleton
 *
 */

const WORKER_SINGLETON = /* @__PURE__ */ (function () {
    let __WORKER__, __CONFIG__;
    return {
        getInstance: function (config) {
            if (__WORKER__ === undefined) {
                __WORKER__ = new WebWorkerClient(config);
            }
            const config_str = JSON.stringify(config);
            if (__CONFIG__ && config_str !== __CONFIG__) {
                throw new Error(
                    `Configuration object for shared_worker() has changed - this is probably a bug in your application.`
                );
            }
            __CONFIG__ = config_str;
            return __WORKER__;
        },
    };
})();

/**
 * If Perspective is loaded with the `preload` attribute, pre-initialize the
 * worker so it is available at page render.
 */
if (document.currentScript && document.currentScript.hasAttribute("preload")) {
    WORKER_SINGLETON.getInstance();
}

export const get_type_config = _get_type_config;

export function override(x) {
    return _override().set(x);
}

/**
 * Create a new WebWorkerClient instance. s
 * @param {*} [config] An optional perspective config object override
 */
export function worker(config) {
    return new WebWorkerClient(config);
}

/**
 * Create a new WebSocketClient instance. The `url` parameter is provided,
 * load the worker at `url` using a WebSocket. s
 * @param {*} url Defaults to `window.location.origin`
 * @param {*} [config] An optional perspective config object override
 */
export function websocket(url = window.location.origin.replace("http", "ws")) {
    return new WebSocketClient(new WebSocket(url));
}

export function shared_worker(config) {
    return WORKER_SINGLETON.getInstance(config);
}

export default {
    override,
    worker,
    websocket,
    shared_worker,
    ...Object.keys(defaults),
};
