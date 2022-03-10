/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";

export function areaSeries(settings, color) {
    let series = fc.seriesSvgArea();

    series = series.decorate((selection) => {
        selection.style("fill", (d) => color(d[0].key)).style("opacity", 0.5);
    });

    return series
        .crossValue((d) => d.crossValue)
        .mainValue((d) => d.mainValue)
        .baseValue((d) => d.baseValue);
}
