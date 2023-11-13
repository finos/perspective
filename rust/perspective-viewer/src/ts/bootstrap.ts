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

import { WASM_MODULE } from "./init";
import { PerspectiveViewerElement } from "../../dist/pkg/perspective.js";

// This can be done automatically by enabling the `define_web_components_async`
// feature, but due to async loading, `<perspective-viewer>` methods will not be
// available synchronously - this can be mitigated with
// `customElements.whenDefined()`, but this is a breaking change.
class HTMLPerspectiveViewerElement extends HTMLElement {
    _instance: PerspectiveViewerElement;
    constructor() {
        super();
        this.__load_wasm();
    }

    async __load_wasm() {
        await WASM_MODULE;
        if (this._instance === undefined) {
            this._instance = new PerspectiveViewerElement(this);
        }
    }
}

function transplantElement(rsObject, jsObject, name) {
    const proto = rsObject.prototype;
    const names = Object.getOwnPropertyNames(proto);
    for (const key of names) {
        Object.defineProperty(jsObject.prototype, key, {
            value: async function (...args) {
                await this.__load_wasm();
                return await this._instance[key].call(this._instance, ...args);
            },
        });
    }
    customElements.define(name, jsObject);
}

for (const key of ["registerPlugin", "getExprTKCommands"]) {
    Object.defineProperty(HTMLPerspectiveViewerElement, key, {
        value: async function (...args) {
            const mod = await WASM_MODULE;
            return mod[key].call(mod, ...args);
        },
    });
}

transplantElement(
    PerspectiveViewerElement,
    HTMLPerspectiveViewerElement,
    "perspective-viewer"
);
