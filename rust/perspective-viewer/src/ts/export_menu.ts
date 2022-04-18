/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {CopyDropDownMenuElement} from "@finos/perspective-viewer/dist/pkg/perspective_viewer.js";

class HTMLPerspectiveCopyDropDownMenuElement extends HTMLElement {
    private instance: CopyDropDownMenuElement;

    constructor() {
        super();
        this.instance = new CopyDropDownMenuElement(this);
    }

    open(target: HTMLElement) {
        this.instance.open(target);
    }

    // destroy() {
    //     this.instance.destroy();
    // }

    unsafe_set_model(ptr: number) {
        this.instance.unsafe_set_model(ptr);
    }
}

if (
    document.createElement("perspective-copy-menu").constructor === HTMLElement
) {
    console.log("WIP");
    window.customElements.define(
        "perspective-copy-menu",
        HTMLPerspectiveCopyDropDownMenuElement
    );
}
