/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * Custom Element lifecycle method.
 */
export function connectedCallback() {
    if (!this._toolbar) {
        this._toolbar = document.createElement(
            "perspective-viewer-datagrid-toolbar"
        );
    }

    this.parentElement.appendChild(this._toolbar);
}
