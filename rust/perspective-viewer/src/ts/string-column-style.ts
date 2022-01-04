/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {PerspectiveStringColumnStyleElement} from "@finos/perspective-viewer/dist/pkg/perspective_viewer.js";

class HTMLPerspectiveColumnStyleElement extends HTMLElement {
    private instance: PerspectiveStringColumnStyleElement;

    constructor() {
        super();
    }

    async open(
        target: HTMLElement,
        config: any,
        default_config: any
    ): Promise<void> {
        if (this.instance) {
            this.instance.reset(config);
        } else {
            this.instance = new PerspectiveStringColumnStyleElement(
                this,
                config,
                default_config
            );
        }

        this.instance.open(target);
    }

    destroy() {
        this.instance.destroy();
    }
}

if (
    document.createElement("perspective-string-column-style").constructor ===
    HTMLElement
) {
    window.customElements.define(
        "perspective-string-column-style",
        HTMLPerspectiveColumnStyleElement
    );
}
