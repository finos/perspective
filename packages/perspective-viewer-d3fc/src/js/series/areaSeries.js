/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";

export function areaSeries(settings, colour) {
    let series = fc.seriesSvgArea();

    series = series.decorate(selection => {
        if (colour) {
            selection.style("fill", d => colour(d[0].key));
        }
    });

    return series.crossValue(d => d.crossValue).mainValue(d => d.mainValue);
}
