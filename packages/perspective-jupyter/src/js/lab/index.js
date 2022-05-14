/******************************************************************************
 *
 * Copyright (c) 2022, the perspective authors.
 *
 * This file is part of the perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// NOTE: this file only exists to compile the jupyterlab prebuilt extension,
// it should not be published and as such does not product a dist/umd
// output

import "@finos/perspective-jupyterlab/dist/umd/perspective-jupyterlab.css";
import plugins from "@finos/perspective-jupyterlab";
export default plugins;
