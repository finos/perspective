/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export * from "./client";
export * from "./model";
export * from "./version";
export * from "./view";
export * from "./widget";

import "../../less/index.less";

// FIXME index.out.jss:602 DOMException: Failed to execute 'define' on 'CustomElementRegistry': the name "perspective-viewer-datagrid" has already been used with this registry
// import "@finos/perspective-viewer-datagrid";
// import "@finos/perspective-viewer-d3fc";

// NOTE: only expose the widget here
import {PerspectiveJupyterPlugin} from "./plugin";

let plugins = [PerspectiveJupyterPlugin];

// Conditionally import renderers if running in jupyterlab only
if (window && window._JUPYTERLAB) {
    const {PerspectiveRenderers} = require("./renderer");
    plugins.push(PerspectiveRenderers);
}

export default plugins;
