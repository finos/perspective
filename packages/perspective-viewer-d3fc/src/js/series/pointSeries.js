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
import {withOutOpacity} from "./seriesColours.js";

export function pointSeries(settings, colour, seriesKey, size) {
    let series = fc
        .seriesSvgPoint()
        .crossValue(d => d.x)
        .mainValue(d => d.y);

    if (size) {
        series.size(d => size(d.size));
    }

    series.decorate(selection => {
        tooltip()(selection, settings);
        if (colour) {
            selection.style("stroke", () => withOutOpacity(colour(seriesKey))).style("fill", () => colour(seriesKey));
        }
    });

    return series;
}
