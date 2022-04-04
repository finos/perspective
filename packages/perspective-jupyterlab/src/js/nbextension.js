/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
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

export * from "./client";
export * from "./model";
export * from "./version";
export * from "./view";
export * from "./widget";

/* css */
import "../less/index.less";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import {PerspectiveJupyterPlugin} from "./plugin";

// NOTE: Exclude the renderers as these rely on JupyterLab
const plugins = [PerspectiveJupyterPlugin];
export default plugins;
