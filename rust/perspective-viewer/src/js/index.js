/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import "./dragdrop.js";
import init, * as internal from "../pkg/perspective_viewer.js";

const WASM_INTERNAL = import(
    /* webpackChunkName: "perspective-viewer.custom-element" */
    /* webpackMode: "eager" */
    "../pkg/perspective_viewer_bg.wasm"
);

async function init_wasm() {
    const {default: wasm_internal} = await WASM_INTERNAL;
    await init(wasm_internal);
    internal.set_panic_hook();
    return internal;
}

export const wasm = init_wasm();

let _index = undefined;
async function _await_index(f) {
    await new Promise(setTimeout);
    if (!_index) {
        _index = await wasm;
    }
    return f();
}

class PerspectiveViewerElement extends HTMLElement {
    constructor() {
        super();
        _await_index(() => {
            this._instance = new _index.PerspectiveViewerElement(this);
        });
    }

    connectedCallback() {
        _await_index(() => {
            this._instance.connected_callback();
        });
    }

    static registerPlugin(name) {
        _await_index(() => {
            _index.register_plugin(name);
        });
    }

    load(table) {
        return _await_index(() => this._instance.js_load(table));
    }

    notifyResize() {
        return _await_index(() => this._instance.js_resize());
    }

    getTable() {
        return _await_index(() => this._instance.js_get_table());
    }

    restore(...args) {
        return _await_index(() => this._instance.js_restore(...args));
    }

    flush() {
        return _await_index(() => this._instance.js_flush());
    }

    reset() {
        return _await_index(() => this._instance.js_reset());
    }

    save(...args) {
        return _await_index(() => this._instance.js_save(...args));
    }

    delete() {
        return _await_index(() => this._instance.js_delete());
    }

    download(...args) {
        return _await_index(() => this._instance.js_download(...args));
    }

    copy(...args) {
        return _await_index(() => this._instance.js_copy(...args));
    }

    getEditPort() {
        return _await_index(() => console.error("Not Implemented"));
    }

    setThrottle(...args) {
        return _await_index(() => this._instance.js_set_throttle(...args));
    }

    toggleConfig(force) {
        return _await_index(() => this._instance.js_toggle_config(force));
    }

    get_plugin(name) {
        return _await_index(() => this._instance.js_get_plugin(name));
    }

    get_all_plugins() {
        return _await_index(() => this._instance.js_get_all_plugins());
    }
}

if (document.createElement("perspective-viewer").constructor === HTMLElement) {
    window.customElements.define("perspective-viewer", PerspectiveViewerElement);
}

class PerspectiveColumnStyleElement extends HTMLElement {
    constructor() {
        super();
    }

    open(target, config, default_config) {
        _await_index(() => {
            if (this._instance) {
                this._instance.reset(config, default_config);
            } else {
                this._instance = new _index.PerspectiveColumnStyleElement(this, config, default_config);
            }

            this._instance.open(target);
        });
    }
}

if (document.createElement("perspective-column-style").constructor === HTMLElement) {
    window.customElements.define("perspective-column-style", PerspectiveColumnStyleElement);
}
