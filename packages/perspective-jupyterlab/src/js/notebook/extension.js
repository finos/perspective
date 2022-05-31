/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/* eslint-disable no-underscore-dangle */

// This file contains the javascript that is run when the notebook is loaded.
// It contains some requirejs configuration and the `load_ipython_extension`
// which is required for any notebook extension.
//
// Some static assets may be required by the custom widget javascript. The base
// url for the notebook is not known at build time and is therefore computed
// dynamically.

import THEMES from "../../../dist/css/index.css";

if (window.require) {
    window.require.config({
        map: {
            "*": {
                "@finos/perspective-jupyterlab":
                    "nbextensions/@finos/perspective-jupyterlab/index",
            },
        },
    });
}

// Export the required load_ipython_extension
export function load_ipython_extension() {
    const style = document.createElement("style");
    style.textContent = THEMES;
    document.head.appendChild(style);
}
