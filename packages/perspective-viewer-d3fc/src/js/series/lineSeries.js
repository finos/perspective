/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import {withoutOpacity} from "./seriesColors.js";

export function lineSeries(settings, color) {
    let series = fc.seriesSvgLine();

    series = series.decorate((selection) => {
        selection.style("stroke", (d) =>
            withoutOpacity(color(d[0] && d[0].key))
        );
    });

    return series.crossValue((d) => d.crossValue).mainValue((d) => d.mainValue);
}
