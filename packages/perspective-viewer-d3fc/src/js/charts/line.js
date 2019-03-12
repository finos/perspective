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
import {seriesColors} from "../series/seriesColors";
import {lineSeries} from "../series/lineSeries";
import {splitData} from "../data/splitData";
import {colorLegend} from "../legend/legend";
import {filterData} from "../legend/filter";
import {withGridLines} from "../gridlines/gridlines";

import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";

function lineChart(container, settings) {
    const data = splitData(settings, filterData(settings));
    const color = seriesColors(settings);

    const legend = colorLegend()
        .settings(settings)
        .scale(color);

    const series = fc.seriesSvgRepeat().series(lineSeries(settings, color).orient("vertical"));

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.1, 0.1])
        .padUnit("percent");

    const xDomain = crossAxis.domain(settings)(data);
    const xScale = crossAxis.scale(settings);
    const xAxis = crossAxis.axisFactory(settings).domain(xDomain)();
    const yScale = mainAxis.scale(settings);

    const chart = fc
        .chartSvgCartesian({
            xScale,
            yScale,
            xAxis
        })
        .xDomain(xDomain)
        .xLabel(crossAxis.label(settings))
        .xAxisHeight(xAxis.size)
        .xDecorate(xAxis.decorate)
        .yDomain(mainAxis.domain(settings).paddingStrategy(paddingStrategy)(data))
        .yLabel(mainAxis.label(settings))
        .yOrient("left")
        .yNice()
        .plotArea(withGridLines(series).orient("vertical"));

    chart.xPaddingInner && chart.xPaddingInner(1);
    chart.xPaddingOuter && chart.xPaddingOuter(0.5);

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xScale);

    const toolTip = nearbyTip()
        .settings(settings)
        .xScale(xScale)
        .yScale(yScale)
        .color(color)
        .data(data);

    // render
    container.datum(data).call(zoomChart);
    container.call(toolTip);
    container.call(legend);
}

lineChart.plugin = {
    type: "d3_y_line",
    name: "[d3fc] Y Line Chart",
    max_size: 25000
};

export default lineChart;
