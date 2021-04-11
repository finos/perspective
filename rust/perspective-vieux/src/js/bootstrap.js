/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import init, * as internal from "../../pkg/perspective_vieux.js";
import wasm_internal from "../../pkg/perspective_vieux_bg.wasm";

export const wasm = init(wasm_internal).then(() => {
    internal.set_panic_hook();
    return internal;
});

let _index = undefined;
async function _await_index(f) {
    await new Promise(setTimeout);
    if (!_index) {
        _index = await wasm;
    }
    return f();
}

// function handle_view_errors(e) {
//     if (e.message !== "View is not initialized") {
//         throw e;
//     }
// }

class PerspectiveVieuxElement extends HTMLElement {
    constructor() {
        super();
        _await_index(() => {
            this._instance = new _index.PerspectiveVieuxElement(this);
        });
    }

    connectedCallback() {
        _await_index(() => {
            this._instance.connected_callback();
        });
    }

    load(table) {
        _await_index(() => this._instance.load(table));
    }

    set_view(view) {
        _await_index(() => this._instance.set_view(view));
    }

    delete_view() {
        return _await_index(() => this._instance.delete_view());
    }

    toggle_config(force) {
        return _await_index(() => this._instance.toggle_config(force));
    }
}

if (document.createElement("perspective-vieux").constructor === HTMLElement) {
    window.customElements.define("perspective-vieux", PerspectiveVieuxElement);
}
