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

    get_plugin() {
        return _await_index(() => this._instance.get_plugin());
    }

    set_plugin(name) {
        return _await_index(() => this._instance.set_plugin(name));
    }

    set_plugin_default() {
        return _await_index(() => this._instance.set_plugin_default());
    }

    _open_expression_editor(target) {
        return _await_index(() => this._instance._open_expression_editor(target));
    }
}

if (document.createElement("perspective-vieux").constructor === HTMLElement) {
    window.customElements.define("perspective-vieux", PerspectiveVieuxElement);
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
