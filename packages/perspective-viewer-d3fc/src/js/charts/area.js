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
import {areaSeries} from "../series/areaSeries";
import {seriesColors} from "../series/seriesColors";
import {splitAndBaseData} from "../data/splitAndBaseData";
import {colorLegend} from "../legend/legend";
import {filterData} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";

import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";

function areaChart(container, settings) {
    const data = splitAndBaseData(settings, filterData(settings));

    const color = seriesColors(settings);
    const legend = colorLegend()
        .settings(settings)
        .scale(color);

    const series = fc.seriesSvgRepeat().series(areaSeries(settings, color).orient("vertical"));

    const xDomain = crossAxis.domain(settings)(data);
    const xScale = crossAxis.scale(settings);
    const yScale = mainAxis.scale(settings);
    const xAxis = crossAxis.axisFactory(settings).domain(xDomain)();

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
        .yDomain(
            mainAxis
                .domain(settings)
                .include([0])
                .paddingStrategy(hardLimitZeroPadding())(data)
        )
        .yLabel(crossAxis.label(settings))
        .yOrient("left")
        .yLabel(mainAxis.label(settings))
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
areaChart.plugin = {
    type: "d3_y_area",
    name: "[d3fc] Y Area Chart",
    max_size: 25000
};

export default areaChart;
