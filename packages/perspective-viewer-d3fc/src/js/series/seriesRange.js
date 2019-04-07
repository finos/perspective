/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import {domain} from "../axis/linearAxis";

export function seriesLinearRange(settings, data, valueName) {
    return d3.scaleLinear().domain(
        domain()
            .valueName(valueName)
            .pad([0, 0])(data)
    );
}

export function seriesColorRange(settings, data, valueName, customExtent) {
    let extent =
        customExtent ||
        domain()
            .valueName(valueName)
            .pad([0, 0])(data);
    let interpolator = settings.colorStyles.interpolator.full;

    if (extent[0] >= 0) {
        interpolator = settings.colorStyles.interpolator.positive;
    } else if (extent[1] <= 0) {
        interpolator = settings.colorStyles.interpolator.negative;
    } else {
        const maxVal = Math.max(-extent[0], extent[1]);
        extent = [-maxVal, maxVal];
    }

    return d3.scaleSequential(interpolator).domain(extent);
}
