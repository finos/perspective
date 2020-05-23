/******************************************************************************
 *
 * Copyright (c) 2020, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {JupyterFrontEndPlugin} from "@jupyterlab/application";
import {perspectiveRenderers} from "./renderer";
import {PerspectiveJupyterPlugin} from "./plugin";

/**
 * Export the renderer as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [PerspectiveJupyterPlugin, perspectiveRenderers];
export default plugins;
