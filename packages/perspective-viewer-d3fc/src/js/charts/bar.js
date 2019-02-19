/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import * as crossAxis from "../axis/crossAxis";
import * as mainAxis from "../axis/mainAxis";
import {barSeries} from "../series/barSeries";
import {seriesColours} from "../series/seriesColours";
import {groupAndStackData} from "../data/groupAndStackData";
import {legend, filterData} from "../legend/legend";
import {withGridLines} from "../gridlines/gridlines";

import chartSvgCartesian from "../d3fc/chart/svg/cartesian";

function barChart(container, settings) {
    const data = groupAndStackData(settings, filterData(settings));
    const colour = seriesColours(settings);
    legend(container, settings, colour);

    const series = fc
        .seriesSvgMulti()
        .mapping((data, index) => data[index])
        .series(
            data.map(() =>
                barSeries(settings, colour)
                    .align("left")
                    .orient("horizontal")
            )
        );

    const chart = chartSvgCartesian(mainAxis.scale(settings), crossAxis.scale(settings))
        .xDomain(mainAxis.domain(settings, data))
        .yDomain(crossAxis.domain(settings, data))
        .yOrient("left")
        .plotArea(withGridLines(series).orient("horizontal"));

    crossAxis.styleAxis(chart, "y", settings);
    mainAxis.styleAxis(chart, "x", settings);

    // render
    container.datum(data).call(chart);
}
barChart.plugin = {
    type: "d3_x_bar",
    name: "[d3fc] X Bar Chart",
    max_size: 25000
};

export default barChart;
