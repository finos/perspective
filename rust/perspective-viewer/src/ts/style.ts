/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import * as internal from "../../dist/pkg/perspective_viewer.js";

class PerspectiveColumnStyleElement extends HTMLElement {
    private instance: internal.PerspectiveColumnStyleElement;

    constructor() {
        super();
    }

    async open(
        target: HTMLElement,
        config: any,
        default_config: any
    ): Promise<void> {
        if (this.instance) {
            this.instance.reset(config, default_config);
        } else {
            this.instance = new internal.PerspectiveColumnStyleElement(
                this,
                config,
                default_config
            );
        }

        this.instance.open(target);
    }
}

if (
    document.createElement("perspective-column-style").constructor ===
    HTMLElement
) {
    window.customElements.define(
        "perspective-column-style",
        PerspectiveColumnStyleElement
    );
}
