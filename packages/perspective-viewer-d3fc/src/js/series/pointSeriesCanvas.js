/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import seriesCanvasPoint from "../d3fc/series/canvas/point";
import {withOpacity, withoutOpacity} from "./seriesColours";

export function pointSeriesCanvas(settings, seriesKey, size, colour, symbols) {
    let series = seriesCanvasPoint()
        .crossValue(d => d.x)
        .mainValue(d => d.y);

    if (size) {
        series.size(d => size(d.size));
    }
    if (symbols) {
        series.type(symbols(seriesKey));
    }

    series.decorate((context, datum) => {
        if (colour) {
            context.strokeStyle = withoutOpacity(colour(datum.colorValue || seriesKey));
            context.fillStyle = withOpacity(colour(datum.colorValue || seriesKey));
        } else {
            context.strokeStyle = "rgba(31, 119, 180, 0.5)";
            context.fillStyle = "rgba(31, 119, 180, 0.5)";
        }
    });

    return series;
}
