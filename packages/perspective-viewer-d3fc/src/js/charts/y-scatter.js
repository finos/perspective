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
import {categoryPointSeries, symbolType} from "../series/categoryPointSeries";
import {groupData} from "../data/groupData";
import {symbolLegend} from "../legend/legend";
import {filterData} from "../legend/filter";
import {withGridLines} from "../gridlines/gridlines";
import chartSvgCartesian from "../d3fc/chart/svg/cartesian";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";

function yScatter(container, settings) {
    const data = groupData(settings, filterData(settings));
    const symbols = symbolType(settings);
    const colour = seriesColours(settings);

    const legend = symbolLegend()
        .settings(settings)
        .scale(symbols)
        .colour(colour);

    const series = fc
        .seriesSvgMulti()
        .mapping((data, index) => data[index])
        .series(data.map(series => categoryPointSeries(settings, series.key, colour, symbols)));

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.1, 0.1])
        .padUnit("percent");

    const xScale = crossAxis.scale(settings);
    const chart = chartSvgCartesian(xScale, mainAxis.scale(settings))
        .xDomain(crossAxis.domain(settings)(data))
        .yDomain(mainAxis.domain(settings).paddingStrategy(paddingStrategy)(data))
        .yOrient("left")
        .yNice()
        .plotArea(withGridLines(series).orient("vertical"));

    crossAxis.styleAxis(chart, "x", settings);
    mainAxis.styleAxis(chart, "y", settings);

    chart.xPaddingInner && chart.xPaddingInner(1);
    chart.xPaddingOuter && chart.xPaddingOuter(0.5);

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xScale);

    // render
    container.datum(data).call(zoomChart);
    if (legend) {
        container.call(legend);
    }
}
yScatter.plugin = {
    type: "d3_y_scatter",
    name: "[d3fc] Y Scatter Chart",
    max_size: 25000
};

export default yScatter;
