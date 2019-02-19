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

export function barSeries(settings, colour) {
    let series = settings.mainValues.length > 1 ? fc.seriesSvgGrouped(fc.seriesSvgBar()) : fc.seriesSvgBar();

    series = series.decorate(selection => {
        tooltip(selection, settings);
        if (colour) {
            selection.style("fill", d => colour(d.key));
        }
    });

    return fc
        .autoBandwidth(series)
        .crossValue(d => d.crossValue)
        .mainValue(d => d.mainValue)
        .baseValue(d => d.baseValue);
}
