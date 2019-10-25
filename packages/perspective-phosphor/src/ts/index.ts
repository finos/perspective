/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
export * from "./widget";
export * from "./utils";
export * from "./dockpanel";
export * from "./workspace";

import {PerspectiveWorkspace} from "./workspace";
import {PerspectiveDockPanel} from "./dockpanel";
import {PerspectiveWidget} from "./widget";

// default export for umd build
export default {PerspectiveWorkspace, PerspectiveDockPanel, PerspectiveWidget}
