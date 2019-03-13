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
import {ohlcData} from "../data/ohlcData";
import {filterData} from "../legend/filter";
import {withGridLines} from "../gridlines/gridlines";

import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";
import {extentLinear as customExtent} from "../d3fc/extent/extentLinear";

function ohlc(container, settings) {
    const data = ohlcData(settings, filterData(settings));

    const series = fc
        .seriesSvgOhlc()
        .crossValue(d => d.crossValue)
        .openValue(d => d.openValue)
        .highValue(d => d.highValue)
        .lowValue(d => d.lowValue)
        .closeValue(d => d.closeValue);

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.1, 0.1])
        .padUnit("percent");

    const xDomain = crossAxis.domain(settings)(data);
    const xScale = crossAxis.scale(settings);
    const xAxis = crossAxis.axisFactory(settings).domain(xDomain)();
    const yScale = mainAxis.scale(settings);

    const yDomain = customExtent()
        .accessors([d => d.lowValue, d => d.highValue])
        .paddingStrategy(paddingStrategy)(data);

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
        .yDomain(yDomain)
        .yLabel(mainAxis.label(settings))
        .yOrient("left")
        .yNice()
        .plotArea(withGridLines(series).orient("vertical"));

    chart.xPaddingInner && chart.xPaddingInner(1);
    chart.xPaddingOuter && chart.xPaddingOuter(0.5);

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xScale)
        .yScale(yScale);

    const toolTip = nearbyTip()
        .settings(settings)
        .xScale(xScale)
        .yScale(yScale)
        .yValueName("closeValue")
        .data(data);

    // render
    container.datum(data).call(zoomChart);
    container.call(toolTip);
}

ohlc.plugin = {
    type: "d3_ohlc",
    name: "[d3fc] OHLC Chart",
    max_size: 25000
};

export default ohlc;
