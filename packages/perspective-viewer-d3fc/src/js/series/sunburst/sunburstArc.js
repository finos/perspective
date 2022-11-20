/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { arc } from "d3";

export const drawArc = (radius) =>
    arc()
        .startAngle((d) => d.x0)
        .endAngle((d) => d.x1)
        .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius)
        .innerRadius((d) => Math.max(1, (d.y0 - 1) * radius))
        .outerRadius((d) =>
            Math.max((d.y0 - 1) * radius, (d.y1 - 1) * radius - 1)
        );

export const arcVisible = (d) => d.y0 >= 1 && d.x1 > d.x0;
