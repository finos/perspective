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
import {withoutOpacity} from "./seriesColours";
import {fromDomain} from "./seriesSymbols";

export function categoryPointSeries(settings, seriesKey, colour, symbols) {
    let series = fc.seriesSvgPoint().size(100);

    if (symbols) {
        series.type(symbols(seriesKey));
    }

    series.decorate(selection => {
        tooltip()(selection, settings);
        if (colour) {
            selection.style("stroke", d => withoutOpacity(colour(d.colorValue || seriesKey))).style("fill", d => colour(d.colorValue || seriesKey));
        }
    });

    return series.crossValue(d => d.crossValue).mainValue(d => d.mainValue);
}

export function symbolType(settings) {
    const col = settings.data && settings.data.length > 0 ? settings.data[0] : {};
    const domain = Object.keys(col).filter(k => k !== "__ROW_PATH__");
    return fromDomain(domain);
}
