/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
/* css */
import "../less/index.less";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import {PerspectiveView} from "./view";
import {PerspectiveModel} from "./model";

module.exports = {
    PerspectiveModel,
    PerspectiveView
}
