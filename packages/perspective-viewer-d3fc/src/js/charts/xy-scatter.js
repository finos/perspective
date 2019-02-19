/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import * as mainAxis from "../axis/mainAxis";
import {pointSeries} from "../series/pointSeries";
import {pointData} from "../data/pointData";
import {seriesColoursFromGroups} from "../series/seriesColours";
import {seriesLinearRange} from "../series/seriesLinearRange";
import {legend, filterDataByGroup} from "../legend/legend";
import {withGridLines} from "../gridlines/gridlines";

import chartSvgCartesian from "../d3fc/chart/svg/cartesian";

function xyScatter(container, settings) {
    const data = pointData(settings, filterDataByGroup(settings));
    const colour = seriesColoursFromGroups(settings);
    legend(container, settings, colour);

    const size = settings.mainValues.length > 2 ? seriesLinearRange(settings, data, "size").range([10, 10000]) : null;

    const series = fc
        .seriesSvgMulti()
        .mapping((data, index) => data[index])
        .series(data.map(series => pointSeries(settings, colour, series.key, size)));

    const chart = chartSvgCartesian(mainAxis.scale(settings), mainAxis.scale(settings))
        .xDomain(mainAxis.domain(settings, data, "x"))
        .xLabel(settings.mainValues[0].name)
        .yDomain(mainAxis.domain(settings, data, "y"))
        .yLabel(settings.mainValues[1].name)
        .yOrient("left")
        .plotArea(withGridLines(series));

    // render
    container.datum(data).call(chart);
}
xyScatter.plugin = {
    type: "d3_xy_scatter",
    name: "[d3fc] X/Y Scatter",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2
    }
};

export default xyScatter;
