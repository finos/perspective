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
import {categoryPointSeries, symbolType} from "../series/categoryPointSeries";
import {groupData} from "../data/groupData";
import {symbolLegend} from "../legend/legend";
import {filterData} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";

function yScatter(container, settings) {
    const data = groupData(settings, filterData(settings));
    const symbols = symbolType(settings);
    const color = seriesColors(settings);

    const legend = symbolLegend()
        .settings(settings)
        .scale(symbols)
        .color(color);

    const series = fc
        .seriesSvgMulti()
        .mapping((data, index) => data[index])
        .series(data.map(series => categoryPointSeries(settings, series.key, color, symbols)));

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.05, 0.05])
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
