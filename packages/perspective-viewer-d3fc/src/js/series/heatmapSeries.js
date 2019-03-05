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
import {generateHtmlForHeatmap} from "../tooltip/generateHTML";

export function heatmapSeries(settings, colour) {
    let series = fc.seriesSvgHeatmap();

    series.decorate(selection => {
        tooltip().generateHtml(generateHtmlForHeatmap)(selection, settings);
    });

    return fc
        .autoBandwidth(series)
        .xValue(d => d.crossValue)
        .yValue(d => d.mainValue)
        .colorValue(d => d.colorValue)
        .colorInterpolate(colour.interpolator())
        .xAlign("right")
        .yAlign("top")
        .widthFraction(1.0);
}
