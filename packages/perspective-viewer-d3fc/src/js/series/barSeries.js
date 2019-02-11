/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import * as fc from "d3fc";

export function barSeries(settings, colour) {
    let series = settings.mainValues.length > 1 ? fc.seriesSvgGrouped(fc.seriesSvgBar()) : fc.seriesSvgBar();

    if (colour) {
        series = series.decorate(selection => {
            selection.style("fill", d => colour(d.key));
        });
    }

    return fc
        .autoBandwidth(series)
        .crossValue(d => d.crossValue)
        .mainValue(d => d.mainValue)
        .baseValue(d => d.baseValue);
}

export function barColours(settings) {
    const col = settings.data && settings.data.length > 0 ? settings.data[0] : {};
    const domain = Object.keys(col).filter(k => k !== "__ROW_PATH__");
    return domain.length > 1 ? d3.scaleOrdinal(d3.schemeCategory10).domain(domain) : null;
}
