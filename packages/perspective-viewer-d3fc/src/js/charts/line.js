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
import {colourLegend} from "../legend/legend";
import {filterData} from "../legend/filter";
import {withGridLines} from "../gridlines/gridlines";

import chartSvgCartesian from "../d3fc/chart/svg/cartesian";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";

function lineChart(container, settings) {
    const data = splitData(settings, filterData(settings));
    const colour = seriesColours(settings);

    const legend = colourLegend()
        .settings(settings)
        .scale(colour);

    const series = fc.seriesSvgRepeat().series(lineSeries(settings, colour).orient("vertical"));

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.1, 0.1])
        .padUnit("percent");

    const chart = chartSvgCartesian(crossAxis.scale(settings), mainAxis.scale(settings))
        .xDomain(crossAxis.domain(settings)(data))
        .yDomain(mainAxis.domain(settings).paddingStrategy(paddingStrategy)(data))
        .yOrient("left")
        .yNice()
        .plotArea(withGridLines(series).orient("vertical"));

    crossAxis.styleAxis(chart, "x", settings);
    mainAxis.styleAxis(chart, "y", settings);

    chart.xPaddingInner && chart.xPaddingInner(1);
    chart.xPaddingOuter && chart.xPaddingOuter(0.5);

    // render
    container.datum(data).call(chart);
    container.call(legend);
}
lineChart.plugin = {
    type: "d3_y_line",
    name: "[d3fc] Y Line Chart",
    max_size: 25000
};

export default lineChart;
