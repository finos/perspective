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
import {groupFromKey} from "./seriesKey";
import {withOpacity, withoutOpacity} from "./seriesColours";
import {fromDomain} from "./seriesSymbols";

export function pointSeries(settings, seriesKey, size, colour, symbols) {
    let series = fc
        .seriesSvgPoint()
        .crossValue(d => d.x)
        .mainValue(d => d.y);

    if (size) {
        series.size(d => size(d.size));
    }
    if (symbols) {
        series.type(symbols(seriesKey));
    }

    series.decorate(selection => {
        tooltip()(selection, settings);
        if (colour) {
            selection.style("stroke", d => withoutOpacity(colour(d.colorValue || seriesKey))).style("fill", d => withOpacity(colour(d.colorValue || seriesKey)));
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
