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
__webpack_public_path__ = window.__webpack_public_path__ = `${document
    .querySelector("body")
    .getAttribute("data-base-url")}nbextensions/@finos/perspective-jupyterlab`; // Configure requirejs

if (window.require) {
    window.require.config({
        map: {
            "*": {
                "@finos/perspective-jupyterlab":
                    "nbextensions/@finos/perspective-jupyterlab/index",
            },
        },
    });
} // Export the required load_ipython_extension

export default {
    load_ipython_extension: function () {},
};
