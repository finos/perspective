/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import load_perspective from "../../dist/pkg/web/perspective.cpp.js";
import perspective from "./perspective.js";

export default globalThis.perspective = perspective(load_perspective);
