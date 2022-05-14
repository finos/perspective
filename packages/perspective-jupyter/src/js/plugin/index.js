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

import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import {PerspectiveJupyterPlugin} from "./plugin";

const plugins = [PerspectiveJupyterPlugin];
export default plugins;
