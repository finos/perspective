/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import { withoutOpacity } from "./seriesColors.js";

export function lineSeries(settings, color) {
    let series = fc.seriesSvgLine();

    const estimated_size =
        settings.data.length *
        (settings.data?.length > 0
            ? Object.keys(settings.data[0]).length -
              (settings.crossValues?.length > 0 ? 1 : 0)
            : 0);
    const stroke_width = Math.max(
        1,
        Math.min(3, Math.floor(settings.size.width / estimated_size / 2))
    );

    series = series.decorate((selection) => {
        selection
            .style("stroke", (d) => withoutOpacity(color(d[0] && d[0].key)))
            .style("stroke-width", stroke_width);
    });

    return series.crossValue((d) => d.crossValue).mainValue((d) => d.mainValue);
}
