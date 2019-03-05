/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import {domain} from "../axis/mainAxis";

export function seriesLinearRange(settings, data, valueName) {
    return d3.scaleLinear().domain(
        domain()
            .valueName(valueName)(data)
            .pad([0, 0])(data)
    );
}

export function seriesColourRange(settings, data, valueName) {
    return d3.scaleSequential(d3.interpolateViridis).domain(
        domain()
            .valueName(valueName)
            .pad([0, 0])(data)
    );
}
