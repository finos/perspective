/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {WASM_MODULE} from "./init";
import {PerspectiveViewerElement} from "@finos/perspective-viewer/dist/pkg/perspective_viewer.js";

// This can be done automatically by enabling the `defin_web_components_async`
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

const proto = PerspectiveViewerElement.prototype;
const names = Object.getOwnPropertyNames(proto);
for (const key of names) {
    Object.defineProperty(HTMLPerspectiveViewerElement.prototype, key, {
        value: async function (...args) {
            await this.__load_wasm();
            return await this._instance[key].call(this._instance, ...args);
        },
    });
}

for (const key of ["registerPlugin", "getExprTKCommands"]) {
    Object.defineProperty(HTMLPerspectiveViewerElement, key, {
        value: async function (...args) {
            const mod = await WASM_MODULE;
            return mod[key].call(mod, ...args);
        },
    });
}

customElements.define("perspective-viewer", HTMLPerspectiveViewerElement);
