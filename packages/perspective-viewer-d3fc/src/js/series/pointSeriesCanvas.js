/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {seriesCanvasPoint} from "d3fc";
import {withOpacity, withoutOpacity} from "./seriesColours";
import {groupFromKey} from "./seriesKey";
import {fromDomain} from "./seriesSymbols";

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

    series.decorate((context, d) => {
        if (colour) {
            const color = colour(d.colorValue !== undefined ? d.colorValue : seriesKey);

            context.strokeStyle = withoutOpacity(color);
            context.fillStyle = withOpacity(color);
        } else {
            context.strokeStyle = "rgb(31, 119, 180)";
            context.fillStyle = "rgba(31, 119, 180, 0.5)";
        }
    });

    return series;
}

export function symbolTypeFromGroups(settings) {
    const col = settings.data && settings.data.length > 0 ? settings.data[0] : {};
    const domain = [];
    Object.keys(col).forEach(key => {
        if (key !== "__ROW_PATH__") {
            const group = groupFromKey(key);
            if (!domain.includes(group)) {
                domain.push(group);
            }
        }
    });
    return fromDomain(domain);
}
