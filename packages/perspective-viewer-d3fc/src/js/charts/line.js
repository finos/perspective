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
import {seriesColours} from "../series/seriesColours";
import {lineSeries} from "../series/lineSeries";
import {splitData} from "../data/splitData";
import {legend, filterData} from "../legend/legend";
import {withGridLines} from "../gridlines/gridlines";

import chartSvgCartesian from "../d3fc/chart/svg/cartesian";

function lineChart(container, settings) {
    const data = splitData(settings, filterData(settings));
    const colour = seriesColours(settings);
    legend(container, settings, colour);

    const series = fc.seriesSvgRepeat().series(lineSeries(settings, colour).orient("vertical"));

    const chart = chartSvgCartesian(crossAxis.scale(settings), mainAxis.scale(settings))
        .xDomain(crossAxis.domain(settings, data))
        .yDomain(mainAxis.domain(settings, data))
        .yOrient("left")
        .plotArea(withGridLines(series).orient("vertical"));

    crossAxis.styleAxis(chart, "x", settings);
    mainAxis.styleAxis(chart, "y", settings);

    chart.xPadding && chart.xPaddingInner(1);
    chart.xPadding && chart.xPaddingOuter(0.5);

    // render
    container.datum(data).call(chart);
}
lineChart.plugin = {
    type: "d3_y_line",
    name: "[d3fc] Y Line Chart",
    max_size: 25000
};

export default lineChart;
