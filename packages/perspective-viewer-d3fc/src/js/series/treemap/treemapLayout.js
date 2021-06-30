/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";

export default (width, height) => {
    const treemapLayout = d3
        .treemap()
        .size([width, height])
        .paddingInner(d => 1 + 2 * (d.height - 1));

    treemapLayout.tile(d3.treemapBinary);

    return treemapLayout;
};
