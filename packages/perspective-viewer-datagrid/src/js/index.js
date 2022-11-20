/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "regular-table";

import MATERIAL_STYLE from "../less/regular_table.less";
import { HTMLPerspectiveViewerDatagridPluginElement } from "./custom_elements/datagrid.js";
import { HTMLPerspectiveViewerDatagridToolbarElement } from "./custom_elements/toolbar.js";

/**
 * Appends the default table CSS to `<head>`, should be run once on module
 * import.
 *
 */
function _register_global_styles() {
    const style = document.createElement("style");
    style.textContent = MATERIAL_STYLE;
    document.head.insertBefore(style, document.head.firstChild);
}

/******************************************************************************
 *
 * Main
 *
 */

async function _register_element() {
    customElements.define(
        "perspective-viewer-datagrid-toolbar",
        HTMLPerspectiveViewerDatagridToolbarElement
    );

    customElements.define(
        "perspective-viewer-datagrid",
        HTMLPerspectiveViewerDatagridPluginElement
    );

    await customElements.whenDefined("perspective-viewer");
    customElements
        .get("perspective-viewer")
        .registerPlugin("perspective-viewer-datagrid");
}

_register_element();
_register_global_styles();
