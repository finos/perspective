/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {ExportDropDownMenuElement} from "@finos/perspective-viewer/dist/pkg/perspective_viewer.js";

class HTMLPerspectiveExportDropDownMenuElement extends HTMLElement {
    private instance: ExportDropDownMenuElement;

    constructor() {
        super();
        this.instance = new ExportDropDownMenuElement(this);
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
    document.createElement("perspective-export-menu").constructor ===
    HTMLElement
) {
    window.customElements.define(
        "perspective-export-menu",
        HTMLPerspectiveExportDropDownMenuElement
    );
}
