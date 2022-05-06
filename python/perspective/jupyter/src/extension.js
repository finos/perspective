/* eslint-disable no-underscore-dangle */
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Entry point for the notebook bundle containing custom model definitions.
//
// Setup notebook base URL
//
// Some static assets may be required by the custom widget javascript. The base
// url for the notebook is not known at build time and is therefore computed
// dynamically.
window.__webpack_public_path__ = `${document
    .querySelector("body")
    .getAttribute("data-base-url")}nbextensions/finos-perspective`;

import plugins from "@finos/perspective-jupyterlab/dist/umd/perspective-nbextension";
export default plugins;
