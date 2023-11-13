// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import * as defaults from "./config/constants.js";
import { get_config, get_type_config as _get_type_config } from "./config";
import { Client } from "./api/client.js";
import { WebSocketClient } from "./websocket/client";
import { override_config } from "./config/index.js";

import wasm_worker from "../../src/js/perspective.worker.js";
import wasm from "../../dist/pkg/web/perspective.cpp.wasm";

let IS_INLINE = false;

/**
 * Singleton WASM file download cache.
 */
const _override = /* @__PURE__ */ (function () {
    let _instance;
    return function () {
        if (!_instance) {
            _instance = new (class {
                async worker() {
                    return await wasm_worker();
                }

                async wasm() {
                    let _wasm = await wasm;
                    if (_wasm instanceof ArrayBuffer && !_wasm.buffer) {
                        _wasm = new Uint8Array(_wasm);
                    }

                    if (_wasm.buffer && _wasm.buffer instanceof ArrayBuffer) {
                        IS_INLINE = true;
                        length = _wasm.byteLength;
                        this._wasm = _wasm;
                    } else if (_wasm instanceof ArrayBuffer) {
                        length = _wasm.byteLength;
                        this._wasm = new Uint8Array(_wasm);
                    } else {
                        const resp = await fetch(_wasm);
                        this._wasm = await resp.arrayBuffer();
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
        const msg = { cmd: "init", config: get_config() };
        if (typeof WebAssembly === "undefined") {
            throw new Error("WebAssembly not supported.");
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

    get transferable() {
        return this._worker?.transferable || false;
    }

    get inline() {
        return IS_INLINE;
    }

    _detect_transferable() {
        var ab = new ArrayBuffer(1);
        this._worker.postMessage(ab, [ab]);
        this._worker.transferable = ab.byteLength === 0;
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

export const get_type_config = _get_type_config;

export function override(x) {
    return _override().set(x);
}

/**
 * Create a new WebWorkerClient instance.
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

/**
 * Return the shared worker, the original WebWorkerClient created during module
 * load.
 * @param {*} [config] An optional perspective config object override
 */
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
