/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

export const wasm = import("./index.js");

let _index = undefined;
async function _await_index(f) {
    if (!_index) {
        _index = await wasm;
    }
    return f();
}

function handle_view_errors(e) {
    if (e.message !== "View is not initialized") {
        throw e;
    }
}

class PerspectiveStatusBarElement extends HTMLElement {
    constructor() {
        super();
        _await_index(() => {
            this._instance = new _index.StatusBarElement(this);
        });
    }

    set_view(...args) {
        return _await_index(() => this._instance.set_view(...args).catch(handle_view_errors));
    }

    set_table(...args) {
        return _await_index(() => this._instance.set_table(...args));
    }

    remove_on_update_callback(...args) {
        return _await_index(() => this._instance.remove_on_update_callback(...args));
    }
}

if (document.createElement("perspective-statusbar").constructor === HTMLElement) {
    window.customElements.define("perspective-statusbar", PerspectiveStatusBarElement);
}
