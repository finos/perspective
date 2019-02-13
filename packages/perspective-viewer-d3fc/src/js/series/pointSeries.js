/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import {tooltip} from "../tooltip/tooltip";

export function pointSeries(settings, colour, seriesKey, size) {
    let series = fc
        .seriesSvgPoint()
        .crossValue(d => d.x)
        .mainValue(d => d.y);

    if (size) {
        series.size(d => size(d.size));
    }

    series.decorate(selection => {
        tooltip(selection, settings);
        if (colour) {
            selection.style("stroke", () => colour(seriesKey)).style("fill", () => withOpacity(colour(seriesKey)));
        }
    });

    return series;
}

function withOpacity(colour) {
    const toInt = offset => parseInt(colour.substring(offset, offset + 2), 16);
    return `rgba(${toInt(1)},${toInt(3)},${toInt(5)},0.5)`;
}
